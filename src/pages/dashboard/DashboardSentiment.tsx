import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SentimentChart from "@/components/dashboard/SentimentChart";
import { useReviews } from "@/hooks/useReviews";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DashboardSentiment = () => {
  const [activeTab, setActiveTab] = useState("negative");
  const { data: reviews = [], isLoading, error } = useReviews();

  console.log("[DashboardSentiment] reviews:", reviews.length, "loading:", isLoading, "error:", error?.message);

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

  const handleFilterChange = (sentiment: string | null) => {
    if (sentiment) {
      setActiveTab(sentiment);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading sentiment data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h2 className="text-xl font-display font-bold text-foreground">Sentiment Distribution</h2>

        <SentimentChart
          sentimentData={sentimentData}
          filterSentiment={activeTab}
          onFilterChange={handleFilterChange}
        />

        {/* Comments by Sentiment - Tabbed */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-2 bg-transparent p-0">
            {["negative", "neutral", "positive"].map((sentiment) => {
              const config = sentimentConfig[sentiment];
              const items = groupedReviews[sentiment as keyof typeof groupedReviews] || [];
              return (
                <TabsTrigger
                  key={sentiment}
                  value={sentiment}
                  className={`rounded-xl border-2 ${config.borderClass} data-[state=active]:${config.bgClass} px-4 py-2`}
                >
                  <span className={config.color}>{config.label}</span>
                  <span className="ml-2 text-xs text-muted-foreground font-semibold">{items.length}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {["negative", "neutral", "positive"].map((sentiment) => {
            const config = sentimentConfig[sentiment];
            const items = groupedReviews[sentiment as keyof typeof groupedReviews] || [];
            return (
              <TabsContent key={sentiment} value={sentiment}>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <div className="text-center py-8 bg-card border-2 border-border rounded-2xl">
                      <MessageSquare className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No {config.label.toLowerCase()} comments</p>
                    </div>
                  ) : (
                    items.map((review) => (
                      <div
                        key={review.id}
                        className={`bg-card border-2 ${config.borderClass} rounded-xl p-4 space-y-2`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">{review.name}</span>
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < review.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80">{review.feedback}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSentiment;
