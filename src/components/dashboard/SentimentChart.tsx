import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

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

  const chartData = [
    { name: "Positive", value: positive, color: "hsl(var(--success))" },
    { name: "Negative", value: negative, color: "hsl(var(--destructive))" },
    { name: "Neutral", value: neutral, color: "hsl(var(--warning))" },
    { name: "Unanalyzed", value: unanalyzed, color: "hsl(var(--muted-foreground))" },
  ].filter(item => item.value > 0);

  const hasData = chartData.length > 0;

  return (
    <section className="mb-10">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Sentiment Distribution</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex items-center justify-center min-h-[200px]">
            {hasData ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
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
                          <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                            <p className="text-sm font-medium text-foreground">{data.name}</p>
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
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No reviews yet</p>
              </div>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 content-center">
            <button
              onClick={() => onFilterChange(filterSentiment === "positive" ? null : "positive")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                filterSentiment === "positive" 
                  ? "border-success bg-success/10" 
                  : "border-border hover:border-success/50"
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-sm font-medium text-foreground">Positive</span>
              <span className="text-lg font-bold text-success">{positive}</span>
            </button>
            
            <button
              onClick={() => onFilterChange(filterSentiment === "negative" ? null : "negative")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                filterSentiment === "negative" 
                  ? "border-destructive bg-destructive/10" 
                  : "border-border hover:border-destructive/50"
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <span className="text-sm font-medium text-foreground">Negative</span>
              <span className="text-lg font-bold text-destructive">{negative}</span>
            </button>
            
            <button
              onClick={() => onFilterChange(filterSentiment === "neutral" ? null : "neutral")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                filterSentiment === "neutral" 
                  ? "border-warning bg-warning/10" 
                  : "border-border hover:border-warning/50"
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-sm font-medium text-foreground">Neutral</span>
              <span className="text-lg font-bold text-warning">{neutral}</span>
            </button>

            {unanalyzed > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-muted/30">
                <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Unanalyzed</span>
                <span className="text-lg font-bold text-muted-foreground">{unanalyzed}</span>
              </div>
            )}
          </div>
        </div>

        {unanalyzed > 0 && (
          <p className="text-xs text-muted-foreground mt-4">
            {unanalyzed} review{unanalyzed !== 1 ? 's' : ''} pending sentiment analysis. Click "Analyze" on individual reviews to process them.
          </p>
        )}
      </div>
    </section>
  );
};

export default SentimentChart;
