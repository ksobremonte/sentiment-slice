import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollText, RefreshCw, Download, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Activity, Loader2,
  ChevronLeft, Clock,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const ITEMS_PER_PAGE = 20;

type LogLevel = "success" | "warning" | "error" | "info";
type TimeRange = "1h" | "24h" | "7d" | "all";

interface SystemLog {
  id: string;
  created_at: string;
  method: string;
  status_code: number;
  endpoint: string;
  message: string;
  details: Record<string, unknown> | null;
  level: LogLevel;
}

const levelConfig: Record<LogLevel, { icon: typeof CheckCircle2; color: string; badge: string }> = {
  success: { icon: CheckCircle2, color: "text-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-500", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  error: { icon: XCircle, color: "text-red-500", badge: "bg-red-500/10 text-red-600 border-red-500/20" },
  info: { icon: Activity, color: "text-blue-500", badge: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  POST: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  PUT: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-600 border-red-500/20",
  PATCH: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

const getTimeRangeDate = (range: TimeRange): Date | null => {
  const now = new Date();
  switch (range) {
    case "1h": return new Date(now.getTime() - 60 * 60 * 1000);
    case "24h": return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case "7d": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    default: return null;
  }
};

const DashboardLogs = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["system-logs", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      const rangeDate = getTimeRangeDate(timeRange);
      if (rangeDate) {
        query = query.gte("created_at", rangeDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SystemLog[];
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("system-logs-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "system_logs" }, () => {
        queryClient.invalidateQueries({ queryKey: ["system-logs"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== "all" && log.level !== levelFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        log.endpoint.toLowerCase().includes(s) ||
        log.message.toLowerCase().includes(s) ||
        log.method.toLowerCase().includes(s) ||
        String(log.status_code).includes(s)
      );
    });
  }, [logs, levelFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Summary stats
  const stats = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter((l) => new Date(l.created_at) >= todayStart);
    return {
      total: todayLogs.length,
      success: todayLogs.filter((l) => l.level === "success").length,
      errors: todayLogs.filter((l) => l.level === "error").length,
      warnings: todayLogs.filter((l) => l.level === "warning").length,
    };
  }, [logs]);

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const downloadCSV = useCallback(() => {
    const header = "Timestamp,Method,Status,Endpoint,Level,Message\n";
    const rows = filtered.map((log) =>
      `"${format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}","${log.method}","${log.status_code}","${log.endpoint}","${log.level}","${log.message.replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ScrollText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">System Logs</h2>
              <p className="text-sm text-muted-foreground">Monitor all system activity in real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Auto-refresh</span>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl border-2">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={downloadCSV} className="rounded-xl border-2">
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">API Calls Today</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.success}</p>
                <p className="text-xs text-muted-foreground">Successful</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.warnings}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.errors}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-xs rounded-xl border-2"
          />
          <Select value={timeRange} onValueChange={(v) => { setTimeRange(v as TimeRange); setPage(1); }}>
            <SelectTrigger className="w-[150px] rounded-xl border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[140px] rounded-xl border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground self-center ml-auto">
            {filtered.length} log{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-border">
            <ScrollText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-display text-lg">No logs found</p>
            <p className="text-sm text-muted-foreground mt-1">Adjust your filters or check back later</p>
          </div>
        ) : (
          <Card className="border-2 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-8" />
                    <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                    <TableHead className="text-xs font-semibold">Method</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Endpoint</TableHead>
                    <TableHead className="text-xs font-semibold">Level</TableHead>
                    <TableHead className="text-xs font-semibold">Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((log) => {
                    const config = levelConfig[log.level] || levelConfig.info;
                    const Icon = config.icon;
                    const isExpanded = expandedRows.has(log.id);
                    return (
                      <Collapsible key={log.id} asChild open={isExpanded} onOpenChange={() => toggleRow(log.id)}>
                        <>
                          <CollapsibleTrigger asChild>
                            <TableRow
                              className={cn(
                                "cursor-pointer transition-colors",
                                log.level === "error" && "bg-red-500/5 hover:bg-red-500/10",
                                log.level === "warning" && "bg-amber-500/5 hover:bg-amber-500/10",
                                log.level === "success" && "hover:bg-emerald-500/5",
                              )}
                            >
                              <TableCell className="w-8 pr-0">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">
                                {format(new Date(log.created_at), "MMM dd, HH:mm:ss")}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px] font-bold px-2", methodColors[log.method])}>
                                  {log.method}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className={cn(
                                  "text-xs font-mono font-bold",
                                  log.status_code >= 500 ? "text-red-500" :
                                  log.status_code >= 400 ? "text-amber-500" :
                                  log.status_code >= 200 && log.status_code < 300 ? "text-emerald-500" : "text-muted-foreground"
                                )}>
                                  {log.status_code}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs font-mono text-foreground max-w-[200px] truncate">
                                {log.endpoint}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px] gap-1", config.badge)}>
                                  <Icon className="h-3 w-3" />
                                  {log.level}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                                {log.message}
                              </TableCell>
                            </TableRow>
                          </CollapsibleTrigger>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/20">
                              <TableCell colSpan={7} className="py-3">
                                <div className="space-y-2 pl-8">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div>
                                      <p className="text-muted-foreground font-medium">Full Timestamp</p>
                                      <p className="text-foreground">{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss.SSS")}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground font-medium">Method</p>
                                      <p className="text-foreground">{log.method}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground font-medium">Status Code</p>
                                      <p className="text-foreground">{log.status_code}</p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground font-medium">Log ID</p>
                                      <p className="text-foreground font-mono">{log.id.slice(0, 12)}…</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-medium text-xs">Endpoint</p>
                                    <p className="text-foreground text-xs font-mono">{log.endpoint}</p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground font-medium text-xs">Message</p>
                                    <p className="text-foreground text-sm">{log.message}</p>
                                  </div>
                                  {log.details && (
                                    <div>
                                      <p className="text-muted-foreground font-medium text-xs">Details</p>
                                      <pre className="text-xs bg-muted/50 p-2 rounded-lg overflow-auto max-h-40 font-mono text-foreground">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-xl border-2"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground font-semibold">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-xl border-2"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardLogs;
