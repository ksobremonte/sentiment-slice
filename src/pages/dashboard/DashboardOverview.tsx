import { useState, useMemo } from "react";
import { MessageSquare, Users, Clock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import StatsDetail from "@/components/dashboard/StatsDetail";
import SentimentChart from "@/components/dashboard/SentimentChart";
import { useReviews } from "@/hooks/useReviews";

type ViewState =
  | { type: "overview" }
  | { type: "stats"; statsType: "comments" | "customers" | "response" };

const DashboardOverview = () => {
  const [view, setView] = useState<ViewState>({ type: "overview" });
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);
  const { data: reviews = [] } = useReviews();

  const uniqueCustomers = new Set(reviews.map((r) => r.name)).size;

  const sentimentData = useMemo(() => {
    const positive = reviews.filter((r) => r.sentiment === "positive").length;
    const negative = reviews.filter((r) => r.sentiment === "negative").length;
    const neutral = reviews.filter((r) => r.sentiment === "neutral").length;
    const unanalyzed = reviews.filter((r) => !r.sentiment).length;
    return { positive, negative, neutral, unanalyzed, total: reviews.length };
  }, [reviews]);

  if (view.type === "stats") {
    const commentsForStats = reviews.map((r) => ({
      id: r.id,
      customerName: r.name,
      customerEmail: "",
      content: r.feedback,
      timestamp: r.created_at,
      sentiment: r.sentiment as "positive" | "negative" | "neutral" | undefined,
    }));
    return (
      <DashboardLayout>
        <StatsDetail
          type={view.statsType}
          comments={commentsForStats}
          onBack={() => setView({ type: "overview" })}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <h2 className="text-xl font-display font-bold text-foreground mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Total Reviews"
          value={reviews.length}
          icon={MessageSquare}
          trend="up"
          trendValue="+12%"
          description="vs last week"
          onClick={() => setView({ type: "stats", statsType: "comments" })}
        />
        <StatsCard
          title="Unique Customers"
          value={uniqueCustomers}
          icon={Users}
          trend="up"
          trendValue="+8%"
          description="vs last week"
          onClick={() => setView({ type: "stats", statsType: "customers" })}
        />
        <StatsCard
          title="Avg. Response Time"
          value="2.5m"
          icon={Clock}
          trend="down"
          trendValue="-15%"
          description="faster than usual"
          onClick={() => setView({ type: "stats", statsType: "response" })}
        />
      </div>

      <SentimentChart
        sentimentData={sentimentData}
        filterSentiment={filterSentiment}
        onFilterChange={setFilterSentiment}
      />
    </DashboardLayout>
  );
};

export default DashboardOverview;
