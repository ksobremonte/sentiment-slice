import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logToSystem } from '../_shared/systemLog.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const endpoint = "/check-replies";

  try {
    const { conversationId, lastSeenTimestamp, loadAll } = await req.json() as {
      conversationId: string;
      lastSeenTimestamp?: string;
      loadAll?: boolean;
    };

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) throw new Error("Missing config");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // If loadAll is true, return all messages (for history restore)
    if (loadAll) {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      await logToSystem({ endpoint, method: "POST", status_code: 200, level: "success", message: `Loaded all messages for conversation` });
      return new Response(JSON.stringify({ messages: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if admin is currently typing
    const { data: convo } = await supabase
      .from("chat_conversations")
      .select("admin_typing_at")
      .eq("id", conversationId)
      .single();

    const adminTyping = convo?.admin_typing_at
      ? (Date.now() - new Date(convo.admin_typing_at).getTime()) < 5000
      : false;

    // Otherwise, return only admin messages (for polling)
    let query = supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .eq("role", "admin")
      .order("created_at", { ascending: true });

    if (lastSeenTimestamp) {
      query = query.gt("created_at", lastSeenTimestamp);
    }

    const { data, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ messages: data || [], adminTyping }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-replies error:", error);
    await logToSystem({ endpoint, method: "POST", status_code: 500, level: "error", message: "An error occurred" });
    return new Response(
      JSON.stringify({ error: "An error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
