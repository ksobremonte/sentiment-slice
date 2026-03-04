import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Activity, Loader2, Monitor, Smartphone, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface LoginEntry {
  id: string;
  logged_in_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const parseDevice = (ua: string | null): { icon: React.ElementType; label: string } => {
  if (!ua) return { icon: Globe, label: "Unknown device" };
  const lower = ua.toLowerCase();
  if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
    return { icon: Smartphone, label: "Mobile" };
  }
  return { icon: Monitor, label: "Desktop" };
};

const LoginActivityDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuthContext();
  const [entries, setEntries] = useState<LoginEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from("login_activity")
      .select("*")
      .eq("user_id", user.id)
      .order("logged_in_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setEntries((data as LoginEntry[]) || []);
        setLoading(false);
      });
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Login Activity
          </DialogTitle>
          <DialogDescription>Your recent sign-in sessions.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No login activity recorded yet.</p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, i) => {
              const device = parseDevice(entry.user_agent);
              const DeviceIcon = device.icon;
              const date = new Date(entry.logged_in_at);
              return (
                <div key={entry.id}>
                  {i > 0 && <Separator className="my-2" />}
                  <div className="flex items-center gap-3 py-1.5">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <DeviceIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{device.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {entry.ip_address || "IP not available"} · {entry.user_agent ? entry.user_agent.substring(0, 60) + "…" : "Unknown browser"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-medium text-foreground">{date.toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{date.toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginActivityDialog;
