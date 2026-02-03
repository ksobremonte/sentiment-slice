import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { Review } from "@/hooks/useReviews";
import { format, startOfDay, subDays, eachDayOfInterval } from "date-fns";

interface TrendAnalysisChartProps {
  reviews: Review[];
}

const TrendAnalysisChart = ({ reviews }: TrendAnalysisChartProps) => {
  const trendData = useMemo(() => {
    if (reviews.length === 0) return [];

    // Get date range (last 14 days)
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, 13);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayReviews = reviews.filter(r => {
        const reviewDate = format(startOfDay(new Date(r.created_at)), "yyyy-MM-dd");
        return reviewDate === dayStr;
      });
      
      const positive = dayReviews.filter(r => r.sentiment === "positive").length;
      const negative = dayReviews.filter(r => r.sentiment === "negative").length;
      const neutral = dayReviews.filter(r => r.sentiment === "neutral").length;
      
      return {
        date: format(day, "MMM d"),
        positive,
        negative,
        neutral,
        total: dayReviews.length,
      };
    });
  }, [reviews]);

  const hasData = trendData.some(d => d.total > 0);

  return (
    <section className="mb-10">
      <div className="bg-card border-2 border-border rounded-2xl p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-display font-bold text-foreground">Sentiment Trend Analysis</h3>
          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">Last 14 days</span>
        </div>
        
        {hasData ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                />
                <YAxis 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickLine={{ stroke: "hsl(var(--border))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border-2 border-border rounded-xl px-4 py-3 shadow-warm">
                          <p className="text-sm font-display font-semibold text-foreground mb-2">{label}</p>
                          {payload.map((entry, index) => (
                            <p key={index} className="text-xs" style={{ color: entry.color }}>
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: 12 }}
                  iconType="circle"
                />
                <Line 
                  type="monotone" 
                  dataKey="positive" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--success))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Positive"
                />
                <Line 
                  type="monotone" 
                  dataKey="negative" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--destructive))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Negative"
                />
                <Line 
                  type="monotone" 
                  dataKey="neutral" 
                  stroke="hsl(var(--warning))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--warning))", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Neutral"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <p className="font-display text-lg">No trend data available yet</p>
          </div>
        )}
        
        <p className="text-sm text-muted-foreground mt-4 bg-muted/50 rounded-xl p-4">
          📈 Track how customer sentiment changes over time to identify patterns and measure the impact of improvements.
        </p>
      </div>
    </section>
  );
};

export default TrendAnalysisChart;
