import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          setRole(data?.role ?? null);
        } else {
          setRole(null);
        }
        setLoading(false);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);
    });

    // Safety timeout — never stay loading forever
    const timeout = setTimeout(() => setLoading(false), 5000);
    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const verifyCaptcha = async (captchaToken: string) => {
    const { data, error } = await supabase.functions.invoke("verify-captcha", {
      body: { token: captchaToken },
    });

    if (error) {
      console.error("[auth] verify-captcha function call failed", error);
      return { ok: false as const, reason: "Captcha verification request failed" };
    }

    if (!data || typeof data !== "object") {
      console.warn("[auth] verify-captcha returned invalid payload", data);
      return { ok: false as const, reason: "Invalid captcha verification response" };
    }

    const payload = data as { success?: unknown; error?: unknown; errorCodes?: unknown };
    const ok = Boolean(payload.success);
    const errorCodes = Array.isArray(payload.errorCodes)
      ? payload.errorCodes.filter((v): v is string => typeof v === "string")
      : [];

    if (!ok) {
      console.warn("[auth] captcha verification failed", {
        error: payload.error,
        errorCodes,
      });
    }

    return {
      ok,
      reason: typeof payload.error === "string" ? payload.error : null,
      errorCodes,
    };
  };

  const signUp = async (email: string, password: string, captchaToken: string) => {
    const verify = await verifyCaptcha(captchaToken);
    if (!verify.ok) {
      return { data: null, error: { message: verify.reason ?? "Captcha verification failed" } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string, captchaToken: string) => {
    // Run captcha verification and sign-in in parallel to reduce wait time
    const [verify, authResult] = await Promise.all([
      verifyCaptcha(captchaToken),
      supabase.auth.signInWithPassword({ email, password }),
    ]);

    if (!verify.ok) {
      // Captcha failed — sign out any session that may have been created
      if (authResult.data?.session) {
        supabase.auth.signOut().catch(() => {});
      }
      return { data: null, error: { message: verify.reason ?? "Captcha verification failed" } };
    }

    return { data: authResult.data, error: authResult.error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string, captchaToken: string) => {
    const verify = await verifyCaptcha(captchaToken);
    if (!verify.ok) {
      return { data: null, error: { message: verify.reason ?? "Captcha verification failed" } };
    }

    const redirectBase = import.meta.env.PROD
      ? "https://pizzavolante-dashboard.lovable.app"
      : window.location.origin;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectBase}/reset-password`,
    });
    return { data, error };
  };

  return {
    session,
    user,
    loading,
    role,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
};
