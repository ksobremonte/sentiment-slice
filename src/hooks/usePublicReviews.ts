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
  language: string | null;
  approved: boolean | null;
}

export const usePublicReviews = () => {
  return useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, name, rating, feedback, sentiment, created_at, photo_url, language, approved")
        .eq("approved", true)
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
