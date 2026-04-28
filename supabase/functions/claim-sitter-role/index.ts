// Promotes the calling user from 'parent' to 'sitter' and ensures they have
// a sitters profile row. Used after Google OAuth signup, where the role
// toggle on /auth can't be carried through the OAuth redirect.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "");
    if (!jwt) {
      return json({ error: "Missing authorization" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Verify JWT and get the user
    const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userData.user) {
      return json({ error: "Invalid session" }, 401);
    }
    const user = userData.user;
    const uid = user.id;

    // Build a display name + slug from auth metadata
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const displayName =
      (meta.full_name as string | undefined) ||
      (meta.display_name as string | undefined) ||
      (meta.name as string | undefined) ||
      (user.email ? user.email.split("@")[0] : "Sitter");

    const slugBase = displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const slug = `${slugBase || "sitter"}-${uid.slice(0, 8)}`;

    // Replace 'parent' role with 'sitter' (idempotent)
    await admin.from("user_roles").delete().eq("user_id", uid).eq("role", "parent");
    const { error: insRoleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: uid, role: "sitter" }, { onConflict: "user_id,role" });
    if (insRoleErr) throw insRoleErr;

    // Ensure a sitters row exists for this user
    const { data: existing, error: selErr } = await admin
      .from("sitters")
      .select("id")
      .eq("user_id", uid)
      .maybeSingle();
    if (selErr) throw selErr;

    if (!existing) {
      const { error: insSitterErr } = await admin.from("sitters").insert({
        user_id: uid,
        name: displayName,
        slug,
        photo_url: (meta.avatar_url as string | undefined) ?? "",
        bio: "",
        hourly_rate: 0,
        postal_code: "",
        distance_miles: 0,
        years_experience: 0,
        is_verified: false,
        kids_in_area: 0,
        rebooked_by_families: 0,
        rating: 0,
        availability: [],
        experience_tags: [],
        certifications: [],
      });
      if (insSitterErr) throw insSitterErr;
    }

    return json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("claim-sitter-role failed:", message);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
