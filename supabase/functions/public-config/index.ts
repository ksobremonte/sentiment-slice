const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const getConfiguredSiteKey = (): string | null => {
  const candidates = [
    Deno.env.get("VITE_HCAPTCHA_SITE_KEY"),
    Deno.env.get("HCAPTCHA_SITE_KEY"),
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const hcaptchaSiteKey = getConfiguredSiteKey();

  if (!hcaptchaSiteKey) {
    console.error("[public-config] Missing captcha site key secret (expected VITE_HCAPTCHA_SITE_KEY or HCAPTCHA_SITE_KEY)");
    return new Response(
      JSON.stringify({
        configured: false,
        hcaptchaSiteKey: null,
        error: "Captcha public key not configured",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({
      configured: true,
      hcaptchaSiteKey,
      siteKey: hcaptchaSiteKey,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
