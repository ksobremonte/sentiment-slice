import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText, Download, Trash2, FolderOpen, Plus, Star, Users as UsersIcon,
  ScrollText, Download as DownloadIcon, TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { format, subDays } from "date-fns";

type ReportType = "sales" | "reviews" | "users" | "logs" | "sentiment" | "exports";

const REPORT_TYPE_LABEL: Record<ReportType, string> = {
  sales: "Sales Report",
  reviews: "Reviews Report",
  users: "Users Report",
  logs: "Logs Report",
  sentiment: "Sentiment Analysis Report",
  exports: "Exports Report",
};

const formatSize = (bytes: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const StatCard = ({
  icon: Icon, label, value, delta,
}: { icon: any; label: string; value: string | number; delta: string }) => (
  <Card>
    <CardContent className="p-5 flex items-center gap-4">
      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[11px] text-primary mt-0.5">{delta}</p>
      </div>
    </CardContent>
  </Card>
);

const DashboardReports = () => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportFormat, setReportFormat] = useState<"PDF" | "CSV" | "XLSX">("PDF");

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["reports-stats"],
    queryFn: async () => {
      const [reviews, users, reports] = await Promise.all([
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("report_history").select("*", { count: "exact", head: true }),
      ]);
      const exports = await supabase
        .from("report_history")
        .select("*", { count: "exact", head: true })
        .in("format", ["CSV", "XLSX"]);
      return {
        totalReviews: reviews.count || 0,
        totalUsers: users.count || 0,
        reportsGenerated: reports.count || 0,
        exports: exports.count || 0,
      };
    },
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["report-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: recentReviews = [] } = useQuery({
    queryKey: ["reports-recent-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, name, rating, feedback, sentiment, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const generateReport = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Count rows for the selected type/range
      let rowCount = 0;
      const fromIso = new Date(dateFrom).toISOString();
      const toIso = new Date(`${dateTo}T23:59:59`).toISOString();

      if (reportType === "reviews" || reportType === "sales" || reportType === "sentiment") {
        const { count } = await supabase
          .from("reviews").select("*", { count: "exact", head: true })
          .gte("created_at", fromIso).lte("created_at", toIso);
        rowCount = count || 0;
      } else if (reportType === "users") {
        const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
        rowCount = count || 0;
      } else if (reportType === "logs") {
        const { count } = await supabase
          .from("system_logs").select("*", { count: "exact", head: true })
          .gte("created_at", fromIso).lte("created_at", toIso);
        rowCount = count || 0;
      }

      const sizeEstimate = Math.max(rowCount * 320 + 15000, 25000);
      const name = `${REPORT_TYPE_LABEL[reportType]} ${dateFrom} to ${dateTo}`;

      const { error } = await supabase.from("report_history").insert({
        report_name: name,
        report_type: reportType,
        format: reportFormat,
        size_bytes: sizeEstimate,
        date_from: dateFrom,
        date_to: dateTo,
        row_count: rowCount,
        created_by: user.id,
        notes: `${rowCount} records included`,
      });
      if (error) throw error;
      return name;
    },
    onSuccess: (name) => {
      toast.success(`Report "${name}" generated`);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["report-history"] });
      queryClient.invalidateQueries({ queryKey: ["reports-stats"] });
    },
    onError: () => toast.error("Failed to generate report"),
  });

  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { data: r } = await supabase.from("report_history").select("*").eq("id", id).single();
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (r) {
        await supabase.from("archived_records").insert({
          source_table: "report_history",
          record_id: id,
          record_data: r as any,
          deleted_by: userId,
        });
      }
      const { error } = await supabase.from("report_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report archived");
      queryClient.invalidateQueries({ queryKey: ["report-history"] });
      queryClient.invalidateQueries({ queryKey: ["reports-stats"] });
    },
    onError: () => toast.error("Failed to delete report"),
  });

  const downloadReport = async (r: any) => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(153, 27, 27); // brick red
      doc.rect(0, 0, pageWidth, 28, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Pizza Volante — Baguio City", 14, 12);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(r.report_name, 14, 21);

      // Meta
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      let y = 38;
      const meta: [string, string][] = [
        ["Type", r.report_type],
        ["Format", r.format],
        ["Range", `${r.date_from || "—"} to ${r.date_to || "—"}`],
        ["Records", String(r.row_count ?? 0)],
        ["Generated", format(new Date(r.created_at), "MMM d, yyyy HH:mm")],
      ];
      meta.forEach(([k, v]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${k}:`, 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(v, 45, y);
        y += 6;
      });

      // Fetch data based on type
      const fromIso = r.date_from ? new Date(r.date_from).toISOString() : null;
      const toIso = r.date_to ? new Date(`${r.date_to}T23:59:59`).toISOString() : null;
      let head: string[][] = [];
      let body: any[][] = [];

      if (["sales", "reviews", "sentiment"].includes(r.report_type)) {
        let q = supabase.from("reviews")
          .select("name, rating, sentiment, feedback, created_at")
          .order("created_at", { ascending: false })
          .limit(500);
        if (fromIso) q = q.gte("created_at", fromIso);
        if (toIso) q = q.lte("created_at", toIso);
        const { data } = await q;
        head = [["#", "Customer", "Rating", "Sentiment", "Review", "Date"]];
        body = (data || []).map((row: any, i: number) => [
          i + 1, row.name || "—", row.rating ?? "—",
          row.sentiment || "—",
          (row.feedback || "").slice(0, 80),
          format(new Date(row.created_at), "MMM d, yyyy"),
        ]);
      } else if (r.report_type === "users") {
        const { data } = await supabase.from("profiles")
          .select("display_name, language, created_at").limit(500);
        head = [["#", "Display Name", "Language", "Joined"]];
        body = (data || []).map((row: any, i: number) => [
          i + 1, row.display_name || "—", row.language || "—",
          row.created_at ? format(new Date(row.created_at), "MMM d, yyyy") : "—",
        ]);
      } else if (r.report_type === "logs") {
        let q = supabase.from("system_logs")
          .select("level, endpoint, method, status_code, message, created_at")
          .order("created_at", { ascending: false }).limit(500);
        if (fromIso) q = q.gte("created_at", fromIso);
        if (toIso) q = q.lte("created_at", toIso);
        const { data } = await q;
        head = [["#", "Level", "Endpoint", "Method", "Status", "Date"]];
        body = (data || []).map((row: any, i: number) => [
          i + 1, row.level, row.endpoint, row.method, row.status_code,
          format(new Date(row.created_at), "MMM d, yyyy HH:mm"),
        ]);
      } else {
        const { data } = await supabase.from("report_history")
          .select("report_name, report_type, format, row_count, created_at")
          .order("created_at", { ascending: false }).limit(200);
        head = [["#", "Name", "Type", "Format", "Records", "Date"]];
        body = (data || []).map((row: any, i: number) => [
          i + 1, row.report_name, row.report_type, row.format, row.row_count ?? 0,
          format(new Date(row.created_at), "MMM d, yyyy"),
        ]);
      }

      autoTable(doc, {
        head, body, startY: y + 4,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [153, 27, 27], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 240, 238] },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(
          `Pizza Volante · ${format(new Date(), "yyyy-MM-dd")} · Page ${i} of ${pageCount}`,
          pageWidth / 2, doc.internal.pageSize.getHeight() - 8,
          { align: "center" }
        );
      }

      doc.save(`${r.report_name.replace(/\s+/g, "_")}.pdf`);
      toast.success("Report downloaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };


  const recentFive = useMemo(() => reports.slice(0, 5), [reports]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">Generate and manage your data reports</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Star} label="Total Reviews" value={stats?.totalReviews ?? 0} delta="Live data" />
          <StatCard icon={UsersIcon} label="Total Users" value={stats?.totalUsers ?? 0} delta="Live data" />
          <StatCard icon={FileText} label="Reports Generated" value={stats?.reportsGenerated ?? 0} delta="All time" />
          <StatCard icon={DownloadIcon} label="Exports" value={stats?.exports ?? 0} delta="CSV / XLSX" />
        </div>

        {/* Report Generation + Recent Reports */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Generation</CardTitle>
              <CardDescription>Generate and export detailed reports from your data.</CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Generate New Report
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate New Report</DialogTitle>
                    <DialogDescription>Configure the report parameters below.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Report Type</Label>
                      <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(REPORT_TYPE_LABEL).map(([k, v]) => (
                            <SelectItem key={k} value={k}>{v}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>From</Label>
                        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>To</Label>
                        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select value={reportFormat} onValueChange={(v) => setReportFormat(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PDF">PDF</SelectItem>
                          <SelectItem value="CSV">CSV</SelectItem>
                          <SelectItem value="XLSX">Excel (XLSX)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={() => generateReport.mutate()} disabled={generateReport.isPending}>
                      {generateReport.isPending ? "Generating…" : "Generate"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Recent Reports</CardTitle>
                <CardDescription>{reports.length} total report{reports.length !== 1 ? "s" : ""}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-6 text-sm text-muted-foreground">Loading…</div>
              ) : recentFive.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No reports yet.</div>
              ) : (
                <ul className="divide-y divide-border">
                  {recentFive.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 py-3">
                      <div className="h-9 w-9 rounded bg-destructive/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.report_name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {r.format} · {formatSize(r.size_bytes)} · {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadReport(r)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete report?</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{r.report_name}" will be moved to the archive.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteReport.mutate(r.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <Tabs defaultValue="reviews">
              <TabsList>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
                <TabsTrigger value="exports">Exports</TabsTrigger>
              </TabsList>

              <TabsContent value="reviews" className="mt-4">
                <div className="mb-3">
                  <h3 className="text-base font-semibold">Recent Reviews</h3>
                  <p className="text-xs text-muted-foreground">Here are the latest customer reviews.</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Sentiment</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentReviews.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No reviews yet.</TableCell></TableRow>
                      ) : recentReviews.map((rv: any, i: number) => (
                        <TableRow key={rv.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{rv.name}</TableCell>
                          <TableCell>
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, idx) => (
                                <Star key={idx} className={`h-3.5 w-3.5 ${idx < (rv.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`} />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[280px] truncate text-xs">{rv.feedback}</TableCell>
                          <TableCell>
                            <Badge variant={rv.sentiment === "positive" ? "default" : rv.sentiment === "negative" ? "destructive" : "secondary"} className="capitalize text-[10px]">
                              {rv.sentiment || "—"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(rv.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="exports" className="mt-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold">All Reports</h3>
                    <p className="text-xs text-muted-foreground">Full history of generated reports.</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.length === 0 ? (
                        <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No reports yet.</TableCell></TableRow>
                      ) : reports.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium max-w-[260px] truncate">{r.report_name}</TableCell>
                          <TableCell><Badge variant="outline" className="capitalize">{r.report_type}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{r.format}</Badge></TableCell>
                          <TableCell className="text-xs">{formatSize(r.size_bytes)}</TableCell>
                          <TableCell className="text-xs">{r.row_count ?? 0}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy HH:mm")}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => downloadReport(r)}>
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete report?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      "{r.report_name}" will be moved to the archive.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteReport.mutate(r.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardReports;
