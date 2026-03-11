import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert, X, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationPopup {
  id: string;
  reviewId?: string;
  navigateTo?: string;
  title: string;
  message: string;
  time: string;
  type?: "review" | "alert";
}

const RealtimeNotificationPopup = () => {
  const [popups, setPopups] = useState<NotificationPopup[]>([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const processedIds = useRef(new Set<string>());

  useEffect(() => {
    const channel = supabase
      .channel("review-notifications-popup")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reviews",
        },
        (payload) => {
          const review = payload.new as {
            id: string;
            name: string;
            feedback: string;
            rating: number;
            sentiment: string | null;
            created_at: string;
          };

          if (processedIds.current.has(review.id)) return;
          processedIds.current.add(review.id);

          const isNegative = review.sentiment === "negative" || review.sentiment === "mixed";
          const isLowRating = review.rating <= 2;

          if (!isNegative && !isLowRating) return;

          const title = isNegative
            ? "New Negative Review Detected"
            : `Low Rating Review (${review.rating}★)`;

          const feedback = review.feedback.length > 60
            ? review.feedback.slice(0, 60) + "…"
            : review.feedback;

          const popup: NotificationPopup = {
            id: crypto.randomUUID(),
            reviewId: review.id,
            title,
            message: `${review.name}: "${feedback}"`,
            time: "Just now",
            type: "review",
          };

          setPopups((prev) => [...prev, popup]);

          queryClient.invalidateQueries({ queryKey: ["reviews"] });
          queryClient.invalidateQueries({ queryKey: ["notification-reads"] });

          setTimeout(() => {
            setPopups((prev) => prev.filter((p) => p.id !== popup.id));
          }, 6000);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "reviews",
        },
        (payload) => {
          const review = payload.new as {
            id: string;
            name: string;
            feedback: string;
            rating: number;
            sentiment: string | null;
            created_at: string;
          };
          const old = payload.old as { sentiment: string | null };

          if (old.sentiment === review.sentiment) return;
          if (processedIds.current.has(`update-${review.id}`)) return;

          const isNegative = review.sentiment === "negative" || review.sentiment === "mixed";
          if (!isNegative) return;

          processedIds.current.add(`update-${review.id}`);

          const feedback = review.feedback.length > 60
            ? review.feedback.slice(0, 60) + "…"
            : review.feedback;

          const popup: NotificationPopup = {
            id: crypto.randomUUID(),
            reviewId: review.id,
            title: "Negative Sentiment Detected",
            message: `${review.name}: "${feedback}"`,
            time: "Just now",
            type: "review",
          };

          setPopups((prev) => [...prev, popup]);

          queryClient.invalidateQueries({ queryKey: ["reviews"] });
          queryClient.invalidateQueries({ queryKey: ["notification-reads"] });

          setTimeout(() => {
            setPopups((prev) => prev.filter((p) => p.id !== popup.id));
          }, 6000);
        }
      )
      // Listen for threshold alert inserts
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alert_history",
        },
        (payload) => {
          const alert = payload.new as {
            id: string;
            alert_level: string;
            message: string;
            negative_percentage: number;
            negative_count: number;
            review_count: number;
            top_keyword: string | null;
          };

          if (processedIds.current.has(`alert-${alert.id}`)) return;
          processedIds.current.add(`alert-${alert.id}`);

          const isCritical = alert.alert_level === "critical";

          const popup: NotificationPopup = {
            id: crypto.randomUUID(),
            navigateTo: "/pv-dashboard/alerts",
            title: isCritical ? "🚨 Critical Alert Triggered" : "⚠️ Threshold Alert",
            message: alert.message,
            time: "Just now",
            type: "alert",
          };

          setPopups((prev) => [...prev, popup]);

          queryClient.invalidateQueries({ queryKey: ["alert-history"] });

          setTimeout(() => {
            setPopups((prev) => prev.filter((p) => p.id !== popup.id));
          }, isCritical ? 10000 : 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleClick = (popup: NotificationPopup) => {
    setPopups((prev) => prev.filter((p) => p.id !== popup.id));
    if (popup.navigateTo) {
      navigate(popup.navigateTo);
    } else if (popup.reviewId) {
      navigate(`/pv-dashboard/reviews/${popup.reviewId}`);
    }
  };

  const handleDismiss = (e: React.MouseEvent, popupId: string) => {
    e.stopPropagation();
    setPopups((prev) => prev.filter((p) => p.id !== popupId));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {popups.map((popup) => (
          <motion.div
            key={popup.id}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="pointer-events-auto"
          >
            <div
              onClick={() => handleClick(popup)}
              className={cn(
                "w-[360px] max-w-[calc(100vw-2rem)] bg-card border-2 rounded-xl p-4 shadow-lg",
                "cursor-pointer hover:shadow-xl transition-all",
                "backdrop-blur-sm",
                popup.type === "alert" 
                  ? "border-warning/50 hover:border-warning/70" 
                  : "border-destructive/30 hover:border-destructive/50"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "rounded-full p-2 shrink-0",
                  popup.type === "alert" ? "bg-warning/10" : "bg-destructive/10"
                )}>
                  {popup.type === "alert" 
                    ? <AlertTriangle className="h-4 w-4 text-warning" />
                    : <ShieldAlert className="h-4 w-4 text-destructive" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground">{popup.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{popup.message}</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock className="h-3 w-3 text-muted-foreground/60" />
                    <span className="text-[10px] text-muted-foreground/60">{popup.time}</span>
                    <span className="text-[10px] text-primary ml-auto font-medium">Click to view →</span>
                  </div>
                </div>

                {/* Dismiss */}
                <button
                  onClick={(e) => handleDismiss(e, popup.id)}
                  className="shrink-0 rounded-full p-1 hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-0.5 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-destructive/50 rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 6, ease: "linear" }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RealtimeNotificationPopup;
