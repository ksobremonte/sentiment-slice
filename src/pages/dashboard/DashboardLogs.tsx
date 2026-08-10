import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ScrollText, RefreshCw, Download, ChevronDown, ChevronRight,
  CheckCircle2, AlertTriangle, XCircle, Activity, Loader2,
  ChevronLeft, Clock, Users, Monitor, LogIn, LogOut, Eye,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useAuthContext } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

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

interface AccessLog {
  id: string;
  created_at: string;
  user_id: string;
  email: string | null;
  role: string | null;
  action: string;
  page: string | null;
  ip_address: string | null;
  user_agent: string | null;
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

const actionConfig: Record<string, { icon: typeof LogIn; badge: string }> = {
  login: { icon: LogIn, badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  logout: { icon: LogOut, badge: "bg-red-500/10 text-red-600 border-red-500/20" },
  page_view: { icon: Eye, badge: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
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

/* ─── System Logs Tab ─── */
const SystemLogsTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
const [timeRange, setTimeRange] = useState<TimeRange>("7d");
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
      if (rangeDate) query = query.gte("created_at", rangeDate.toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SystemLog[];
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // System logs are not streamed over Realtime (internal operational data);
  // the query above polls every 10s while auto-refresh is on.


  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== "all" && log.level !== levelFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return log.endpoint.toLowerCase().includes(s) || log.message.toLowerCase().includes(s) || log.method.toLowerCase().includes(s) || String(log.status_code).includes(s);
    });
  }, [logs, levelFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter((l) => new Date(l.created_at) >= todayStart);
    return {
      total: todayLogs.length,
      success: todayLogs.filter((l) => l.level === "success").length,
      errors: todayLogs.filter((l) => l.level === "error").length,
      warnings: todayLogs.filter((l) => l.level === "warning").length,
    };
  }, [logs]);

