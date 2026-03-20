import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo } from "react";

// Generate or retrieve a persistent session ID for anonymous users
const getSessionId = (): string => {
  const key = "review_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

interface ReactionCounts {
  likes: number;
  dislikes: number;
}

interface ReactionRow {
  id: string;
  review_id: string;
  session_id: string;
  reaction: string;
}

export const useReviewReactions = (reviewIds: string[]) => {
  const queryClient = useQueryClient();
  const sessionId = useMemo(() => getSessionId(), []);

  // Fetch all reactions for the given review IDs
  const { data: reactions = [] } = useQuery({
    queryKey: ["review-reactions", reviewIds],
    queryFn: async () => {
      if (reviewIds.length === 0) return [];
      const { data, error } = await supabase
        .from("review_reactions")
        .select("id, review_id, session_id, reaction")
        .in("review_id", reviewIds);
      if (error) throw error;
      return data as ReactionRow[];
    },
    enabled: reviewIds.length > 0,
  });

  // Get counts per review
  const getCounts = (reviewId: string): ReactionCounts => {
    const reviewReactions = reactions.filter((r) => r.review_id === reviewId);
    return {
      likes: reviewReactions.filter((r) => r.reaction === "like").length,
      dislikes: reviewReactions.filter((r) => r.reaction === "dislike").length,
    };
  };

  // Get current user's reaction
  const getUserReaction = (reviewId: string): string | null => {
    const found = reactions.find(
      (r) => r.review_id === reviewId && r.session_id === sessionId
    );
    return found?.reaction || null;
  };

  const toggleReaction = useMutation({
    mutationFn: async ({
      reviewId,
      reaction,
    }: {
      reviewId: string;
      reaction: "like" | "dislike";
    }) => {
      const existing = reactions.find(
        (r) => r.review_id === reviewId && r.session_id === sessionId
      );

      if (existing) {
        if (existing.reaction === reaction) {
          // Remove reaction (un-react)
          await supabase.from("review_reactions").delete().eq("id", existing.id);
        } else {
          // Switch reaction
          await supabase
            .from("review_reactions")
            .update({ reaction })
            .eq("id", existing.id);
        }
      } else {
        // New reaction
        await supabase.from("review_reactions").insert({
          review_id: reviewId,
          session_id: sessionId,
          reaction,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-reactions"] });
    },
  });

  return { getCounts, getUserReaction, toggleReaction };
};
