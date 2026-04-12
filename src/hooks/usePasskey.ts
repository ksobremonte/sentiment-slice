import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

export const usePasskey = (userId?: string) => {
  const [hasPasskeys, setHasPasskeys] = useState(false);
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [supported] = useState(browserSupportsWebAuthn());

  const fetchPasskeys = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("webauthn_credentials")
      .select("id, device_name, created_at, transports")
      .eq("user_id", userId);
    setPasskeys(data || []);
    setHasPasskeys((data?.length || 0) > 0);
  }, [userId]);

  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  const registerPasskey = async (deviceName?: string) => {
    if (!userId || !supported) return { success: false, error: "Not supported" };
    setLoading(true);
    try {
      // 1. Get registration options from server
      const { data: options, error: optErr } = await supabase.functions.invoke(
        "webauthn-register",
        { body: { action: "options", userId } }
      );
      if (optErr) throw optErr;

      // 2. Start WebAuthn registration in browser
      const credential = await startRegistration({ optionsJSON: options });

      // 3. Verify on server
      const { data: result, error: verErr } = await supabase.functions.invoke(
        "webauthn-register",
        { body: { action: "verify", userId, credential, deviceName } }
      );
      if (verErr) throw verErr;

      if (result?.verified) {
        await fetchPasskeys();
        return { success: true };
      }
      return { success: false, error: result?.error || "Verification failed" };
    } catch (err: any) {
      // User cancelled or error
      if (err?.name === "NotAllowedError") {
        return { success: false, error: "cancelled" };
      }
      console.error("Passkey registration error:", err);
      return { success: false, error: err?.message || "Registration failed" };
    } finally {
      setLoading(false);
    }
  };

  const authenticatePasskey = async () => {
    if (!userId || !supported) return { success: false, error: "Not supported" };
    setLoading(true);
    try {
      // 1. Get authentication options
      const { data: options, error: optErr } = await supabase.functions.invoke(
        "webauthn-authenticate",
        { body: { action: "options", userId } }
      );
      if (optErr) throw optErr;
      if (options?.error) return { success: false, error: options.error };

      // 2. Start WebAuthn authentication in browser
      const credential = await startAuthentication({ optionsJSON: options });

      // 3. Verify on server
      const { data: result, error: verErr } = await supabase.functions.invoke(
        "webauthn-authenticate",
        { body: { action: "verify", userId, credential } }
      );
      if (verErr) throw verErr;

      if (result?.verified) {
        return { success: true };
      }
      return { success: false, error: result?.error || "Authentication failed" };
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        return { success: false, error: "cancelled" };
      }
      console.error("Passkey auth error:", err);
      return { success: false, error: err?.message || "Authentication failed" };
    } finally {
      setLoading(false);
    }
  };

  const deletePasskey = async (passkeyId: string) => {
    const { error } = await supabase
      .from("webauthn_credentials")
      .delete()
      .eq("id", passkeyId);
    if (!error) await fetchPasskeys();
    return { error };
  };

  return {
    supported,
    hasPasskeys,
    passkeys,
    loading,
    registerPasskey,
    authenticatePasskey,
    deletePasskey,
    refreshPasskeys: fetchPasskeys,
  };
};
