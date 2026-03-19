import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { SAMPLE_REVIEW_ROWS } from "@/lib/sampleReviews";

export interface Review {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  sentiment: string | null;
  sentiment_reason: string | null;
  sentiment_keywords: string[] | null;
  created_at: string;
  receipt_number: string | null;
  photo_url: string | null;
  language: string | null;
  approved: boolean | null;
  admin_response: string | null;
  admin_response_at: string | null;
  conversation_id: string | null;
}

const REVIEWS_TABLE = "reviews";

const getBackendConnectionLabel = () => {
  const rawUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!rawUrl) return "missing-backend-url";

  try {
    return new URL(rawUrl).host;
  } catch {
    return rawUrl;
  }
};

export const useReviews = () => {
  const queryClient = useQueryClient();
  const { session, user, loading } = useAuthContext();
  const backendConnection = useMemo(() => getBackendConnectionLabel(), []);
  const canFetchReviews = !loading && Boolean(user);

  useEffect(() => {
    console.log("[useReviews] Data source", {
      backendConnection,
      table: REVIEWS_TABLE,
      authLoading: loading,
      userId: user?.id ?? null,
      hasSession: Boolean(session),
      canFetchReviews,
    });
  }, [backendConnection, loading, user?.id, session, canFetchReviews]);

  // Subscribe to realtime changes only when a signed-in user is present
  useEffect(() => {
    if (!canFetchReviews) return;

    const channel = supabase
      .channel("reviews-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: REVIEWS_TABLE,
        },
        () => {
          console.log("[useReviews] Realtime change detected, refetching...");
          queryClient.invalidateQueries({ queryKey: ["reviews", user?.id ?? "unknown"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, canFetchReviews, user?.id]);

  const queryFn = useCallback(async () => {
      console.log("[useReviews] Running query", {
        table: REVIEWS_TABLE,
        userId: user?.id ?? null,
      });

      const selectColumns = "id, name, rating, feedback, sentiment, sentiment_reason, sentiment_keywords, created_at, receipt_number, photo_url, language, approved, admin_response, admin_response_at, conversation_id";

      const { data, error } = await supabase
        .from(REVIEWS_TABLE)
        .select(selectColumns)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useReviews] Fetch error", {
          table: REVIEWS_TABLE,
          message: error.message,
          code: error.code,
          details: error.details,
        });
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn("[useReviews] Query returned 0 rows", {
          table: REVIEWS_TABLE,
          canFetchReviews,
          userId: user?.id ?? null,
        });

        const { count, error: countError } = await supabase
          .from(REVIEWS_TABLE)
          .select("id", { count: "exact", head: true });

        if (!countError && (count ?? 0) === 0) {
          console.log("[useReviews] Database empty, creating sample reviews...");

          const { error: seedError } = await supabase
            .from(REVIEWS_TABLE)
            .insert(SAMPLE_REVIEW_ROWS);

          if (seedError) {
            console.error("[useReviews] Failed to seed sample reviews", {
              message: seedError.message,
              code: seedError.code,
              details: seedError.details,
            });
            return [];
          }

          const { data: seededData, error: seededFetchError } = await supabase
            .from(REVIEWS_TABLE)
            .select(selectColumns)
            .order("created_at", { ascending: false });

          if (seededFetchError) {
            console.error("[useReviews] Failed to fetch seeded reviews", {
              message: seededFetchError.message,
              code: seededFetchError.code,
              details: seededFetchError.details,
            });
            throw seededFetchError;
          }

          console.log("[useReviews] Seed complete", {
            rowCount: seededData?.length ?? 0,
          });

          return (seededData ?? []) as Review[];
        }
      }

      console.log("[useReviews] Query result", {
        table: REVIEWS_TABLE,
        rowCount: data?.length ?? 0,
        sampleRows: (data ?? []).slice(0, 3).map((row) => ({
          id: row.id,
          sentiment: row.sentiment,
          rating: row.rating,
        })),
      });

      return (data ?? []) as Review[];
  }, [user?.id, canFetchReviews]);

  return useQuery({
    queryKey: ["reviews", user?.id ?? "anonymous"],
    enabled: canFetchReviews,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always" as const,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn,
  });
};
