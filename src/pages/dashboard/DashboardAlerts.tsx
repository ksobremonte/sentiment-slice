import { useState, useMemo } from "react";
import { Bell, AlertTriangle, CheckCircle, Settings, Trash2, Loader2, TrendingDown } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useReviews } from "@/hooks/useReviews";
import { toast } from "sonner";
import { format, isToday, startOfDay } from "date-fns";

const levelConfig = {
  critical: { color: "bg-destructive text-destructive-foreground", icon: AlertTriangle, border: "border-destructive/40", bg: "bg-destructive/5" },
  moderate: { color: "bg-warning text-warning-foreground", icon: AlertTriangle, border: "border-warning/40", bg: "bg-warning/5" },
  normal: { color: "bg-success text-success-foreground", icon: CheckCircle, border: "border-success/40", bg: "bg-success/5" },
};

const DashboardAlerts = () => {
  const queryClient = useQueryClient();
  const { data: reviews = [] } = useReviews();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newThreshold, setNewThreshold] = useState("");

  // Fetch alert settings
  const { data: settings } = useQuery({
    queryKey: ["alert-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch alert history
  const { data: alertHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["alert-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alert_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Calculate today's sentiment stats
  const todayStats = useMemo(() => {
    const todayReviews = reviews.filter((r) => isToday(new Date(r.created_at)));
    const negativeReviews = todayReviews.filter((r) => r.sentiment === "negative");
    const total = todayReviews.length;
    const negCount = negativeReviews.length;
    const percentage = total > 0 ? (negCount / total) * 100 : 0;

    // Extract top keyword from negative feedback
    const words: Record<string, number> = {};
    negativeReviews.forEach((r) => {
      r.feedback
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 4)
        .forEach((w) => {
          words[w] = (words[w] || 0) + 1;
        });
    });
    const topKeyword = Object.entries(words).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const threshold = settings?.threshold_percentage ?? 30;
    let level: "critical" | "moderate" | "normal" = "normal";
    if (percentage >= threshold + 20) level = "critical";
    else if (percentage >= threshold) level = "moderate";

    return { total, negCount, percentage, topKeyword, level };
  }, [reviews, settings]);

  // Update threshold
  const updateThreshold = useMutation({
    mutationFn: async (value: number) => {
      const { error } = await supabase
        .from("alert_settings")
        .update({ threshold_percentage: value, updated_at: new Date().toISOString() })
        .eq("id", settings!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Threshold updated");
      queryClient.invalidateQueries({ queryKey: ["alert-settings"] });
      setSettingsOpen(false);
    },
    onError: () => toast.error("Failed to update threshold"),
  });

  // Log current alert
  const logAlert = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("alert_history").insert({
        alert_level: todayStats.level,
        message:
          todayStats.level === "normal"
            ? "Sentiment levels are normal"
            : `High negative sentiment detected — ${todayStats.percentage.toFixed(1)}%`,
        negative_percentage: todayStats.percentage,
        top_keyword: todayStats.topKeyword,
        review_count: todayStats.total,
        negative_count: todayStats.negCount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alert logged to history");
      queryClient.invalidateQueries({ queryKey: ["alert-history"] });
    },
    onError: () => toast.error("Failed to log alert"),
  });

  // Clear history
  const clearHistory = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("alert_history").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alert history cleared");
      queryClient.invalidateQueries({ queryKey: ["alert-history"] });
    },
  });

  const currentConfig = levelConfig[todayStats.level];
  const CurrentIcon = currentConfig.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">Alert System</h2>
              <p className="text-sm text-muted-foreground">Real-time sentiment monitoring & alerts</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => logAlert.mutate()}>
              Log Current Status
            </Button>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl">
                  <Settings className="h-4 w-4 mr-1" /> Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Alert Threshold Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Current threshold: <strong>{settings?.threshold_percentage ?? 30}%</strong>. Alerts trigger when negative reviews exceed this percentage in a day.
                  </p>
                  <div className="space-y-2">
                    <Label>New Threshold (%)</Label>
                    <Input
                      type="number"
                      min={5}
                      max={100}
                      value={newThreshold}
                      onChange={(e) => setNewThreshold(e.target.value)}
                      placeholder={String(settings?.threshold_percentage ?? 30)}
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl"
                    disabled={!newThreshold || updateThreshold.isPending}
                    onClick={() => updateThreshold.mutate(Number(newThreshold))}
                  >
                    {updateThreshold.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Save Threshold
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Current Status Card */}
        <Card className={`p-6 rounded-2xl border-2 ${currentConfig.border} ${currentConfig.bg}`}>
          <div className="flex items-start gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center ${currentConfig.color}`}>
              <CurrentIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-display font-bold text-foreground">
                  {todayStats.level === "critical"
                    ? "Critical: High negative sentiment detected today"
                    : todayStats.level === "moderate"
                    ? "Warning: Negative sentiment rising today"
                    : "Normal: Sentiment levels are healthy"}
                </h3>
                <Badge className={currentConfig.color}>{todayStats.level}</Badge>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <p className="text-xs text-muted-foreground">Negative %</p>
                  <p className="text-lg font-bold text-foreground">{todayStats.percentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Today</p>
                  <p className="text-lg font-bold text-foreground">{todayStats.total}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Negative Today</p>
                  <p className="text-lg font-bold text-foreground">{todayStats.negCount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Top Keyword</p>
                  <p className="text-lg font-bold text-foreground">{todayStats.topKeyword || "—"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Threshold: {settings?.threshold_percentage ?? 30}% · {format(new Date(), "PPp")}
              </p>
            </div>
          </div>
        </Card>

        {/* Alert History */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-muted-foreground" /> Alert History
          </h3>
          {alertHistory.length > 0 && (
            <Button variant="ghost" size="sm" className="text-destructive rounded-xl" onClick={() => clearHistory.mutate()}>
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : alertHistory.length === 0 ? (
          <Card className="p-8 rounded-2xl border-2 text-center">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-display">No alerts logged yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Log Current Status" to record the first snapshot</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {alertHistory.map((alert) => {
              const cfg = levelConfig[alert.alert_level as keyof typeof levelConfig] || levelConfig.normal;
              const Icon = cfg.icon;
              return (
                <Card key={alert.id} className={`p-4 rounded-2xl border-2 ${cfg.border}`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${cfg.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(alert.negative_percentage).toFixed(1)}% negative · {alert.negative_count}/{alert.review_count} reviews
                        {alert.top_keyword ? ` · Keyword: "${alert.top_keyword}"` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={cfg.color}>{alert.alert_level}</Badge>
                      <span className="text-xs text-muted-foreground">{format(new Date(alert.created_at), "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardAlerts;
