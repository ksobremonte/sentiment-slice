import { useState } from "react";
import { Star, User, ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { PublicReview } from "@/hooks/usePublicReviews";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface PublicReviewCardProps {
  review: PublicReview;
  likes: number;
  dislikes: number;
  userReaction: string | null;
  onReact: (reviewId: string, reaction: "like" | "dislike") => void;
}

const PublicReviewCard = ({ review, likes, dislikes, userReaction, onReact }: PublicReviewCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true });

  // Collect all photo URLs
  const allPhotos: string[] = [];
  if (review.photo_urls && review.photo_urls.length > 0) {
    allPhotos.push(...review.photo_urls);
  } else if (review.photo_url) {
    allPhotos.push(review.photo_url);
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="bg-card border border-border rounded-xl p-5 shadow-card"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-semibold text-foreground">{review.name}</h4>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          <div className="flex gap-0.5 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-4 h-4",
                  star <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/20"
                )}
              />
            ))}
          </div>
          
          <p className="text-sm text-foreground/80 leading-relaxed">{review.feedback}</p>
          
          {allPhotos.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {allPhotos.map((url, i) => (
                <Dialog key={i}>
                  <DialogTrigger asChild>
                    <button className="rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-pointer">
                      <img
                        src={url}
                        alt={`Review photo ${i + 1}`}
                        className="w-[19rem] h-48 object-cover"
                      />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl bg-card">
                    <img src={url} alt={`Review photo ${i + 1}`} className="w-full rounded-xl" />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}

          {/* Like / Dislike buttons */}
          <div className="flex items-center gap-4 mt-3 pt-2 border-t border-border">
            <button
              onClick={() => onReact(review.id, "like")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-colors rounded-lg px-2.5 py-1.5",
                userReaction === "like"
                  ? "bg-success/15 text-success"
                  : "text-muted-foreground hover:text-success hover:bg-success/10"
              )}
            >
              <ThumbsUp className={cn("w-4 h-4", userReaction === "like" && "fill-success")} />
              <span>{likes}</span>
            </button>
            <button
              onClick={() => onReact(review.id, "dislike")}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium transition-colors rounded-lg px-2.5 py-1.5",
                userReaction === "dislike"
                  ? "bg-destructive/15 text-destructive"
                  : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              )}
            >
              <ThumbsDown className={cn("w-4 h-4", userReaction === "dislike" && "fill-destructive")} />
              <span>{dislikes}</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PublicReviewCard;