  const toggleRow = useCallback((id: string) => {
    setExpandedRows((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }, []);

  const downloadCSV = useCallback(() => {
    const header = "Timestamp,Method,Status,Endpoint,Level,Message\n";
    const rows = filtered.map((log) =>
      `"${format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}","${log.method}","${log.status_code}","${log.endpoint}","${log.level}","${log.message.replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `system-logs-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "API Calls Today", value: stats.total, icon: Activity, bg: "bg-blue-500/10", color: "text-blue-500" },
          { label: "Successful", value: stats.success, icon: CheckCircle2, bg: "bg-emerald-500/10", color: "text-emerald-500" },
          { label: "Warnings", value: stats.warnings, icon: AlertTriangle, bg: "bg-amber-500/10", color: "text-amber-500" },
          { label: "Errors", value: stats.errors, icon: XCircle, bg: "bg-red-500/10", color: "text-red-500" },
        ].map((s) => (
          <Card key={s.label} className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search logs..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs rounded-xl border-2" />
        <Select value={timeRange} onValueChange={(v) => { setTimeRange(v as TimeRange); setPage(1); }}>
          <SelectTrigger className="w-[150px] rounded-xl border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={(v) => { setLevelFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] rounded-xl border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
          <Clock className="h-3.5 w-3.5" /><span>Auto</span>
          <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl border-2"><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
        <Button variant="outline" size="sm" onClick={downloadCSV} className="rounded-xl border-2"><Download className="h-4 w-4 mr-1" />CSV</Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
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
                          <TableRow className={cn("cursor-pointer transition-colors", log.level === "error" && "bg-red-500/5 hover:bg-red-500/10", log.level === "warning" && "bg-amber-500/5 hover:bg-amber-500/10", log.level === "success" && "hover:bg-emerald-500/5")}>
                            <TableCell className="w-8 pr-0">{isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}</TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">{format(new Date(log.created_at), "MMM dd, HH:mm:ss")}</TableCell>
                            <TableCell><Badge variant="outline" className={cn("text-[10px] font-bold px-2", methodColors[log.method])}>{log.method}</Badge></TableCell>
                            <TableCell><span className={cn("text-xs font-mono font-bold", log.status_code >= 500 ? "text-red-500" : log.status_code >= 400 ? "text-amber-500" : log.status_code >= 200 && log.status_code < 300 ? "text-emerald-500" : "text-muted-foreground")}>{log.status_code}</span></TableCell>
                            <TableCell className="text-xs font-mono text-foreground max-w-[200px] truncate">{log.endpoint}</TableCell>
                            <TableCell><Badge variant="outline" className={cn("text-[10px] gap-1", config.badge)}><Icon className="h-3 w-3" />{log.level}</Badge></TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">{log.message}</TableCell>
                          </TableRow>
                        </CollapsibleTrigger>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={7} className="py-3">
                              <div className="space-y-2 pl-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                  <div><p className="text-muted-foreground font-medium">Full Timestamp</p><p className="text-foreground">{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss.SSS")}</p></div>
                                  <div><p className="text-muted-foreground font-medium">Method</p><p className="text-foreground">{log.method}</p></div>
                                  <div><p className="text-muted-foreground font-medium">Status Code</p><p className="text-foreground">{log.status_code}</p></div>
                                  <div><p className="text-muted-foreground font-medium">Log ID</p><p className="text-foreground font-mono">{log.id.slice(0, 12)}…</p></div>
                                </div>
                                <div><p className="text-muted-foreground font-medium text-xs">Endpoint</p><p className="text-foreground text-xs font-mono">{log.endpoint}</p></div>
                                <div><p className="text-muted-foreground font-medium text-xs">Message</p><p className="text-foreground text-sm">{log.message}</p></div>
                                {log.details && (
                                  <div><p className="text-muted-foreground font-medium text-xs">Details</p><pre className="text-xs bg-muted/50 p-2 rounded-lg overflow-auto max-h-40 font-mono text-foreground">{JSON.stringify(log.details, null, 2)}</pre></div>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl border-2"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-muted-foreground font-semibold">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-xl border-2"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
};

/* ─── Access Logs Tab ─── */
const AccessLogsTab = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["access-logs", timeRange],
    queryFn: async () => {
      let query = supabase
        .from("access_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      const rangeDate = getTimeRangeDate(timeRange);
      if (rangeDate) query = query.gte("created_at", rangeDate.toISOString());
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AccessLog[];
    },
    refetchInterval: autoRefresh ? 10000 : false,
  });

  // Access logs are not streamed over Realtime (they contain emails/IPs);
  // the query above polls every 10s while auto-refresh is on.


  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (!search) return true;
      const s = search.toLowerCase();
      return (log.email?.toLowerCase().includes(s) || log.action.toLowerCase().includes(s) || log.page?.toLowerCase().includes(s) || log.user_id.toLowerCase().includes(s));
    });
  }, [logs, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter((l) => new Date(l.created_at) >= todayStart);
    return {
      total: todayLogs.length,
      logins: todayLogs.filter((l) => l.action === "login").length,
      logouts: todayLogs.filter((l) => l.action === "logout").length,
      pageViews: todayLogs.filter((l) => l.action === "page_view").length,
    };
  }, [logs]);

  const downloadCSV = useCallback(() => {
    const header = "Timestamp,User ID,Email,Role,Action,Page,IP Address,User Agent\n";
    const rows = filtered.map((log) =>
      `"${format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}","${log.user_id}","${log.email || ""}","${log.role || ""}","${log.action}","${log.page || ""}","${log.ip_address || ""}","${(log.user_agent || "").replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `access-logs-${format(new Date(), "yyyy-MM-dd")}.csv`; a.click(); URL.revokeObjectURL(url);
  }, [filtered]);

  const parseUA = (ua: string | null) => {
    if (!ua) return "Unknown";
    if (ua.includes("Mobile")) return "Mobile";
    if (ua.includes("Tablet")) return "Tablet";
    return "Desktop";
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Activity", value: stats.total, icon: Users, bg: "bg-blue-500/10", color: "text-blue-500" },
          { label: "Logins Today", value: stats.logins, icon: LogIn, bg: "bg-emerald-500/10", color: "text-emerald-500" },
          { label: "Logouts Today", value: stats.logouts, icon: LogOut, bg: "bg-red-500/10", color: "text-red-500" },
          { label: "Page Views", value: stats.pageViews, icon: Eye, bg: "bg-blue-500/10", color: "text-blue-500" },
        ].map((s) => (
          <Card key={s.label} className="border-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", s.bg)}>
                <s.icon className={cn("h-5 w-5", s.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search by email, action, page..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-xs rounded-xl border-2" />
        <Select value={timeRange} onValueChange={(v) => { setTimeRange(v as TimeRange); setPage(1); }}>
          <SelectTrigger className="w-[150px] rounded-xl border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] rounded-xl border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="page_view">Page View</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
          <Clock className="h-3.5 w-3.5" /><span>Auto</span>
          <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl border-2"><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
        <Button variant="outline" size="sm" onClick={downloadCSV} className="rounded-xl border-2"><Download className="h-4 w-4 mr-1" />CSV</Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border-2 border-border">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground font-display text-lg">No access logs found</p>
          <p className="text-sm text-muted-foreground mt-1">User activity will appear here automatically</p>
        </div>
      ) : (
        <Card className="border-2 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Role</TableHead>
                  <TableHead className="text-xs font-semibold">Action</TableHead>
                  <TableHead className="text-xs font-semibold">Page</TableHead>
                  <TableHead className="text-xs font-semibold">Device</TableHead>
                  <TableHead className="text-xs font-semibold">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((log) => {
                  const ac = actionConfig[log.action] || actionConfig.page_view;
                  const AcIcon = ac.icon;
                  return (
                    <TableRow
                      key={log.id}
                      className={cn(
                        "transition-colors",
                        log.action === "login" && "bg-emerald-500/5 hover:bg-emerald-500/10",
                        log.action === "logout" && "bg-red-500/5 hover:bg-red-500/10",
                        log.action === "page_view" && "hover:bg-blue-500/5",
                      )}
                    >
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap font-mono">{format(new Date(log.created_at), "MMM dd, HH:mm:ss")}</TableCell>
                      <TableCell className="text-xs text-foreground max-w-[180px] truncate">{log.email || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">{log.role || "—"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] gap-1", ac.badge)}>
                          <AcIcon className="h-3 w-3" />
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-foreground max-w-[180px] truncate">{log.page || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          <Monitor className="h-3 w-3 mr-1" />
                          {parseUA(log.user_agent)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{log.ip_address || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl border-2"><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm text-muted-foreground font-semibold">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-xl border-2"><ChevronRight className="w-4 h-4" /></Button>
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─── */
const DashboardLogs = () => {
  const { user } = useAuthContext();
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["current-user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      return data?.role || null;
    },
    enabled: !!user,
  });

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (userRole !== "admin") {
    return <Navigate to="/pv-dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <ScrollText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Logs</h2>
            <p className="text-sm text-muted-foreground">Monitor system activity and user access in real-time</p>
          </div>
        </div>

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="system" className="gap-2">
              <Activity className="h-4 w-4" />
              System Logs
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <Users className="h-4 w-4" />
              Access Logs
            </TabsTrigger>
          </TabsList>
          <TabsContent value="system">
            <SystemLogsTab />
          </TabsContent>
          <TabsContent value="access">
            <AccessLogsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardLogs;
