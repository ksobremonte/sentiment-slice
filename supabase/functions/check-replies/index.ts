import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
