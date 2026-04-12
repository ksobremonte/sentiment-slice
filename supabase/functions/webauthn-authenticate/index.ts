import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "https://esm.sh/@simplewebauthn/server@13.1.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

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
    const { action, userId, credential } = body;
    const origin = req.headers.get("origin") || `https://${RP_ID_PROD}`;
    const rpID = getRpId(origin);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (action === "options") {
      // Get user's credentials
      const { data: creds } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("credential_id, transports")
        .eq("user_id", userId);

      if (!creds || creds.length === 0) {
        return new Response(
          JSON.stringify({ error: "No passkeys registered" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const allowCredentials = creds.map((c: any) => ({
        id: c.credential_id,
        type: "public-key" as const,
        transports: c.transports || [],
      }));

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials,
        userVerification: "preferred",
      });

      // Store challenge
      await supabaseAdmin.from("webauthn_challenges").insert({
        user_id: userId,
        challenge: options.challenge,
        type: "authentication",
      });

      return new Response(JSON.stringify(options), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "verify") {
      // Get stored challenge
      const { data: challengeRow } = await supabaseAdmin
        .from("webauthn_challenges")
        .select("*")
        .eq("user_id", userId)
        .eq("type", "authentication")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!challengeRow) {
        return new Response(
          JSON.stringify({ error: "No challenge found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find the credential used
      const { data: storedCred } = await supabaseAdmin
        .from("webauthn_credentials")
        .select("*")
        .eq("user_id", userId)
        .eq("credential_id", credential.id)
        .single();

      if (!storedCred) {
        return new Response(
          JSON.stringify({ error: "Credential not found" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decode stored public key from base64url
      const pubKeyStr = storedCred.public_key
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const pubKeyBinary = atob(pubKeyStr);
      const pubKeyArray = new Uint8Array(pubKeyBinary.length);
      for (let i = 0; i < pubKeyBinary.length; i++) {
        pubKeyArray[i] = pubKeyBinary.charCodeAt(i);
      }

      const credIdStr = storedCred.credential_id
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const credIdBinary = atob(credIdStr);
      const credIdArray = new Uint8Array(credIdBinary.length);
      for (let i = 0; i < credIdBinary.length; i++) {
        credIdArray[i] = credIdBinary.charCodeAt(i);
      }

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        credential: {
          id: credIdArray,
          publicKey: pubKeyArray,
          counter: storedCred.counter,
          transports: storedCred.transports || [],
        },
      });

      if (!verification.verified) {
        return new Response(
          JSON.stringify({ error: "Authentication failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update counter
      await supabaseAdmin
        .from("webauthn_credentials")
        .update({ counter: verification.authenticationInfo.newCounter })
        .eq("id", storedCred.id);

      // Clean up challenge
      await supabaseAdmin
        .from("webauthn_challenges")
        .delete()
        .eq("user_id", userId)
        .eq("type", "authentication");

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
    console.error("WebAuthn authenticate error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
