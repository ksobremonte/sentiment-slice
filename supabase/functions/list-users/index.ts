import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is authenticated and is an admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin
    const { data: callerRole, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    console.log("Caller ID:", caller.id, "Role check result:", callerRole, "Error:", roleError);

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Admin access required", callerId: caller.id }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different actions
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "POST" && action === "create") {
      const { email } = await req.json();
      const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

      if (!normalizedEmail) {
        return new Response(JSON.stringify({ error: "Email is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Determine redirect URL for the invitation email
      const siteUrl = Deno.env.get("SITE_URL") || req.headers.get("origin") || "https://pizzavolante-dashboard.lovable.app";

      // Invite user (sends invitation email with accept link)
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(normalizedEmail, {
        redirectTo: `${siteUrl}/accept-invitation`,
      });

      // If user already exists, recover gracefully instead of failing hard.
      if (inviteError) {
        const alreadyRegistered = inviteError.message?.toLowerCase().includes("already been registered");

        if (!alreadyRegistered) {
          return new Response(JSON.stringify({ error: inviteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: usersData, error: usersError } = await adminClient.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (usersError) {
          return new Response(JSON.stringify({ error: usersError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const existingUser = usersData?.users?.find(
          (u) => (u.email || "").toLowerCase() === normalizedEmail
        );

        if (!existingUser) {
          return new Response(JSON.stringify({ error: inviteError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: existingRoles, error: rolesError } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", existingUser.id);

        if (rolesError) {
          return new Response(JSON.stringify({ error: rolesError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (!existingRoles || existingRoles.length === 0) {
          const { error: roleInsertError } = await adminClient.from("user_roles").insert({
            user_id: existingUser.id,
            role: "moderator",
          });

          if (roleInsertError) {
            return new Response(JSON.stringify({ error: roleInsertError.message }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            user: existingUser,
            alreadyRegistered: true,
            message: "Email already exists. Access was restored. Use Reset Password if needed.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Always assign "moderator" (staff) role for invited users
      if (inviteData.user) {
        await adminClient.from("user_roles").insert({
          user_id: inviteData.user.id,
          role: "moderator",
        });
      }

      return new Response(JSON.stringify({ success: true, user: inviteData.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && action === "update-role") {
      const { userId, role } = await req.json();
      
      // Delete existing roles and insert new one
      await adminClient.from("user_roles").delete().eq("user_id", userId);
      await adminClient.from("user_roles").insert({ user_id: userId, role });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && action === "reset-password") {
      const { userId, newPassword } = await req.json();
      
      if (!newPassword || newPassword.length < 6) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (updateError) {
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST" && action === "remove") {
      const { userId } = await req.json();
      // Delete role first, then delete the auth user entirely
      await adminClient.from("user_roles").delete().eq("user_id", userId);
      await adminClient.from("profiles").delete().eq("user_id", userId);
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteError) {
        return new Response(JSON.stringify({ error: deleteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: list users with roles
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user details from auth
    const userIds = roles.map((r: any) => r.user_id);

    // Fetch all user details in parallel for speed
    const usersWithDetails = await Promise.all(
      userIds.map(async (userId: string) => {
        const [authResult, profileResult] = await Promise.all([
          adminClient.auth.admin.getUserById(userId),
          adminClient
            .from("profiles")
            .select("display_name, avatar_url")
            .eq("user_id", userId)
            .maybeSingle(),
        ]);

        const user = authResult.data?.user;
        const profile = profileResult.data;
        const role = roles.find((r: any) => r.user_id === userId);

        return {
          id: role.id,
          user_id: userId,
          email: user?.email || "Unknown",
          display_name: profile?.display_name || user?.email?.split("@")[0] || "User",
          avatar_url: profile?.avatar_url || null,
          role: role.role,
          created_at: role.created_at,
          email_confirmed: !!user?.email_confirmed_at,
          last_sign_in: user?.last_sign_in_at || null,
        };
      })
    );

    return new Response(JSON.stringify(usersWithDetails), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
