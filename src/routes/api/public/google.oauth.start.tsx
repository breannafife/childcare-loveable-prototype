// Initiates the Google Calendar OAuth flow.
// Requires `?token=<supabase access token>&redirect=<path>` so we can identify
// the user when Google calls us back. The token is signed via Supabase, so we
// validate it server-side to bind the resulting Google connection to the right user.
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { buildAuthUrl } from "@/server/google-calendar.server";

export const Route = createFileRoute("/api/public/google/oauth/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");
        const redirectAfter = url.searchParams.get("redirect") ?? "/";
        if (!token) {
          return new Response("Missing token", { status: 400 });
        }

        const supaUrl = process.env.SUPABASE_URL!;
        const supaKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const supabase = createClient(supaUrl, supaKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data, error } = await supabase.auth.getClaims(token);
        if (error || !data?.claims?.sub) {
          return new Response("Invalid token", { status: 401 });
        }
        const userId = data.claims.sub;
        const email = (data.claims as any).email as string | undefined;

        // State carries: userId + redirectAfter, signed with HMAC so callback can trust it.
        const statePayload = JSON.stringify({ u: userId, r: redirectAfter, t: Date.now() });
        const stateB64 = btoa(statePayload);
        const sig = await hmac(stateB64, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const state = `${stateB64}.${sig}`;

        const origin = url.origin;
        const authUrl = buildAuthUrl({ origin, state, loginHint: email });

        return new Response(null, {
          status: 302,
          headers: { Location: authUrl },
        });
      },
    },
  },
});

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
