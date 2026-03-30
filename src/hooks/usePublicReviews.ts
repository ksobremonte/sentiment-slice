import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  return useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => {
      // Fetch only 4-star and 5-star approved reviews
      const { data, error } = await supabase
        .from("reviews_public")
        .select("id, name, rating, feedback, sentiment, created_at, photo_url, photo_urls, language, approved, is_generated")
        .gte("rating", 4)
        .order("is_generated", { ascending: true })  // real first (false < true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[usePublicReviews] Error fetching reviews:", error);
        throw error;
      }

      return data as PublicReview[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
