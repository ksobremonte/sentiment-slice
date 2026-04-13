import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

/**
 * Tracks user access: logs page views on route changes,
 * login/logout via auth state changes.
 */
export const useAccessLog = () => {
  const { user } = useAuthContext();
  const location = useLocation();
  const prevPath = useRef<string | null>(null);
  const prevUserId = useRef<string | null>(null);

  // Helper to insert an access log
  const insertLog = async (
    userId: string,
    email: string | undefined,
    action: string,
    page?: string
  ) => {
    // Fetch role
    let role: string | null = null;
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      role = data?.role || null;
    } catch {}

    await supabase.from("access_logs").insert({
      user_id: userId,
      email: email || null,
      role,
      action,
      page: page || null,
      ip_address: null, // not available client-side
      user_agent: navigator.userAgent,
    });
  };

  // Track login / logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Only log if this is a fresh login (user wasn't already tracked)
          if (prevUserId.current !== session.user.id) {
            insertLog(session.user.id, session.user.email, "login", location.pathname);
            prevUserId.current = session.user.id;
          }
        }
        if (event === "SIGNED_OUT") {
          // Logout is now logged in useAuth before session is destroyed
          prevUserId.current = null;
        }
      }
    );
    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track page views (dashboard routes only)
  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    if (!path.startsWith("/pv-dashboard")) return;
    if (path === prevPath.current) return;
    prevPath.current = path;

    insertLog(user.id, user.email, "page_view", path);
  }, [location.pathname, user]);
};
