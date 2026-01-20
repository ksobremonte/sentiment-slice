import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  sentiment: string | null;
  created_at: string;
}

export const useReviews = () => {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      // Use the reviews_public view which excludes email addresses
      const { data, error } = await supabase
        .from("reviews_public")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });
};
