import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UseHcaptchaSiteKeyState = {
  siteKey: string | null;
  loading: boolean;
};

/**
 * Loads the hCaptcha *public* site key from the backend.
 * We do this because build-time Vite env vars may not include Cloud secrets.
 */
export const useHcaptchaSiteKey = (): UseHcaptchaSiteKeyState => {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("public-config", {
          body: {},
        });

        if (cancelled) return;
        if (error) {
          setSiteKey(null);
          return;
        }

        const key =
          data && typeof data === "object"
            ? (data as { hcaptchaSiteKey?: unknown }).hcaptchaSiteKey
            : null;

        setSiteKey(typeof key === "string" && key.trim().length > 0 ? key.trim() : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { siteKey, loading };
};
