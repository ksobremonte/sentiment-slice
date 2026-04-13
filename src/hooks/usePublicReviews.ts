import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface PublicReview {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  sentiment: string | null;
  created_at: string;
  photo_url: string | null;
  photo_urls: string[] | null;
  language: string | null;
  approved: boolean | null;
  is_generated: boolean;
}

export const usePublicReviews = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes on the reviews table
  useEffect(() => {
    const channel = supabase
      .channel("public-reviews-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reviews" },
        () => {
          // Invalidate to refetch — the query already filters for 4-5 star approved
          queryClient.invalidateQueries({ queryKey: ["public-reviews"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews_public")
        .select("id, name, rating, feedback, sentiment, created_at, photo_url, photo_urls, language, approved, is_generated")
        .gte("rating", 4)
        .order("is_generated", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[usePublicReviews] Error fetching reviews:", error);
        throw error;
      }

      return data as PublicReview[];
    },
    staleTime: 30 * 1000, // reduced from 5min to 30s for near-realtime freshness
    refetchOnWindowFocus: false,
  });
};
