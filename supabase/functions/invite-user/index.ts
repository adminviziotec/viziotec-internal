// Supabase Edge Function: invite-user
// Invites a new user by email. Runs server-side with the service-role key so the
// privileged admin API is never exposed to the browser. The caller must be an
// authenticated owner/co-owner; only owners may invite another owner.
//
// Deploy:  supabase functions deploy invite-user
// (SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are injected
//  automatically by the Supabase runtime.)

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_ROLES = ["owner", "co_owner", "team_member"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing authorization header" }, 401);

  // Identify the caller from their JWT.
  const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user: caller },
    error: callerErr,
  } = await callerClient.auth.getUser();
  if (callerErr || !caller) return json({ error: "Not authenticated" }, 401);

  // Verify the caller's role.
  const { data: profile } = await callerClient
    .from("users")
    .select("role")
    .eq("id", caller.id)
    .maybeSingle();
  const callerRole = profile?.role as Role | undefined;
  if (callerRole !== "owner" && callerRole !== "co_owner") {
    return json({ error: "Only owners and co-owners can invite users" }, 403);
  }

  let body: { email?: string; full_name?: string; role?: string; position?: string; redirect_to?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim() ?? "";
  const role = (body.role ?? "team_member") as Role;
  const position = body.position?.trim() || null;

  if (!email || !email.includes("@")) return json({ error: "A valid email is required" }, 400);
  if (!ALLOWED_ROLES.includes(role)) return json({ error: "Invalid role" }, 400);
  if (role === "owner" && callerRole !== "owner") {
    return json({ error: "Only an owner can invite another owner" }, 403);
  }

  // Privileged admin client — send the invite email and seed profile metadata.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName, role, position },
    redirectTo: body.redirect_to,
  });

  if (error) {
    const status = /already.*registered|exists/i.test(error.message) ? 409 : 400;
    return json({ error: error.message }, status);
  }

  return json({ ok: true, user_id: data.user?.id, email });
});
