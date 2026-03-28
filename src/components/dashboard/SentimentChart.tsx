import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback, useRef } from "react";
import html2canvas from "html2canvas";

interface SentimentData {
  positive: number;
  negative: number;
  neutral: number;
  unanalyzed: number;
  total: number;
}

interface SentimentChartProps {
  sentimentData: SentimentData;
  filterSentiment: string | null;
  onFilterChange: (sentiment: string | null) => void;
}

const SentimentChart = ({ sentimentData, filterSentiment, onFilterChange }: SentimentChartProps) => {
  const { positive, negative, neutral, unanalyzed, total } = sentimentData;
  const reportRef = useRef<HTMLDivElement>(null);

  const analyzed = positive + negative + neutral;
  const posPercent = analyzed > 0 ? Math.round((positive / analyzed) * 100) : 0;
  const neuPercent = analyzed > 0 ? Math.round((neutral / analyzed) * 100) : 0;
  const negPercent = analyzed > 0 ? Math.round((negative / analyzed) * 100) : 0;

  const chartData = [
    { name: "Positive", value: positive, color: "hsl(var(--success))" },
    { name: "Neutral", value: neutral, color: "hsl(var(--warning))" },
    { name: "Negative", value: negative, color: "hsl(var(--destructive))" },
    { name: "Unanalyzed", value: unanalyzed, color: "hsl(var(--muted-foreground))" },
  ].filter(item => item.value > 0);

  const hasData = chartData.length > 0;

  // Find top negative keyword placeholder
  const topInsight = negative > 0
    ? `Negative feedback represents ${negPercent}% of analyzed reviews`
    : "All feedback is trending positive!";

  const handleDownload = useCallback(async () => {
    if (!reportRef.current) return;
    const isDark = document.documentElement.classList.contains("dark");
    const canvas = await html2canvas(reportRef.current, { backgroundColor: isDark ? "#1a1410" : "#ffffff", scale: 2 });
    const link = document.createElement("a");
    link.download = `sentiment-report-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  // Date range (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const formatDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <section className="mb-10">
      <div ref={reportRef} className="bg-card border-2 border-border rounded-2xl p-8 shadow-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-foreground">Sentiment Distribution</h3>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>DATE RANGE: {formatDate(thirtyDaysAgo)} - {formatDate(now)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Donut Chart with center label */}
          <div className="flex flex-col items-center justify-center">
            {hasData ? (
              <div className="relative">
                <ResponsiveContainer width={260} height={260}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover border-2 border-border rounded-xl px-4 py-3 shadow-warm">
                              <p className="text-sm font-display font-semibold text-foreground">{data.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {data.value} reviews ({((data.value / total) * 100).toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-display font-bold text-foreground">{total}</span>
                  <span className="text-[11px] text-muted-foreground font-semibold">Total Reviews</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">Last 30 Days</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p className="font-display text-lg">No reviews yet</p>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs font-semibold text-foreground">Positive</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-xs font-semibold text-foreground">Neutral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-xs font-semibold text-foreground">Negative</span>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">Based on all user text reviews.</p>
          </div>

          {/* Right: Key Metrics */}
          <div className="flex flex-col gap-3 justify-center">
            <h4 className="text-sm font-display font-bold text-foreground uppercase tracking-wider mb-1">Key Metrics</h4>

            {/* Positive card */}
            <button
              onClick={() => onFilterChange(filterSentiment === "positive" ? null : "positive")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left w-full ${
                filterSentiment === "positive"
                  ? "border-success bg-success/10 shadow-card"
                  : "border-border hover:border-success/50"
              }`}
            >
              <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-foreground">{posPercent}% Positive</p>
                <p className="text-xs text-muted-foreground">{positive} reviews</p>
              </div>
            </button>

            {/* Neutral & Negative row */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onFilterChange(filterSentiment === "neutral" ? null : "neutral")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  filterSentiment === "neutral"
                    ? "border-warning bg-warning/10 shadow-card"
                    : "border-border hover:border-warning/50"
                }`}
              >
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">{neuPercent}% Neutral</p>
                  <p className="text-xs text-muted-foreground">{neutral} reviews</p>
                </div>
              </button>

              <button
                onClick={() => onFilterChange(filterSentiment === "negative" ? null : "negative")}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                  filterSentiment === "negative"
                    ? "border-destructive bg-destructive/10 shadow-card"
                    : "border-border hover:border-destructive/50"
                }`}
              >
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">{negPercent}% Negative</p>
                  <p className="text-xs text-muted-foreground">{negative} reviews</p>
                </div>
              </button>
            </div>

            {/* Trending Insight */}
            <div className="flex items-start gap-2 px-4 py-3 rounded-xl border border-border bg-muted/30">
              <TrendingUp className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">TRENDING INSIGHT:</span> {topInsight}
              </p>
            </div>
          </div>
        </div>

        {unanalyzed > 0 && (
          <p className="text-sm text-muted-foreground mt-6 bg-muted/50 rounded-xl p-4">
            💡 {unanalyzed} review{unanalyzed !== 1 ? "s" : ""} pending sentiment analysis.
          </p>
        )}
      </div>

      {/* Download button outside exportable area */}
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="font-semibold uppercase tracking-wider">Download Report</span>
      </button>
    </section>
  );
};

export default SentimentChart;
