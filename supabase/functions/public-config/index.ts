import { logToSystem } from '../_shared/systemLog.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // We intentionally allow POST (used by supabase-js invoke).
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hcaptchaSiteKey = Deno.env.get("VITE_HCAPTCHA_SITE_KEY") ?? null;

  await logToSystem({ endpoint: '/public-config', method: 'POST', status_code: 200, level: 'success', message: 'Public config fetched' });

  return new Response(JSON.stringify({ hcaptchaSiteKey }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});