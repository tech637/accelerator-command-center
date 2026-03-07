import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AcceptInvitePayload = {
  workspaceId?: string;
  invitedEmail?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

const normalizeEmail = (value: string) => value.trim().toLowerCase();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "Missing required function secrets" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Missing bearer token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !user?.email) {
    return json(401, { error: "Invalid session token" });
  }

  let body: AcceptInvitePayload;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON payload" });
  }

  const workspaceId = body.workspaceId?.trim();
  if (!workspaceId) {
    return json(400, { error: "workspaceId is required" });
  }

  const sessionEmail = normalizeEmail(user.email);
  const requestedEmail = body.invitedEmail ? normalizeEmail(body.invitedEmail) : sessionEmail;

  if (requestedEmail !== sessionEmail) {
    return json(403, {
      error: "This invite was sent to a different email",
      expectedEmail: requestedEmail,
      actualEmail: sessionEmail,
    });
  }

  const { data: invite, error: inviteError } = await adminClient
    .from("team_members")
    .select("id, workspace_id, email, name, role, status, invited_at, accepted_at")
    .eq("workspace_id", workspaceId)
    .eq("email", sessionEmail)
    .maybeSingle();

  if (inviteError) {
    console.error("invite_accept_failed_lookup", inviteError);
    return json(500, { error: "Failed to load invite" });
  }

  if (!invite) {
    return json(404, { error: "No invite found for this workspace and email" });
  }

  if (invite.role !== "program_manager" && invite.role !== "mentor" && invite.role !== "admin") {
    return json(400, { error: "Invite has an unsupported role" });
  }

  const { error: roleError } = await adminClient.from("user_roles").upsert(
    {
      user_id: user.id,
      workspace_id: workspaceId,
      role: invite.role,
    },
    { onConflict: "user_id,workspace_id" },
  );

  if (roleError) {
    console.error("invite_accept_failed_role_upsert", roleError);
    return json(500, { error: "Failed to grant workspace role" });
  }

  if (invite.status !== "active") {
    const { error: memberError } = await adminClient
      .from("team_members")
      .update({
        status: "active",
        accepted_at: new Date().toISOString(),
        invited_at: invite.invited_at ?? invite.accepted_at ?? new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (memberError) {
      console.error("invite_accept_failed_member_update", memberError);
      return json(500, { error: "Failed to activate invite" });
    }
  }

  console.log("invite_accepted", {
    workspace_id: workspaceId,
    email: sessionEmail,
    role: invite.role,
    user_id: user.id,
  });

  return json(200, {
    ok: true,
    status: "active",
    workspaceId,
    role: invite.role,
    email: sessionEmail,
  });
});
