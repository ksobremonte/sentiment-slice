import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

const AUTH_TIMEOUT_MS = 5000; // Max time to wait for auth before giving up

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const loadingResolved = useRef(false);

  const resolveLoading = () => {
    if (!loadingResolved.current) {
      loadingResolved.current = true;
      setLoading(false);
    }
  };

  // Fetch role without blocking auth loading
  const fetchRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      setRole(data?.role ?? null);
    } catch {
      setRole(null);
    }
  };

  useEffect(() => {
    // Safety timeout — never stay loading forever
    const timeout = setTimeout(() => {
      if (!loadingResolved.current) {
        console.warn("[useAuth] Auth loading timed out after", AUTH_TIMEOUT_MS, "ms");
        resolveLoading();
      }
    }, AUTH_TIMEOUT_MS);

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fetch role in background — don't block loading
          fetchRole(session.user.id);
        } else {
          setRole(null);
        }

        resolveLoading();
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchRole(session.user.id);
      }

      resolveLoading();
    }).catch(() => {
      resolveLoading();
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const verifyCaptcha = async (captchaToken: string) => {
    const { data, error } = await supabase.functions.invoke("verify-captcha", {
      body: { token: captchaToken },
    });

    if (error) return { ok: false as const };
    if (!data || typeof data !== "object") return { ok: false as const };

    return { ok: Boolean((data as any).success) as boolean };
  };

  const signUp = async (email: string, password: string, captchaToken: string) => {
    const verify = await verifyCaptcha(captchaToken);
    if (!verify.ok) {
      return { data: null, error: { message: "Captcha verification failed" } };
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
    const verify = await verifyCaptcha(captchaToken);
    if (!verify.ok) {
      return { data: null, error: { message: "Captcha verification failed" } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email: string, captchaToken: string) => {
    const verify = await verifyCaptcha(captchaToken);
    if (!verify.ok) {
      return { data: null, error: { message: "Captcha verification failed" } };
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
