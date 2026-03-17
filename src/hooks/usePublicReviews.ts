import { useQuery } from "@tanstack/react-query";

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
    staleTime: 5 * 60 * 1000, // 5 minutes - avoid refetching on every mount
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/reviews?select=id,name,rating,feedback,sentiment,created_at,photo_url,language,approved&approved=eq.true&order=created_at.desc`;
      
      const response = await fetch(url, {
        headers: {
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[usePublicReviews] Error:", errorText);
        throw new Error("Failed to fetch reviews");
      }

      const data = await response.json();
      console.log("[usePublicReviews] Fetched reviews:", data?.length);
      return data as PublicReview[];
    },
  });
};
