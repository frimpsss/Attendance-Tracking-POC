// Supabase Edge Function: admin-create-user
// Authenticates the calling user via JWT, verifies active 'admin' role from the database,
// provisions the user in Supabase Auth (createUser or inviteUserByEmail), and creates
// canonical rows in profiles, user_roles, students/lecturers, and audit_logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserPayload {
  email: string;
  fullName: string;
  phone?: string;
  role: "student" | "lecturer" | "admin";
  password?: string;
  invite?: boolean;
  departmentId?: string;
  studentNumber?: string;
  academicLevel?: string;
  staffNumber?: string;
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

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Confirm caller has an active profile and 'admin' role in DB
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("id, is_active")
      .eq("id", caller.id)
      .single();

    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .single();

    if (!callerProfile?.is_active || callerRole?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: active administrator privileges required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json()) as CreateUserPayload;
    const email = (body.email ?? "").trim().toLowerCase();
    const fullName = (body.fullName ?? "").trim();

    if (!email || !fullName || !["student", "lecturer", "admin"].includes(body.role)) {
      return new Response(
        JSON.stringify({ error: "email, fullName, and valid role are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.role === "student" && (!body.studentNumber || !body.departmentId)) {
      return new Response(
        JSON.stringify({ error: "studentNumber and departmentId are required for students" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body.role === "lecturer" && (!body.staffNumber || !body.departmentId)) {
      return new Response(
        JSON.stringify({ error: "staffNumber and departmentId are required for lecturers" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let createdUserId: string | null = null;

    if (body.invite && !body.password) {
      const { data: inviteData, error: inviteError } =
        await adminClient.auth.admin.inviteUserByEmail(email, {
          data: { full_name: fullName },
        });
      if (inviteError || !inviteData.user) {
        return new Response(
          JSON.stringify({ error: inviteError?.message ?? "Failed to invite Auth user" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      createdUserId = inviteData.user.id;
    } else {
      const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: body.password || crypto.randomUUID() + "Aa1!",
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });
      if (createError || !createData.user) {
        return new Response(
          JSON.stringify({ error: createError?.message ?? "Failed to create Auth user" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      createdUserId = createData.user.id;
    }

    // Insert profile, role, and student/lecturer rows; roll back Auth user on partial failure
    try {
      const { error: profileErr } = await adminClient.from("profiles").upsert({
        id: createdUserId,
        full_name: fullName,
        email,
        phone: body.phone?.trim() || null,
        is_active: true,
      });
      if (profileErr) throw profileErr;

      const { error: roleErr } = await adminClient.from("user_roles").upsert({
        user_id: createdUserId,
        role: body.role,
      });
      if (roleErr) throw roleErr;

      if (body.role === "student") {
        const { error: studentErr } = await adminClient.from("students").upsert({
          user_id: createdUserId,
          student_number: body.studentNumber!.trim().toUpperCase(),
          department_id: body.departmentId!,
          academic_level: body.academicLevel?.trim() || "100",
        });
        if (studentErr) throw studentErr;
      } else if (body.role === "lecturer") {
        const { error: lecturerErr } = await adminClient.from("lecturers").upsert({
          user_id: createdUserId,
          staff_number: body.staffNumber!.trim().toUpperCase(),
          department_id: body.departmentId!,
        });
        if (lecturerErr) throw lecturerErr;
      }

      await adminClient.from("audit_logs").insert({
        actor_id: caller.id,
        action: "admin_create_user",
        entity_type: "profile",
        entity_id: createdUserId,
        new_data: {
          email,
          full_name: fullName,
          role: body.role,
          department_id: body.departmentId ?? null,
          student_number: body.studentNumber ?? null,
          staff_number: body.staffNumber ?? null,
        },
        reason: "Provisioned via Admin Portal",
      });
    } catch (dbErr) {
      if (createdUserId) {
        await adminClient.auth.admin.deleteUser(createdUserId);
      }
      const message = dbErr instanceof Error ? dbErr.message : "Database provisioning failed";
      return new Response(JSON.stringify({ error: message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        userId: createdUserId,
        email,
        fullName,
        role: body.role,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
