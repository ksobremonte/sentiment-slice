import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Review {
  id: string;
  name: string;
  rating: number;
  feedback: string;
  sentiment: string | null;
  created_at: string;
  receipt_number: string | null;
  photo_url: string | null;
}

export const useReviews = () => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('reviews-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
        },
        () => {
          // Invalidate and refetch reviews when any change occurs
          queryClient.invalidateQueries({ queryKey: ["reviews"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      // Fetch directly from the reviews table (authenticated users only via RLS)
      const { data, error } = await supabase
        .from("reviews")
        .select("id, name, rating, feedback, sentiment, created_at, receipt_number, photo_url")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });
};
