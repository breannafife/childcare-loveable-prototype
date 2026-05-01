// OAuth callback: exchanges the code for tokens, persists them, then redirects
// the user back to where they started (with ?google=connected for UI feedback).
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { exchangeCodeForTokens, fetchGoogleUserInfo } from "@/server/google-calendar.server";

export const Route = createFileRoute("/api/public/google/oauth/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errorParam = url.searchParams.get("error");

        if (errorParam) {
          return redirectBack("/", `google_error=${encodeURIComponent(errorParam)}`);
        }
        if (!code || !state) {
          return new Response("Missing code or state", { status: 400 });
        }

        // Verify state HMAC
        const [stateB64, sig] = state.split(".");
        if (!stateB64 || !sig) return new Response("Bad state", { status: 400 });
        const expected = await hmac(stateB64, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        if (!timingSafeEqual(sig, expected)) {
          return new Response("Invalid state signature", { status: 401 });
        }

        let payload: { u: string; r: string; t: number };
        try {
          payload = JSON.parse(atob(stateB64));
        } catch {
          return new Response("Bad state payload", { status: 400 });
        }
        // 10-minute window
        if (Date.now() - payload.t > 10 * 60 * 1000) {
          return new Response("State expired", { status: 401 });
        }

        const tokens = await exchangeCodeForTokens(code, url.origin);
        if (!tokens.refresh_token) {
          // No refresh token means user previously consented — they need to revoke and retry.
          return redirectBack(payload.r, "google_error=missing_refresh_token");
        }
        const userInfo = await fetchGoogleUserInfo(tokens.access_token);
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        const { error: upsertErr } = await supabaseAdmin
          .from("google_calendar_connections")
          .upsert(
            {
              user_id: payload.u,
              google_email: userInfo.email,
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token,
              expires_at: expiresAt,
              scope: tokens.scope,
            },
            { onConflict: "user_id" },
          );
        if (upsertErr) {
          console.error("connection upsert failed", upsertErr);
          return redirectBack(payload.r, "google_error=storage_failed");
        }

        return redirectBack(payload.r, "google=connected");
      },
    },
  },
});

function redirectBack(path: string, query: string): Response {
  const sep = path.includes("?") ? "&" : "?";
  return new Response(null, { status: 302, headers: { Location: `${path}${sep}${query}` } });
}

async function hmac(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
