import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type InviteRole = "program_manager" | "mentor";

type SendInvitePayload = {
  workspaceId?: string;
  name?: string;
  email?: string;
  role?: InviteRole;
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
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const resendFrom = Deno.env.get("RESEND_FROM_EMAIL") ?? "ERRA Accelerator <onboarding@resend.dev>";
  const appBaseUrl = Deno.env.get("APP_BASE_URL") ?? req.headers.get("origin") ?? "http://localhost:5173";

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return json(500, { error: "Missing required function secrets" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return json(401, { error: "Missing bearer token" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user: caller },
    error: userError,
  } = await adminClient.auth.getUser(token);

  if (userError || !caller) {
    return json(401, { error: "Invalid session token" });
  }

  let body: SendInvitePayload;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "Invalid JSON payload" });
  }

  const workspaceId = body.workspaceId?.trim();
  const name = body.name?.trim();
  const role = body.role;
  const normalizedEmail = body.email ? normalizeEmail(body.email) : "";

  if (!workspaceId || !name || !normalizedEmail || !role) {
    return json(400, { error: "workspaceId, name, email, and role are required" });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return json(400, { error: "Invalid email format" });
  }

  if (role !== "program_manager" && role !== "mentor") {
    return json(400, { error: "Invalid role" });
  }

  const { data: adminRole, error: roleError } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", caller.id)
    .maybeSingle();

  if (roleError) {
    console.error("invite_failed_role_check", roleError);
    return json(500, { error: "Failed to verify permissions" });
  }

  if (adminRole?.role !== "admin") {
    return json(403, { error: "Only admins can send invites" });
  }

  const { data: existingMember } = await adminClient
    .from("team_members")
    .select("status")
    .eq("workspace_id", workspaceId)
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existingMember?.status === "active") {
    return json(409, { error: "User is already an active member" });
  }

  const redirectTo = `${appBaseUrl.replace(/\/$/, "")}/invite/accept?workspace_id=${encodeURIComponent(workspaceId)}&email=${encodeURIComponent(normalizedEmail)}`;

  const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
    options: { redirectTo },
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error("invite_failed_generate_link", linkError);
    return json(500, { error: "Failed to generate invite link" });
  }

  const nowIso = new Date().toISOString();
  const { error: memberError } = await adminClient.from("team_members").upsert(
    {
      workspace_id: workspaceId,
      email: normalizedEmail,
      name,
      role,
      status: "invited",
      invited_at: nowIso,
      accepted_at: null,
    },
    { onConflict: "workspace_id,email" },
  );

  if (memberError) {
    console.error("invite_failed_upsert_member", memberError);
    return json(500, { error: "Failed to save invite" });
  }

  const emailHtml = `
    <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:560px;margin:0 auto;">
      <h2 style="margin-bottom:12px;">You are invited to ERRA Accelerator</h2>
      <p>Hi ${name},</p>
      <p>You have been invited to join as <strong>${role === "program_manager" ? "Program Manager" : "Mentor"}</strong>.</p>
      <p style="margin:24px 0;">
        <a href="${linkData.properties.action_link}" style="background:#0f766e;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block;">Accept Invite</a>
      </p>
      <p style="font-size:13px;color:#475569;">This invite is bound to <strong>${normalizedEmail}</strong>. Please sign in with that same email.</p>
    </div>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [normalizedEmail],
      subject: `You have been invited to ERRA Accelerator as ${role === "program_manager" ? "Program Manager" : "Mentor"}`,
      html: emailHtml,
    }),
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();
    console.error("invite_failed_resend", resendError);
    return json(500, { error: "Failed to send invite email" });
  }

  console.log("invite_sent", {
    workspace_id: workspaceId,
    invited_email: normalizedEmail,
    role,
    invited_by: caller.id,
  });

  return json(200, { ok: true, email: normalizedEmail });
});
