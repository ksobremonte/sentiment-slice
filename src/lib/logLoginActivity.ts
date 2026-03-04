import { supabase } from "@/integrations/supabase/client";

export const logLoginActivity = async (userId: string) => {
  try {
    const userAgent = navigator.userAgent || null;
    // We can't get real IP from the client, but we'll store what we can
    await supabase.from("login_activity").insert({
      user_id: userId,
      user_agent: userAgent,
      ip_address: null, // IP would need server-side detection
    });
  } catch {
    // Non-critical, don't throw
  }
};
