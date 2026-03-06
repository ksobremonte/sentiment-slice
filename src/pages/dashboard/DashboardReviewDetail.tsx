import { useParams, useNavigate } from "react-router-dom";
import { useReviews } from "@/hooks/useReviews";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Star, ThumbsUp, ThumbsDown, Minus, Sparkles,
  Quote, Tag, User, MessageSquare, Calendar, Clock, ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const DashboardReviewDetail = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const { data: reviews } = useReviews();

  const review = reviews?.find((r) => r.id === reviewId);

  if (!review) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-muted-foreground">Review not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const getSentimentData = () => {
    switch (review.sentiment) {
      case "positive":
        return { icon: ThumbsUp, title: "Positive", color: "text-success", bg: "bg-success/10", border: "border-success" };
      case "negative":
        return { icon: ThumbsDown, title: "Negative", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive" };
      case "mixed":
        return { icon: Minus, title: "Mixed", color: "text-warning", bg: "bg-warning/10", border: "border-warning" };
      default:
        return { icon: Minus, title: "Neutral", color: "text-muted-foreground", bg: "bg-muted/10", border: "border-muted" };
    }
  };

  const sentiment = getSentimentData();
  const SentimentIcon = sentiment.icon;
  const createdAt = new Date(review.created_at);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        {/* Sentiment Header */}
        <Card className={cn("border-2 overflow-hidden", sentiment.border)}>
          <div className={cn("px-6 py-5 flex items-center gap-4", sentiment.bg)}>
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", sentiment.bg, "border-2", sentiment.border)}>
              <SentimentIcon className={cn("w-7 h-7", sentiment.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Sentiment Analysis</span>
              </div>
              <h2 className={cn("text-2xl font-display font-bold", sentiment.color)}>{sentiment.title} Sentiment</h2>
            </div>
          </div>

          {/* Sentiment Explanation */}
          {(review.sentiment_reason || (review.sentiment_keywords && review.sentiment_keywords.length > 0)) && (
            <CardContent className="p-6 border-t border-border">
              {review.sentiment_reason && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Quote className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">Why this result?</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{review.sentiment_reason}</p>
                </div>
              )}
              {review.sentiment_keywords && review.sentiment_keywords.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Key Phrases</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {review.sentiment_keywords.map((kw, i) => (
                      <Badge key={i} variant="secondary" className={cn(
                        "text-xs",
                        review.sentiment === "positive" && "bg-success/15 text-success",
                        review.sentiment === "negative" && "bg-destructive/15 text-destructive",
                        review.sentiment === "mixed" && "bg-warning/15 text-warning",
                      )}>
                        "{kw}"
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Full Review */}
        <Card className="border-2 border-border">
          <CardContent className="p-6 space-y-5">
            {/* Reviewer info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground">{review.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(createdAt, "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(createdAt, "h:mm a")}
                  </span>
                </div>
              </div>
            </div>

            {/* Star Rating */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("w-5 h-5", s <= review.rating ? "fill-warning text-warning" : "text-muted-foreground/30")} />
              ))}
              <span className="text-sm text-muted-foreground ml-2">{review.rating}/5</span>
            </div>

            {/* Feedback */}
            <div className="bg-muted/30 rounded-xl p-4 border border-border">
              <p className="text-foreground leading-relaxed">{review.feedback}</p>
            </div>


            {/* Photo */}
            {review.photo_url && (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                    <ImageIcon className="w-4 h-4" /> View attached photo
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl bg-card">
                  <img src={review.photo_url} alt="Review attachment" className="w-full rounded-xl" />
                </DialogContent>
              </Dialog>
            )}

            {/* Admin Response */}
            {review.admin_response && (
              <div className="p-4 bg-secondary/50 rounded-xl border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">Admin Response</span>
                  {review.admin_response_at && (
                    <span className="text-xs text-muted-foreground">
                      • {format(new Date(review.admin_response_at), "MMM d, yyyy h:mm a")}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground">{review.admin_response}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardReviewDetail;
