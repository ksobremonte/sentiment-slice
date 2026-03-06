import { Send, User, Star, Image as ImageIcon, MessageSquare, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Review } from "@/hooks/useReviews";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdminResponseDialog from "./AdminResponseDialog";

interface ReviewCardProps {
  review: Review;
  onAnalyze: (review: Review) => void;
  onViewSentiment?: (review: Review) => void;
}

const ReviewCard = ({ review, onAnalyze, onViewSentiment }: ReviewCardProps) => {
  const getSentimentStyles = () => {
    if (!review.sentiment) return "border-l-4 border-l-muted";
    
    switch (review.sentiment) {
      case "positive":
        return "border-l-4 border-l-success";
      case "negative":
        return "border-l-4 border-l-destructive";
      case "neutral":
        return "border-l-4 border-l-warning";
      default:
        return "border-l-4 border-l-muted";
    }
  };

  const timeAgo = formatDistanceToNow(new Date(review.created_at), { addSuffix: true });

  return (
    <div className={cn(
      "bg-card border-2 border-border rounded-2xl p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-card animate-fade-in",
      getSentimentStyles()
    )}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-secondary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display font-semibold text-lg text-foreground">{review.name}</h4>
              {isVoid && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-muted-foreground/10 text-muted-foreground flex items-center gap-1">
                  <Ban className="w-3 h-3" />
                  Void
                </span>
              )}
              {review.sentiment && !isVoid && (
                <span className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full",
                  review.sentiment === "positive" && "bg-success/10 text-success",
                  review.sentiment === "negative" && "bg-destructive/10 text-destructive",
                  review.sentiment === "neutral" && "bg-warning/10 text-warning"
                )}>
                  {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                </span>
              )}
              {review.name === "Chat Visitor" && (
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  Chat Feedback
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <AdminResponseDialog
                reviewId={review.id}
                reviewerName={review.name}
                existingResponse={review.admin_response}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAnalyze(review)}
                className="rounded-xl border-2 font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary"
              >
                <Send className="w-4 h-4 mr-2" />
                Analyze
              </Button>
            </div>
          </div>
          
          {/* Star Rating */}
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  "w-5 h-5",
                  star <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"
                )}
              />
            ))}
          </div>
          
          <p className="text-foreground leading-relaxed">{review.feedback}</p>
          
          {/* Sentiment Explanation */}
          {review.sentiment && review.sentiment_reason && (
            <div
              onClick={() => onViewSentiment?.(review)}
              className={cn(
                "mt-3 p-3 bg-muted/50 rounded-xl border border-border transition-all",
                onViewSentiment && "cursor-pointer hover:bg-muted/80 hover:border-primary/30"
              )}
            >
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Why {review.sentiment}?
                {onViewSentiment && <span className="ml-1 text-primary">→ View details</span>}
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{review.sentiment_reason}</p>
              {review.sentiment_keywords && review.sentiment_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {review.sentiment_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        review.sentiment === "positive" && "bg-success/10 text-success",
                        review.sentiment === "negative" && "bg-destructive/10 text-destructive",
                        review.sentiment === "neutral" && "bg-warning/10 text-warning"
                      )}
                    >
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Admin Response */}
          {review.admin_response && (
            <div className="mt-4 p-3 bg-secondary/50 rounded-xl border border-border">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary">Admin Response</span>
                {review.admin_response_at && (
                  <span className="text-xs text-muted-foreground">
                    • {formatDistanceToNow(new Date(review.admin_response_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground">{review.admin_response}</p>
            </div>
          )}
          
          {/* Photo Preview */}
          {review.photo_url && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="mt-4 flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                  <ImageIcon className="w-4 h-4" />
                  View attached photo
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card">
                <img
                  src={review.photo_url}
                  alt="Review attachment"
                  className="w-full rounded-xl"
                />
              </DialogContent>
            </Dialog>
          )}
          
          <p className="text-xs text-muted-foreground mt-4">{timeAgo}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
