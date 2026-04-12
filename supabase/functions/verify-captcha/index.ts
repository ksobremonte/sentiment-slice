// Supabase Edge Function: verify-captcha
// Verifies hCaptcha tokens server-side.

import { logToSystem } from '../_shared/systemLog.ts'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const endpoint = "/verify-captcha";

  if (req.method !== "POST") {
    await logToSystem({ endpoint, method: req.method, status_code: 405, level: "warning", message: "Method not allowed" });
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const secret = Deno.env.get("HCAPTCHA_SECRET_KEY");
  if (!secret) {
    await logToSystem({ endpoint, method: "POST", status_code: 500, level: "error", message: "Captcha not configured" });
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
    await logToSystem({ endpoint, method: "POST", status_code: 400, level: "warning", message: "Invalid request body" });
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (typeof token !== "string" || token.length < 10 || token.length > 4096) {
    await logToSystem({ endpoint, method: "POST", status_code: 400, level: "warning", message: "Invalid captcha token format" });
    return new Response(JSON.stringify({ success: false }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);

    console.log("[verify-captcha] Verifying token with hCaptcha...");

    const verifyRes = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const verifyJson = await verifyRes.json().catch(() => null);
    console.log("[verify-captcha] hCaptcha response:", JSON.stringify(verifyJson));
    
    const success = Boolean(verifyJson?.success);
    await logToSystem({
      endpoint, method: "POST", status_code: 200,
      level: success ? "success" : "warning",
      message: success ? "Captcha verified successfully" : "Captcha verification failed",
    });

    return new Response(JSON.stringify({ success }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-captcha] Error:", err);
    await logToSystem({ endpoint, method: "POST", status_code: 500, level: "error", message: "Captcha verification error" });
    return new Response(JSON.stringify({ success: false }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
