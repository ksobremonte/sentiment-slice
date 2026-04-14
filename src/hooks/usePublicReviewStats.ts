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
      const { data, error } = await supabase.rpc("get_review_stats" as any);

      if (error) {
        console.error("[usePublicReviewStats] Error:", error);
        throw error;
      }

      const stats = data as any;
      const total = stats?.total ?? 0;
      const positive = stats?.positive ?? 0;
      const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0;
      const avgRating = Number(stats?.avg_rating ?? 0);
      const activeUsers = stats?.active_users ?? 0;

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
