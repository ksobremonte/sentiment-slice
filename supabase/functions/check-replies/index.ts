import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logToSystem } from '../_shared/systemLog.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Simple in-memory IP throttle: max 120 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 120;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const endpoint = "/check-replies";

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { conversationId, lastSeenTimestamp, loadAll } = await req.json() as {
      conversationId: string;
      lastSeenTimestamp?: string;
      loadAll?: boolean;
    };

    if (typeof conversationId !== "string" || !UUID_REGEX.test(conversationId)) {
      return new Response(JSON.stringify({ error: "Invalid conversation ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lastSeenTimestamp !== undefined) {
      if (typeof lastSeenTimestamp !== "string" || Number.isNaN(Date.parse(lastSeenTimestamp))) {
        return new Response(JSON.stringify({ error: "Invalid timestamp" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
