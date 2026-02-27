import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SentimentChart from "@/components/dashboard/SentimentChart";
import { useReviews } from "@/hooks/useReviews";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DashboardSentiment = () => {
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);
  const { data: reviews = [] } = useReviews();

  const sentimentData = useMemo(() => {
    const positive = reviews.filter((r) => r.sentiment === "positive").length;
    const negative = reviews.filter((r) => r.sentiment === "negative").length;
    const neutral = reviews.filter((r) => r.sentiment === "neutral").length;
    const unanalyzed = reviews.filter((r) => !r.sentiment).length;
    return { positive, negative, neutral, unanalyzed, total: reviews.length };
  }, [reviews]);

  const groupedReviews = useMemo(() => {
    const groups = {
      negative: reviews.filter((r) => r.sentiment === "negative"),
      neutral: reviews.filter((r) => r.sentiment === "neutral"),
      positive: reviews.filter((r) => r.sentiment === "positive"),
    };
    return groups;
  }, [reviews]);

  const sentimentConfig: Record<string, { label: string; color: string; bgClass: string; borderClass: string }> = {
    negative: { label: "Negative", color: "text-destructive", bgClass: "bg-destructive/10", borderClass: "border-destructive/30" },
    neutral: { label: "Neutral", color: "text-warning", bgClass: "bg-warning/10", borderClass: "border-warning/30" },
    positive: { label: "Positive", color: "text-success", bgClass: "bg-success/10", borderClass: "border-success/30" },
  };

  const displayOrder = filterSentiment
    ? [filterSentiment]
    : ["negative", "neutral", "positive"];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h2 className="text-xl font-display font-bold text-foreground">Sentiment Distribution</h2>

        <SentimentChart
          sentimentData={sentimentData}
          filterSentiment={filterSentiment}
          onFilterChange={setFilterSentiment}
        />

        {/* Comments by Sentiment */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {displayOrder.map((sentiment) => {
            const config = sentimentConfig[sentiment];
            const items = groupedReviews[sentiment as keyof typeof groupedReviews] || [];

            return (
              <div key={sentiment} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${config.bgClass} ${config.color} ${config.borderClass} border`}>
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-semibold">{items.length}</span>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <div className="text-center py-8 bg-card border-2 border-border rounded-2xl">
                      <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No {config.label.toLowerCase()} comments</p>
                    </div>
                  ) : (
                    items.map((review) => (
                      <div
                        key={review.id}
                        className={`bg-card border-2 ${config.borderClass} rounded-xl p-3 space-y-1.5`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{review.name}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 line-clamp-3">{review.feedback}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSentiment;
