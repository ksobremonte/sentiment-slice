import { useState, useCallback } from "react";
import { Review } from "./useReviews";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-reviews`;

export const useAIReviewSort = () => {
  const [isSorting, setIsSorting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortReviewsByRelevance = useCallback(async (reviews: Review[]): Promise<Review[]> => {
    if (reviews.length === 0) return reviews;
    
    setIsSorting(true);
    setError(null);

    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          reviews,
          action: "sort",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to sort reviews");
      }

      const { sortedIds } = await response.json();
      
      // Reorder reviews based on AI-sorted IDs
      const reviewMap = new Map(reviews.map(r => [r.id, r]));
      const sortedReviews: Review[] = [];
      
      for (const id of sortedIds) {
        const review = reviewMap.get(id);
        if (review) {
          sortedReviews.push(review);
          reviewMap.delete(id);
        }
      }
      
      // Add any remaining reviews not in the sorted list
      sortedReviews.push(...reviewMap.values());
      
      return sortedReviews;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sort reviews";
      setError(message);
      return reviews; // Return original order on error
    } finally {
      setIsSorting(false);
    }
  }, []);

  return { sortReviewsByRelevance, isSorting, error };
};
