import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "https://esm.sh/@simplewebauthn/server@13.1.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const RP_NAME = "Pizza Volante Dashboard";
const RP_ID_PROD = "pizzavolante-dashboard.lovable.app";

function getRpId(origin: string): string {
  try {
    const host = new URL(origin).hostname;
    if (host === "localhost" || host === "127.0.0.1") return "localhost";
    return host;
  } catch {
    return RP_ID_PROD;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, userId, deviceName, credential } = body;
    const origin = req.headers.get("origin") || `https://${RP_ID_PROD}`;
    const rpID = getRpId(origin);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "options") {
      // Get existing credentials for this user
      const { data: existingCreds } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("user_id", userId);

      const excludeCredentials = (existingCreds || []).map((c: any) => ({
        id: c.credential_id,
        type: "public-key" as const,
      }));

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID,
        userName: userId,
        userID: new TextEncoder().encode(userId),
        attestationType: "none",
        excludeCredentials,
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
        },
      });

      // Store challenge
      await supabaseAdmin.from("webauthn_challenges").insert({
        user_id: userId,
        challenge: options.challenge,
        type: "registration",
      });

      return new Response(JSON.stringify(options), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      // Get the stored challenge
      const { data: challengeRow } = await supabaseAdmin
        .from("webauthn_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "registration")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!challengeRow) {
        return new Response(
          JSON.stringify({ error: "No challenge found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return new Response(
          JSON.stringify({ error: "Verification failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { credential: cred, credentialDeviceType, credentialBackedUp } =
        verification.registrationInfo;

      // Store the credential
      // Convert Uint8Array to base64url for storage
      const credIdBase64 = btoa(String.fromCharCode(...cred.id))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const pubKeyBase64 = btoa(String.fromCharCode(...cred.publicKey))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      await supabaseAdmin.from("webauthn_credentials").insert({
        user_id: userId,
        credential_id: credIdBase64,
        public_key: pubKeyBase64,
        counter: cred.counter,
        transports: credential.response?.transports || [],
        device_name: deviceName || "Security Key",
      });

      // Clean up challenge
      await supabaseAdmin
        .from("webauthn_challenges")
        .delete()
        .eq("user_id", userId)
        .eq("type", "registration");

      return new Response(
        JSON.stringify({ verified: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("WebAuthn register error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
