import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UseHcaptchaSiteKeyState = {
  siteKey: string | null;
  loading: boolean;
};

const KEY_REQUEST_TIMEOUT_MS = 8000;

/**
 * Loads the hCaptcha *public* site key from the backend.
 * We do this because build-time Vite env vars may not include Cloud secrets.
 */
export const useHcaptchaSiteKey = (): UseHcaptchaSiteKeyState => {
  const [siteKey, setSiteKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;

    const fallbackKey =
      typeof import.meta.env.VITE_HCAPTCHA_SITE_KEY === "string" &&
      import.meta.env.VITE_HCAPTCHA_SITE_KEY.trim().length > 0
        ? import.meta.env.VITE_HCAPTCHA_SITE_KEY.trim()
        : null;

    const run = async () => {
      try {
        const response = await Promise.race([
          supabase.functions.invoke("public-config", { body: {} }),
          new Promise<{ data: null; error: { message: string } }>((resolve) => {
            timeoutId = window.setTimeout(() => {
              resolve({ data: null, error: { message: "timeout" } });
            }, KEY_REQUEST_TIMEOUT_MS);
          }),
        ]);

        if (cancelled) return;

        const data = response && typeof response === "object" ? (response as { data?: unknown }).data : null;
        const error = response && typeof response === "object" ? (response as { error?: unknown }).error : null;

        if (error) {
          setSiteKey(fallbackKey);
          return;
        }

        const key =
          data && typeof data === "object"
            ? (data as { hcaptchaSiteKey?: unknown }).hcaptchaSiteKey
            : null;

        const normalizedKey = typeof key === "string" && key.trim().length > 0 ? key.trim() : null;
        setSiteKey(normalizedKey ?? fallbackKey);
      } finally {
        if (typeof timeoutId === "number") {
          window.clearTimeout(timeoutId);
        }
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
      if (typeof timeoutId === "number") {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  return { siteKey, loading };
};
