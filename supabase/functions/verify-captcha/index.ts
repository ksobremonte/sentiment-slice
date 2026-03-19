// Supabase Edge Function: verify-captcha
// Verifies hCaptcha tokens server-side.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const HCAPTCHA_TEST_SITE_KEY = "10000000-ffff-ffff-ffff-000000000001";
const HCAPTCHA_TEST_SECRET_KEY = "0x0000000000000000000000000000000000000000";

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

const verifyToken = async (token: string, secret: string, remoteIp: string | null) => {
  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (remoteIp) {
    form.set("remoteip", remoteIp);
  }

  const verifyRes = await fetch("https://hcaptcha.com/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  return verifyRes.json().catch(() => null);
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const configuredSiteKey = getConfiguredSiteKey();
  const configuredSecret = Deno.env.get("HCAPTCHA_SECRET_KEY")?.trim() || null;
  const usingTestSiteKey = configuredSiteKey === HCAPTCHA_TEST_SITE_KEY;
  const primarySecret = configuredSecret ?? (usingTestSiteKey ? HCAPTCHA_TEST_SECRET_KEY : null);

  if (!primarySecret) {
    return new Response(JSON.stringify({ success: false, error: "Captcha not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let token: unknown;
  try {
    const body = await req.json();
    token = body?.token;
  } catch {
    return new Response(JSON.stringify({ success: false, error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (typeof token !== "string" || token.length < 10 || token.length > 4096) {
    return new Response(JSON.stringify({ success: false, error: "Invalid captcha token" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const remoteIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

    console.log("[verify-captcha] Verifying token with hCaptcha", {
      usingTestSiteKey,
      usingConfiguredSecret: Boolean(configuredSecret),
    });

    let verifyJson = await verifyToken(token, primarySecret, remoteIp);
    let success = Boolean(verifyJson?.success);

    // If the frontend uses hCaptcha's official test site key, make sure verification also
    // uses the official test secret key even when HCAPTCHA_SECRET_KEY is set differently.
    if (!success && usingTestSiteKey && primarySecret !== HCAPTCHA_TEST_SECRET_KEY) {
      console.warn("[verify-captcha] Primary secret failed for test site key, retrying with hCaptcha test secret");
      verifyJson = await verifyToken(token, HCAPTCHA_TEST_SECRET_KEY, remoteIp);
      success = Boolean(verifyJson?.success);
    }

    const errorCodes = Array.isArray(verifyJson?.["error-codes"]) ? verifyJson["error-codes"] : [];

    console.log("[verify-captcha] Verification result", { success, errorCodes });

    return new Response(JSON.stringify({ success, errorCodes }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-captcha] Error:", err);
    return new Response(JSON.stringify({ success: false, error: "Captcha verification request failed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
