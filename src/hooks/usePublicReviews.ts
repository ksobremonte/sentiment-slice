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
}

export const usePublicReviews = () => {
  return useQuery({
    queryKey: ["public-reviews"],
    queryFn: async () => {
      // Fetch only 4-star and 5-star reviews for public display
      const { data, error } = await supabase
        .from("reviews_public")
        .select("id, name, rating, feedback, sentiment, created_at, photo_url")
        .gte("rating", 4)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PublicReview[];
    },
  });
};
