import { useState } from "react";
import { Users, Loader2, Shield, UserPlus } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const DashboardUsers = () => {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("moderator");
  const [isAdding, setIsAdding] = useState(false);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleRemoveRole = async (roleId: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) {
      toast.error("Failed to remove role");
    } else {
      toast.success("Role removed");
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-foreground">User Management</h2>
              <p className="text-sm text-muted-foreground">Manage admin and moderator roles</p>
            </div>
          </div>
        </div>

        <Card className="p-5 rounded-2xl border-2 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            <Shield className="w-4 h-4 inline mr-1" />
            <strong className="text-foreground">Admins</strong> can manage users, view audit logs, and access all features.{" "}
            <strong className="text-foreground">Moderators</strong> can view reviews and conversations.
          </p>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : roles.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border-2 border-border">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-display text-lg">No roles assigned yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Assign your first admin role to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role) => (
              <Card key={role.id} className="p-4 rounded-2xl border-2">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                      <Users className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-mono text-muted-foreground">{role.user_id.slice(0, 8)}…</p>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDistanceToNow(new Date(role.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={role.role === "admin" ? "default" : "secondary"}>
                      {role.role}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRole(role.id)}
                      className="text-destructive hover:text-destructive rounded-xl"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardUsers;
