import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Archive, RotateCcw, Trash2, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { useRestoreRecord, usePermanentDelete } from "@/hooks/useArchive";

const SOURCE_TABLE_LABELS: Record<string, string> = {
  reviews: "Reviews",
  chat_conversations: "Conversations",
  chat_messages: "Messages",
  alert_history: "Alert History",
  backup_history: "Backup History",
  system_logs: "System Logs",
  access_logs: "Access Logs",
  profiles: "Profiles",
  notification_reads: "Notifications",
  review_reactions: "Reactions",
  review_audit_log: "Audit Log",
  blocked_sessions: "Blocked Sessions",
};

const tableBadgeColor = (table: string) => {
  const map: Record<string, string> = {
    reviews: "bg-primary/20 text-primary",
    chat_conversations: "bg-blue-500/20 text-blue-400",
    chat_messages: "bg-blue-500/20 text-blue-400",
    alert_history: "bg-yellow-500/20 text-yellow-400",
    system_logs: "bg-muted text-muted-foreground",
    access_logs: "bg-muted text-muted-foreground",
  };
  return map[table] || "bg-accent/20 text-accent-foreground";
};

const getRecordPreview = (data: Record<string, unknown>, table: string): string => {
  if (table === "reviews") return (data.name as string || "") + ": " + ((data.feedback as string)?.slice(0, 60) || "");
  if (table === "chat_messages") return ((data.content as string)?.slice(0, 80) || "");
  if (table === "chat_conversations") return "Session: " + (data.session_id as string || "");
  if (table === "alert_history") return (data.message as string)?.slice(0, 80) || "";
  if (table === "system_logs") return (data.message as string)?.slice(0, 80) || "";
  if (table === "profiles") return (data.display_name as string || "User profile");
  return JSON.stringify(data).slice(0, 80);
};

const DashboardArchiveContent = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const restoreMutation = useRestoreRecord();
  const permanentDeleteMutation = usePermanentDelete();

  const { data: archivedRecords = [], isLoading } = useQuery({
    queryKey: ["archived-records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("archived_records")
        .select("*")
        .order("deleted_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = archivedRecords.filter((r) => {
    if (tableFilter !== "all" && r.source_table !== tableFilter) return false;
    if (search) {
      const preview = getRecordPreview(r.record_data as Record<string, unknown>, r.source_table).toLowerCase();
      return preview.includes(search.toLowerCase()) || r.source_table.includes(search.toLowerCase());
    }
    return true;
  });

  const uniqueTables = [...new Set(archivedRecords.map((r) => r.source_table))];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Archive className="h-6 w-6 text-primary" />
          {t("archive.title")}
        </h2>
        <p className="text-muted-foreground mt-1">{t("archive.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{archivedRecords.length}</p>
            <p className="text-xs text-muted-foreground">{t("archive.totalArchived")}</p>
          </CardContent>
        </Card>
        {uniqueTables.slice(0, 3).map((table) => (
          <Card key={table}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {archivedRecords.filter((r) => r.source_table === table).length}
              </p>
              <p className="text-xs text-muted-foreground">{SOURCE_TABLE_LABELS[table] || table}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("archive.archivedRecords")}</CardTitle>
          <CardDescription>{t("archive.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("archive.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("archive.allTables")}</SelectItem>
                {uniqueTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {SOURCE_TABLE_LABELS[table] || table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-10 text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <Archive className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">{t("archive.empty")}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("archive.source")}</TableHead>
                    <TableHead>{t("archive.preview")}</TableHead>
                    <TableHead>{t("archive.deletedAt")}</TableHead>
                    <TableHead className="text-right">{t("archive.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge variant="outline" className={tableBadgeColor(record.source_table)}>
                          {SOURCE_TABLE_LABELS[record.source_table] || record.source_table}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                        {getRecordPreview(record.record_data as Record<string, unknown>, record.source_table)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(record.deleted_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* Restore */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-1">
                                <RotateCcw className="h-3.5 w-3.5" />
                                {t("archive.restore")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("archive.confirmRestore")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("archive.restoreDescription")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("archive.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => restoreMutation.mutate(record.id)}
                                >
                                  {t("archive.restore")}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          {/* Permanent delete */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="gap-1">
                                <Trash2 className="h-3.5 w-3.5" />
                                {t("archive.permanentDelete")}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>{t("archive.confirmDelete")}</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t("archive.deleteDescription")}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t("archive.cancel")}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => permanentDeleteMutation.mutate(record.id)}
                                >
                                  {t("archive.permanentDelete")}
                                </AlertDialogAction>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const DashboardArchive = () => (
  <DashboardLayout>
    <DashboardArchiveContent />
  </DashboardLayout>
);

export default DashboardArchive;
