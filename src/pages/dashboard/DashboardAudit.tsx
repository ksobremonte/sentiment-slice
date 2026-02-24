import { useState } from "react";
import { History, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const ITEMS_PER_PAGE = 15;

const actionLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  delete: { label: "Deleted", variant: "destructive" },
  edit: { label: "Edited", variant: "secondary" },
  admin_response: { label: "Responded", variant: "default" },
  sentiment_update: { label: "Analyzed", variant: "outline" },
};

const DashboardAudit = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("review_audit_log")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = logs.filter((log) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      log.reason?.toLowerCase().includes(s) ||
      log.review_id.toLowerCase().includes(s)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">Audit Log</h2>
            <p className="text-sm text-muted-foreground">Full trail of all review changes</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, reason, or review ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-11 rounded-xl border-2"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-border">
            <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-display text-lg">No audit entries yet</p>
            <p className="text-sm text-muted-foreground mt-1">Actions on reviews will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginated.map((log) => {
              const actionInfo = actionLabels[log.action] || { label: log.action, variant: "outline" as const };
              return (
                <div key={log.id} className="bg-card border-2 border-border rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.review_id.slice(0, 8)}…
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-sm text-foreground">{log.reason}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl border-2">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground font-semibold">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-xl border-2">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardAudit;
