import { useState, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ThumbsUp, Minus, ThumbsDown, BarChart3 } from "lucide-react";
import { subDays, subMonths, format, startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns";

type TimeRange = "7d" | "30d" | "90d" | "6m" | "1y";
type Granularity = "day" | "week" | "month";

const rangeConfig: Record<TimeRange, { label: string; days: number; granularity: Granularity }> = {
  "7d": { label: "Last 7 Days", days: 7, granularity: "day" },
  "30d": { label: "Last 30 Days", days: 30, granularity: "day" },
  "90d": { label: "Last 3 Months", days: 90, granularity: "week" },
  "6m": { label: "Last 6 Months", days: 180, granularity: "month" },
  "1y": { label: "Last Year", days: 365, granularity: "month" },
};

const fetchReviews = async () => {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, rating, sentiment, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
};

const DashboardTrends = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews-trends"],
    queryFn: fetchReviews,
  });

  const { chartData, summary } = useMemo(() => {
    const config = rangeConfig[timeRange];
    const cutoff = subDays(new Date(), config.days);
    const filtered = reviews.filter((r) => {
      if (!isAfter(new Date(r.created_at), cutoff)) return false;
      // Void: positive sentiment but 1-star rating (contradictory)
      const s = (r.sentiment || "neutral").toLowerCase();
      if (s === "positive" && r.rating === 1) return false;
      return true;
    });

    // Group by granularity
    const buckets = new Map<string, { positive: number; neutral: number; negative: number; total: number; ratingSum: number }>();

    const getKey = (date: Date) => {
      if (config.granularity === "day") return format(startOfDay(date), "yyyy-MM-dd");
      if (config.granularity === "week") return format(startOfWeek(date), "yyyy-MM-dd");
      return format(startOfMonth(date), "yyyy-MM");
    };

    const formatLabel = (key: string) => {
      if (config.granularity === "month") return format(new Date(key + "-01"), "MMM yyyy");
      if (config.granularity === "week") return format(new Date(key), "MMM d");
      return format(new Date(key), "MMM d");
    };

    for (const r of filtered) {
      const key = getKey(new Date(r.created_at));
      const bucket = buckets.get(key) || { positive: 0, neutral: 0, negative: 0, total: 0, ratingSum: 0 };
      bucket.total++;
      bucket.ratingSum += r.rating;
      const s = (r.sentiment || "neutral").toLowerCase();
      if (s === "positive") bucket.positive++;
      else if (s === "negative") bucket.negative++;
      else bucket.neutral++;
      buckets.set(key, bucket);
    }

    const sortedKeys = Array.from(buckets.keys()).sort();
    const chartData = sortedKeys.map((key) => {
      const b = buckets.get(key)!;
      return {
        label: formatLabel(key),
        Positive: b.positive,
        Neutral: b.neutral,
        Negative: b.negative,
        "Avg Rating": b.total > 0 ? Math.round((b.ratingSum / b.total) * 10) / 10 : 0,
      };
    });

    const totalReviews = filtered.length;
    const pos = filtered.filter((r) => (r.sentiment || "").toLowerCase() === "positive").length;
    const neg = filtered.filter((r) => (r.sentiment || "").toLowerCase() === "negative").length;
    const neu = totalReviews - pos - neg;

    return {
      chartData,
      summary: {
        total: totalReviews,
        positive: totalReviews > 0 ? Math.round((pos / totalReviews) * 100) : 0,
        neutral: totalReviews > 0 ? Math.round((neu / totalReviews) * 100) : 0,
        negative: totalReviews > 0 ? Math.round((neg / totalReviews) * 100) : 0,
        avgRating: totalReviews > 0 ? (filtered.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(1) : "N/A",
      },
    };
  }, [reviews, timeRange]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3 text-sm">
        <p className="font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any) => (
          <p key={entry.name} style={{ color: entry.color }} className="flex justify-between gap-4">
            <span>{entry.name}:</span>
            <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Customer Reviews Trend</h1>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(rangeConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Review Volume by Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">Loading chart…</div>
            ) : chartData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">No reviews in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="Positive" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Neutral" stroke="hsl(43, 96%, 56%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Negative" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard icon={<BarChart3 className="h-5 w-5 text-primary" />} label="Total Reviews" value={summary.total} />
          <SummaryCard icon={<TrendingUp className="h-5 w-5 text-primary" />} label="Avg Rating" value={`${summary.avgRating}★`} />
          <SummaryCard icon={<ThumbsUp className="h-5 w-5 text-green-500" />} label="Positive" value={`${summary.positive}%`} color="text-green-600" />
          <SummaryCard icon={<Minus className="h-5 w-5 text-yellow-500" />} label="Neutral" value={`${summary.neutral}%`} color="text-yellow-600" />
          <SummaryCard icon={<ThumbsDown className="h-5 w-5 text-red-500" />} label="Negative" value={`${summary.negative}%`} color="text-red-600" />
        </div>
      </div>
    </DashboardLayout>
  );
};

const SummaryCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color?: string }) => (
  <Card>
    <CardContent className="flex items-center gap-3 p-4">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default DashboardTrends;
