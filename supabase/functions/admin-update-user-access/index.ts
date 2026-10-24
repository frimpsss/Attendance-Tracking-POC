// Supabase Edge Function: admin-update-user-access
// Validates calling user's active 'admin' role from the database, then updates
// user active status, role assignment, or initiates a password reset link, with audit logging.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdateAccessPayload {
  targetUserId: string;
  isActive?: boolean;
  newRole?: "admin" | "lecturer" | "student";
  sendPasswordReset?: boolean;
  reason?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser();

    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: "Invalid or expired session token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as UpdateAccessPayload;
    if (!body.targetUserId) {
      return new Response(JSON.stringify({ error: "targetUserId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call the database-enforced RPC as the authenticated admin caller
    const { data: rpcResult, error: rpcError } = await callerClient.rpc(
      "admin_update_user_access",
      {
        p_target_user_id: body.targetUserId,
        p_is_active: typeof body.isActive === "boolean" ? body.isActive : null,
        p_new_role: body.newRole ?? null,
        p_reason: body.reason ?? "Updated via Admin Portal",
      },
    );

    if (rpcError) {
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // If deactivating account, also ban/unban at Supabase Auth level
    if (typeof body.isActive === "boolean") {
      await adminClient.auth.admin.updateUserById(body.targetUserId, {
        ban_duration: body.isActive ? "none" : "87600h",
      });
    }

    if (body.sendPasswordReset) {
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("email")
        .eq("id", body.targetUserId)
        .single();
      if (targetProfile?.email) {
        await callerClient.auth.resetPasswordForEmail(targetProfile.email);
      }
    }

    return new Response(JSON.stringify({ data: rpcResult }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
