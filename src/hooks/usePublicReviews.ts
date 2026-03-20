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
}

export const usePublicReviews = () => {
  return useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => {
      // Fetch only 4-star and 5-star approved reviews for public display
      // The view already filters to approved = true
      const { data, error } = await supabase
        .from("reviews_public")
        .select("id, name, rating, feedback, sentiment, created_at, photo_url, photo_urls, language, approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[usePublicReviews] Error fetching reviews:", error);
        throw error;
      }
      
      console.log("[usePublicReviews] Fetched reviews:", data);
      return data as PublicReview[];
    },
  });
};
