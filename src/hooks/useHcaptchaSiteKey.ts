import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type UseHcaptchaSiteKeyState = {
  siteKey: string | null;
  loading: boolean;
};

const KEY_REQUEST_TIMEOUT_MS = 2500;
const HCAPTCHA_CACHE_KEY = "pv_hcaptcha_site_key";

const normalizeString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const extractSiteKey = (data: unknown): string | null => {
  if (typeof data === "string") {
    try {
      return extractSiteKey(JSON.parse(data));
    } catch {
      return normalizeString(data);
    }
  }

  if (data && typeof data === "object") {
    const payload = data as { hcaptchaSiteKey?: unknown; siteKey?: unknown };
    return normalizeString(payload.hcaptchaSiteKey) ?? normalizeString(payload.siteKey);
  }

  return null;
};

const getCachedSiteKey = (): string | null => {
  try {
    return normalizeString(sessionStorage.getItem(HCAPTCHA_CACHE_KEY));
  } catch {
    return null;
  }
};

const setCachedSiteKey = (key: string) => {
  try {
    sessionStorage.setItem(HCAPTCHA_CACHE_KEY, key);
  } catch {
    // no-op for environments where sessionStorage is unavailable
  }
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

    const envKey = normalizeString(import.meta.env.VITE_HCAPTCHA_SITE_KEY);
    const cachedKey = getCachedSiteKey();
    const immediateFallbackKey = envKey ?? cachedKey;

    if (immediateFallbackKey) {
      setSiteKey(immediateFallbackKey);
      setLoading(false);
    }

    const run = async () => {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("public-config timeout")), KEY_REQUEST_TIMEOUT_MS);
        });

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        const response = await Promise.race([
          fetch(`${supabaseUrl}/functions/v1/public-config`, {
            method: "GET",
            headers: {
              "apikey": anonKey,
              "Content-Type": "application/json",
            },
          }),
          timeoutPromise,
        ]);

        if (cancelled) return;

        const fetchResponse = response as Response;
        if (!fetchResponse.ok) {
          throw new Error(`public-config returned ${fetchResponse.status}`);
        }

        const data = await fetchResponse.json();
        const resolvedKey = extractSiteKey(data);
        if (resolvedKey) {
          setCachedSiteKey(resolvedKey);
          setSiteKey(resolvedKey);
        } else {
          setSiteKey(immediateFallbackKey ?? null);
        }
      } catch (error) {
        console.warn("[captcha] Failed to load public-config quickly:", error);
        if (!cancelled) {
          setSiteKey(immediateFallbackKey ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  return { siteKey, loading };
};
