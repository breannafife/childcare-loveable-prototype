// Server-only Google Calendar / OAuth helpers.
// Imported by server functions and server routes only — never by components.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "openid",
  "email",
].join(" ");

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const CAL_API = "https://www.googleapis.com/calendar/v3";

function clientCreds() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth client credentials are not configured.");
  }
  return { clientId, clientSecret };
}

export function getRedirectUri(origin: string) {
  return `${origin}/api/public/google/oauth/callback`;
}

export function buildAuthUrl(opts: {
  origin: string;
  state: string;
  loginHint?: string;
}) {
  const { clientId } = clientCreds();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(opts.origin),
    response_type: "code",
    scope: GOOGLE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state: opts.state,
  });
  if (opts.loginHint) params.set("login_hint", opts.loginHint);
  return `${AUTH_URL}?${params.toString()}`;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
  id_token?: string;
}

export async function exchangeCodeForTokens(code: string, origin: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = clientCreds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${t}`);
  }
  return res.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret } = clientCreds();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${t}`);
  }
  return res.json();
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<{ email: string; sub: string }> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`userinfo failed: ${res.status}`);
  const data = await res.json();
  return { email: data.email, sub: data.id };
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  }).catch(() => {});
}

/**
 * Fetch a user's stored Google connection and return a valid access token,
 * refreshing if necessary. Returns null when the user has no connection.
 */
export async function getValidAccessToken(userId: string): Promise<{ accessToken: string; email: string } | null> {
  const { data: conn, error } = await supabaseAdmin
    .from("google_calendar_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!conn) return null;

  const expiresAt = new Date(conn.expires_at).getTime();
  const now = Date.now();
  if (expiresAt - now > 60_000) {
    return { accessToken: conn.access_token, email: conn.google_email };
  }

  // Refresh
  const refreshed = await refreshAccessToken(conn.refresh_token);
  const newExpires = new Date(now + refreshed.expires_in * 1000).toISOString();
  await supabaseAdmin
    .from("google_calendar_connections")
    .update({
      access_token: refreshed.access_token,
      expires_at: newExpires,
      scope: refreshed.scope ?? conn.scope,
    })
    .eq("user_id", userId);
  return { accessToken: refreshed.access_token, email: conn.google_email };
}

export interface BusyRange {
  start: string;
  end: string;
}

export async function freeBusy(accessToken: string, timeMin: string, timeMax: string, calendarId = "primary"): Promise<BusyRange[]> {
  const res = await fetch(`${CAL_API}/freeBusy`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`freeBusy failed: ${res.status} ${t}`);
  }
  const data = await res.json();
  return data.calendars?.[calendarId]?.busy ?? [];
}

export interface CreateEventArgs {
  accessToken: string;
  calendarId?: string;
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  attendees?: { email: string }[];
  createMeet?: boolean;
  requestId?: string; // for conferenceData
}

export interface CreatedEvent {
  id: string;
  htmlLink?: string;
  hangoutLink?: string;
  conferenceData?: any;
}

export async function createCalendarEvent(args: CreateEventArgs): Promise<CreatedEvent> {
  const calendarId = args.calendarId ?? "primary";
  const body: any = {
    summary: args.summary,
    description: args.description,
    start: { dateTime: args.startISO },
    end: { dateTime: args.endISO },
  };
  if (args.attendees && args.attendees.length > 0) body.attendees = args.attendees;
  if (args.createMeet) {
    body.conferenceData = {
      createRequest: {
        requestId: args.requestId ?? crypto.randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }
  const url = new URL(`${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events`);
  if (args.createMeet) url.searchParams.set("conferenceDataVersion", "1");
  url.searchParams.set("sendUpdates", "all");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`createEvent failed: ${res.status} ${t}`);
  }
  return res.json();
}

export async function deleteCalendarEvent(accessToken: string, eventId: string, calendarId = "primary") {
  const url = new URL(`${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`);
  url.searchParams.set("sendUpdates", "all");
  const res = await fetch(url.toString(), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  // 410 = already gone, treat as success
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const t = await res.text();
    throw new Error(`deleteEvent failed: ${res.status} ${t}`);
  }
}
