import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SentimentChart from "@/components/dashboard/SentimentChart";
import { useReviews } from "@/hooks/useReviews";

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

  return (
    <DashboardLayout>
      <h2 className="text-xl font-display font-bold text-foreground mb-6">Sentiment Distribution</h2>
      <SentimentChart
        sentimentData={sentimentData}
        filterSentiment={filterSentiment}
        onFilterChange={setFilterSentiment}
      />
    </DashboardLayout>
  );
};

export default DashboardSentiment;
