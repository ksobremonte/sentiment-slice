import { useState, useCallback, useMemo } from "react";
import { Users, Loader2, Search, UserPlus, MoreHorizontal, Download, KeyRound, Eye, EyeOff } from "lucide-react";
import * as XLSX from "xlsx";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: "admin" | "moderator";
  created_at: string;
  email_confirmed: boolean;
  last_sign_in: string | null;
}

const DashboardUsers = () => {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("moderator");
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState("");
  const [resetUserName, setResetUserName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roleConfirmOpen, setRoleConfirmOpen] = useState(false);
  const [roleConfirmUser, setRoleConfirmUser] = useState<{ userId: string; name: string; newRole: string } | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeConfirmUser, setRemoveConfirmUser] = useState<{ userId: string; name: string } | null>(null);
  const perPage = 10;

  const getValidToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    // Check if token expires within 60 seconds, refresh if so
    const expiresAt = session.expires_at ?? 0;
    if (expiresAt - Math.floor(Date.now() / 1000) < 60) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      return refreshed.session?.access_token;
    }
    return session.access_token;
  };

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["dashboard-users"],
    queryFn: async () => {
      const token = await getValidToken();
      const res = await supabase.functions.invoke("list-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.error) throw res.error;
      return (res.data || []) as UserWithRole[];
    },
    retry: 1,
  });

  const filteredUsers = users.filter(
    (u) =>
      (u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (roleFilter === "all" || u.role === roleFilter)
  );

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
  const paginatedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  const handleAddUser = async () => {
    if (!newEmail.trim()) return;
    setIsAdding(true);
    try {
      const token = await getValidToken();
      const res = await supabase.functions.invoke("list-users?action=create", {
        headers: { Authorization: `Bearer ${token}` },
        body: { email: newEmail.trim() },
      });
      if (res.error) {
        // Extract the actual error message from the response context
        let msg = "Failed to invite user";
        try {
          const body = await res.error.context?.json?.();
          if (body?.error) msg = body.error;
        } catch {
          msg = res.error.message || msg;
        }
        throw new Error(msg);
      }
      if (res.data?.error) throw new Error(res.data.error);
      toast.success(res.data?.message || "Invitation sent! The user will receive an email to set their password.");
      setNewEmail("");
      setAddOpen(false);
      queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to invite user");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    try {
      const token = await getValidToken();
      const res = await supabase.functions.invoke("list-users?action=update-role", {
        headers: { Authorization: `Bearer ${token}` },
        body: { userId, role },
      });
      if (res.error) throw res.error;
      toast.success("Role updated");
      queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const token = await getValidToken();
      const res = await supabase.functions.invoke("list-users?action=remove", {
        headers: { Authorization: `Bearer ${token}` },
        body: { userId },
      });
      if (res.error) throw res.error;
      toast.success("User removed");
      queryClient.invalidateQueries({ queryKey: ["dashboard-users"] });
    } catch {
      toast.error("Failed to remove user");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsResetting(true);
    try {
      const token = await getValidToken();
      const res = await supabase.functions.invoke("list-users?action=reset-password", {
        headers: { Authorization: `Bearer ${token}` },
        body: { userId: resetUserId, newPassword },
      });
      const resData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
      if (resData?.error) throw new Error(resData.error);
      if (res.error) throw new Error(res.error.message || "Failed to reset password");
      toast.success("Password has been reset successfully");
      setNewPassword("");
      setResetOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground">User Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage the users who have access to the Pizza Volante dashboard.<br />
              Invite new staff, update roles, or remove access as needed.
            </p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>Invite New Staff Member</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    placeholder="staff@example.com"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  The user will be invited as <strong>Staff</strong> and will receive an email to set their password.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button onClick={handleAddUser} disabled={isAdding || !newEmail.trim()} className="rounded-xl">
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send Invitation
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table Card */}
        <Card className="rounded-2xl border-2 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">{filteredUsers.length} users</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-9 w-[220px] rounded-xl h-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] rounded-xl h-9">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Staff</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2"
                disabled={filteredUsers.length === 0}
                onClick={() => {
                  const data = filteredUsers.map((u) => ({
                    Name: u.display_name,
                    Email: u.email,
                    Role: u.role === "admin" ? "Admin" : "Staff",
                    Status: u.email_confirmed ? "Verified" : "Pending",
                  }));
                  const ws = XLSX.utils.json_to_sheet(data);
                  ws["!cols"] = [{ wch: 25 }, { wch: 35 }, { wch: 10 }, { wch: 12 }];
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Users");
                  XLSX.writeFile(wb, `users-${new Date().toISOString().slice(0, 10)}.xlsx`);
                  toast.success("Users exported successfully");
                }}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-display text-lg">
                {searchQuery ? "No users match your search" : "No users found"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try a different search term" : "Invite your first team member to get started"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[280px]">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">
                            {getInitials(user.display_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{user.display_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                        className="rounded-md font-medium"
                      >
                        {user.role === "admin" ? "Admin" : "Staff"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${user.email_confirmed ? "bg-green-500" : "bg-yellow-500"}`} />
                        <span className="text-sm text-muted-foreground">
                          {user.email_confirmed ? "Verified" : "Pending"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem
                            onClick={() => {
                              const newRole = user.role === "admin" ? "moderator" : "admin";
                              if (newRole === "admin") {
                                setRoleConfirmUser({ userId: user.user_id, name: user.display_name, newRole });
                                setRoleConfirmOpen(true);
                              } else {
                                handleUpdateRole(user.user_id, newRole);
                              }
                            }}
                          >
                            Change to {user.role === "admin" ? "Staff" : "Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setResetUserId(user.user_id);
                              setResetUserName(user.display_name);
                              setNewPassword("");
                              setResetOpen(true);
                            }}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setRemoveConfirmUser({ userId: user.user_id, name: user.display_name });
                              setRemoveConfirmOpen(true);
                            }}
                          >
                            Remove Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">
                {filteredUsers.length} users
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {(page - 1) * perPage + 1}-{Math.min(page * perPage, filteredUsers.length)} of {filteredUsers.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1 text-sm">
                  <span className="px-2 py-1 bg-muted rounded-md font-medium">{page}</span>
                  <span className="text-muted-foreground">/ {totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={resetOpen} onOpenChange={setResetOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Reset Password for {resetUserName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>New Password</Label>
                <div className="relative">
                  <Input
                    placeholder="Enter new password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-xl pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Set a new password for this user. They can use it to sign in immediately.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={isResetting || newPassword.length < 6} className="rounded-xl">
                {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Switch to Admin Confirmation */}
      <AlertDialog open={roleConfirmOpen} onOpenChange={setRoleConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch to Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to switch <strong>{roleConfirmUser?.name}</strong> to Admin mode? Admins have full access to manage the dashboard, users, and settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roleConfirmUser) {
                  handleUpdateRole(roleConfirmUser.userId, roleConfirmUser.newRole);
                }
                setRoleConfirmOpen(false);
              }}
            >
              Switch to Admin
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Access Confirmation */}
      <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Access?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{removeConfirmUser?.name}</strong>'s access? They will no longer be able to sign in to the dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeConfirmUser) {
                  handleRemoveUser(removeConfirmUser.userId);
                }
                setRemoveConfirmOpen(false);
              }}
            >
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default DashboardUsers;
