import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useReviews } from "@/hooks/useReviews";
import { useMemo, useCallback } from "react";

export const useNotificationReads = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const { data: reviews } = useReviews();

  // Fetch all read notification IDs for this user
  const { data: readIds } = useQuery({
    queryKey: ["notification-reads", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("notification_reads")
        .select("review_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data.map((r: { review_id: string }) => r.review_id);
    },
    enabled: !!user?.id,
  });

  // Count of unread notification-worthy reviews
  const unreadCount = useMemo(() => {
    if (!reviews || !readIds) return 0;
    const readSet = new Set(readIds);
    return reviews.filter(
      (r) =>
        (r.sentiment === "negative" || r.sentiment === "mixed" || r.rating <= 2) &&
        !readSet.has(r.id)
    ).length;
  }, [reviews, readIds]);

  const readSet = useMemo(() => new Set(readIds ?? []), [readIds]);

  // Mark a single notification as read
  const markAsRead = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notification_reads")
        .upsert({ user_id: user.id, review_id: reviewId }, { onConflict: "user_id,review_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-reads", user?.id] });
    },
  });

  // Mark all current notifications as read
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id || !reviews) return;
      const notifReviews = reviews.filter(
        (r) => r.sentiment === "negative" || r.sentiment === "mixed" || r.rating <= 2
      );
      const unread = notifReviews.filter((r) => !readSet.has(r.id));
      if (unread.length === 0) return;
      const rows = unread.map((r) => ({ user_id: user.id!, review_id: r.id }));
      const { error } = await supabase
        .from("notification_reads")
        .upsert(rows, { onConflict: "user_id,review_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-reads", user?.id] });
    },
  });

  const isRead = useCallback((reviewId: string) => readSet.has(reviewId), [readSet]);

  return { unreadCount, isRead, markAsRead, markAllAsRead };
};
