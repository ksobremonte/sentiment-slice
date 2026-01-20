import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const verifyCaptcha = async (captchaToken: string) => {
    const { data, error } = await supabase.functions.invoke("verify-captcha", {
      body: { token: captchaToken },
    });

    if (error) return { ok: false as const };
    if (!data || typeof data !== "object") return { ok: false as const };

    // supabase-js types `data` as `any`
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

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  };

  return {
    session,
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
};
