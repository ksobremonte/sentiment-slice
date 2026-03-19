import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
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

export const useReviews = () => {
  const queryClient = useQueryClient();
  const { session, loading } = useAuthContext();

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
          console.log("[useReviews] Realtime change detected, refetching...");
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
    // Don't fetch until auth is resolved and we have a session
    enabled: !loading && !!session,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      console.log("[useReviews] Fetching reviews from database...");
      const { data, error } = await supabase
        .from("reviews")
        .select("id, name, rating, feedback, sentiment, sentiment_reason, sentiment_keywords, created_at, photo_url, language, approved, admin_response, admin_response_at, conversation_id")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useReviews] Fetch error:", error.message);
        throw error;
      }
      console.log(`[useReviews] Fetched ${data?.length ?? 0} reviews successfully`);
      return data as Review[];
    },
  });
};
