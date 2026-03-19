import { useState, useMemo, useEffect } from "react";
import {
  Smile, Frown, MessageSquareWarning, ThumbsUp,
  TrendingUp, Bell, Sparkles, Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import StatsDetail from "@/components/dashboard/StatsDetail";
import SentimentChart from "@/components/dashboard/SentimentChart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useReviews } from "@/hooks/useReviews";
import { useSeedReviews } from "@/hooks/useSeedReviews";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, isAfter, startOfDay } from "date-fns";

type ViewState =
  | { type: "overview" }
  | { type: "stats"; statsType: "comments" | "customers" | "response" };

const DashboardOverview = () => {
  const [view, setView] = useState<ViewState>({ type: "overview" });
  const [filterSentiment, setFilterSentiment] = useState<string | null>(null);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const {
    data: reviews = [],
    isLoading: reviewsLoading,
    isError: reviewsError,
    error: reviewsErrorDetails,
  } = useReviews();

  console.log("[DashboardOverview] Review payload", {
    reviewCount: reviews.length,
    loading: reviewsLoading,
    hasError: reviewsError,
    errorMessage: reviewsErrorDetails?.message ?? null,
  });

  const { data: alertSettings } = useQuery({
    queryKey: ["alert-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alert_settings").select("*").limit(1).single();
      if (error) throw error;
      return data;
    },
  });

  // Split reviews into this week and last week, with all-time fallback if this week has no records
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfDay(subDays(now, 7));
    const prevWeekStart = startOfDay(subDays(now, 14));

    const thisWeek = reviews.filter((r) => isAfter(new Date(r.created_at), weekStart));
    const lastWeek = reviews.filter((r) => {
      const d = new Date(r.created_at);
      return isAfter(d, prevWeekStart) && !isAfter(d, weekStart);
    });

    const calcSentiment = (list: typeof reviews) => {
      const pos = list.filter((r) => r.sentiment === "positive").length;
      const neg = list.filter((r) => r.sentiment === "negative").length;
      const neu = list.filter((r) => r.sentiment === "neutral").length;
      const analyzed = pos + neg + neu;
      return { pos, neg, neu, analyzed, total: list.length };
    };

    const allTime = calcSentiment(reviews);
    const thisWeekStats = calcSentiment(thisWeek);
    const lastWeekStats = calcSentiment(lastWeek);
    const activePeriodStats = thisWeekStats.total > 0 ? thisWeekStats : allTime;
    const periodForKeywords = thisWeekStats.total > 0 ? thisWeek : reviews;

    // Overall sentiment score (0-100, 100 = all positive)
    const overallScore = activePeriodStats.analyzed > 0
      ? Math.round(((activePeriodStats.pos + activePeriodStats.neu * 0.5) / activePeriodStats.analyzed) * 100)
      : 0;
    const prevScore = lastWeekStats.analyzed > 0
      ? Math.round(((lastWeekStats.pos + lastWeekStats.neu * 0.5) / lastWeekStats.analyzed) * 100)
      : overallScore;
    const scoreDiff = overallScore - prevScore;

    // Negative rate
    const negRate = activePeriodStats.analyzed > 0 ? (activePeriodStats.neg / activePeriodStats.analyzed) * 100 : 0;
    const prevNegRate = lastWeekStats.analyzed > 0 ? (lastWeekStats.neg / lastWeekStats.analyzed) * 100 : negRate;
    const negDiff = negRate - prevNegRate;

    // Top complaint keyword
    const negReviews = periodForKeywords.filter((r) => r.sentiment === "negative");
    const words: Record<string, number> = {};
    negReviews.forEach((r) => {
      r.feedback.toLowerCase().split(/\s+/).filter((w) => w.length > 4).forEach((w) => {
        words[w] = (words[w] || 0) + 1;
      });
    });
    const topComplaint = Object.entries(words).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

    // Most praised aspect
    const posReviews = periodForKeywords.filter((r) => r.sentiment === "positive");
    const posWords: Record<string, number> = {};
    posReviews.forEach((r) => {
      r.feedback.toLowerCase().split(/\s+/).filter((w) => w.length > 4).forEach((w) => {
        posWords[w] = (posWords[w] || 0) + 1;
      });
    });
    const topPraise = Object.entries(posWords).sort((a, b) => b[1] - a[1])[0]?.[0] || "none";

    // Sentiment trend (week-over-week score change)
    const trendDirection = scoreDiff > 0 ? "up" : scoreDiff < 0 ? "down" : "neutral";

    // Alert status
    const threshold = alertSettings?.threshold_percentage ?? 30;
    let alertLevel: "critical" | "moderate" | "normal" = "normal";
    if (negRate >= threshold + 20) alertLevel = "critical";
    else if (negRate >= threshold) alertLevel = "moderate";

    console.log("[DashboardOverview] Computed sentiment", {
      allTimeTotal: allTime.total,
      allTimePositive: allTime.pos,
      allTimeNegative: allTime.neg,
      allTimeNeutral: allTime.neu,
      thisWeekTotal: thisWeekStats.total,
    });

    return {
      overallScore, scoreDiff, prevScore,
      negRate, negDiff, prevNegRate,
      topComplaint, topPraise,
      trendDirection, scoreDiffAbs: Math.abs(scoreDiff),
      alertLevel, threshold,
      sentimentData: {
        positive: allTime.pos,
        negative: allTime.neg,
        neutral: allTime.neu,
        unanalyzed: allTime.total - allTime.analyzed,
        total: allTime.total,
      },
    };
  }, [reviews, alertSettings]);

  // AI insight generation
  useEffect(() => {
    if (reviews.length === 0) return;
    const generateInsight = async () => {
      setInsightLoading(true);
      try {
        const response = await supabase.functions.invoke("analyze-reviews", {
          body: {
            reviews: reviews.slice(0, 20),
            action: "chat",
            messages: [
              {
                role: "user",
                content: `Summarize current customer sentiment in ONE concise sentence (max 30 words). Score: ${stats.overallScore}/100, negative rate: ${stats.negRate.toFixed(1)}%, top complaint: "${stats.topComplaint}", most praised: "${stats.topPraise}". Be specific and actionable.`,
              },
            ],
          },
        });

        if (response.error) throw response.error;

        // Parse SSE stream
        const text = await response.data.text();
        let result = "";
        for (const line of text.split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const json = JSON.parse(line.slice(6));
              result += json.choices?.[0]?.delta?.content || "";
            } catch {
              // skip malformed chunks
            }
          }
        }
        setAiInsight(result.trim() || null);
      } catch {
        setAiInsight(null);
      } finally {
        setInsightLoading(false);
      }
    };
    generateInsight();
  }, [reviews.length]); // Only regenerate when review count changes

  if (reviewsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (reviewsError) {
    return (
      <DashboardLayout>
        <div className="rounded-2xl border-2 border-destructive/30 bg-destructive/10 p-6">
          <h3 className="text-base font-semibold text-destructive">Could not load reviews</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {(reviewsErrorDetails as Error | null)?.message ?? "Please refresh and sign in again."}
          </p>
        </div>
      </DashboardLayout>
    );
  }

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

  const alertColors = {
    critical: "bg-destructive text-destructive-foreground",
    moderate: "bg-warning text-warning-foreground",
    normal: "bg-success text-success-foreground",
  };

  return (
    <DashboardLayout>
      <h2 className="text-xl font-display font-bold text-foreground mb-6">Sentiment Overview</h2>

      {/* AI Insight Banner */}
      <Card className="p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 mb-6">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-primary mb-1">AI Insight</p>
            {insightLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Analyzing feedback…
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed">{aiInsight || "Submit reviews to generate insights."}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Sentiment Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Overall Sentiment Score"
          value={`${stats.overallScore}/100`}
          icon={Smile}
          trend={stats.scoreDiff >= 0 ? "up" : "down"}
          trendValue={`${stats.scoreDiff >= 0 ? "+" : ""}${stats.scoreDiff}pts`}
          description="vs last week"
          onClick={() => setView({ type: "stats", statsType: "comments" })}
        />
        <StatsCard
          title="Negative Sentiment Rate"
          value={`${stats.negRate.toFixed(1)}%`}
          icon={Frown}
          trend={stats.negDiff <= 0 ? "up" : "down"}
          trendValue={`${stats.negDiff >= 0 ? "+" : ""}${stats.negDiff.toFixed(1)}%`}
          description="vs last week"
          onClick={() => setView({ type: "stats", statsType: "comments" })}
        />
        <StatsCard
          title="Top Complaint Keyword"
          value={`"${stats.topComplaint}"`}
          icon={MessageSquareWarning}
          trend="neutral"
          trendValue="this week"
          description="from negative reviews"
        />
        <StatsCard
          title="Most Praised Aspect"
          value={`"${stats.topPraise}"`}
          icon={ThumbsUp}
          trend="neutral"
          trendValue="this week"
          description="from positive reviews"
        />
        <StatsCard
          title="Sentiment Trend"
          value={stats.trendDirection === "up" ? "Improving" : stats.trendDirection === "down" ? "Declining" : "Stable"}
          icon={TrendingUp}
          trend={stats.trendDirection as "up" | "down" | "neutral"}
          trendValue={`${stats.scoreDiffAbs}pts`}
          description="week-over-week"
        />
        <div className="group relative overflow-hidden rounded-2xl bg-card border-2 border-border p-6 shadow-card">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary/10">
              <Bell className="w-7 h-7 text-primary" />
            </div>
            <Badge className={alertColors[stats.alertLevel]}>{stats.alertLevel}</Badge>
          </div>
          <h3 className="text-2xl font-display font-bold text-foreground mb-2">
            {stats.alertLevel === "critical" ? "⚠️ Critical" : stats.alertLevel === "moderate" ? "⚡ Moderate" : "✅ Normal"}
          </h3>
          <p className="text-sm font-semibold text-muted-foreground">Active Alert Status</p>
          <p className="text-xs text-muted-foreground/70 mt-2">Threshold: {stats.threshold}%</p>
        </div>
      </div>

      <SentimentChart
        sentimentData={stats.sentimentData}
        filterSentiment={filterSentiment}
        onFilterChange={setFilterSentiment}
      />
    </DashboardLayout>
  );
};

export default DashboardOverview;
