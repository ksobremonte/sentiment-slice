import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface PublicReviewStats {
  total: number;
  positivePct: number;
  avgRating: number;
  activeUsers: number;
}

export const usePublicReviewStats = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["public-review-stats"],
    queryFn: async () => {
      // Fetch ALL approved reviews (no rating filter) for accurate stats
      const { data, error } = await supabase
        .from("reviews_public")
        .select("rating, sentiment, created_at, name")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[usePublicReviewStats] Error:", error);
        throw error;
      }

      const reviews = data ?? [];
      const total = reviews.length;
      const positive = reviews.filter(r => r.sentiment === "positive").length;
      const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;
      const avgRating = total > 0
        ? Math.round((reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / total) * 10) / 10
        : 0;

      // Active users: unique names from the last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const activeUsers = new Set(
        reviews
          .filter(r => new Date(r.created_at ?? "") > weekAgo)
          .map(r => r.name)
      ).size;

      return { total, positivePct, avgRating, activeUsers } as PublicReviewStats;
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("public-review-stats-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["public-review-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
};
