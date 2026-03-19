import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo } from "react";
import { useAuthContext } from "@/contexts/AuthContext";

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

  return useQuery({
    queryKey: ["reviews", user?.id ?? "anonymous"],
    enabled: canFetchReviews,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    queryFn: async () => {
      console.log("[useReviews] Running query", {
        table: REVIEWS_TABLE,
        userId: user?.id ?? null,
      });

      const { data, error } = await supabase
        .from(REVIEWS_TABLE)
        .select("id, name, rating, feedback, sentiment, sentiment_reason, sentiment_keywords, created_at, receipt_number, photo_url, language, approved, admin_response, admin_response_at, conversation_id")
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

      console.log("[useReviews] Query result", {
        table: REVIEWS_TABLE,
        rowCount: data?.length ?? 0,
        sampleRows: (data ?? []).slice(0, 3).map((row) => ({
          id: row.id,
          sentiment: row.sentiment,
          rating: row.rating,
        })),
      });

      if (!data || data.length === 0) {
        console.warn("[useReviews] Query returned 0 rows", {
          table: REVIEWS_TABLE,
          canFetchReviews,
          userId: user?.id ?? null,
        });
      }

      return (data ?? []) as Review[];
    },
  });
};
