import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeftRight, Plus, Trash2, LogIn, CheckCircle2,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SavedAccount {
  email: string;
  lastActive: string;
}

const STORAGE_KEY = "pv_saved_accounts";

const getSavedAccounts = (): SavedAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveSavedAccounts = (accounts: SavedAccount[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

const DashboardSwitchAccount = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);

  // Ensure current user is in saved accounts list
  useEffect(() => {
    if (!user?.email) return;
    const existing = getSavedAccounts();
    const found = existing.find((a) => a.email === user.email);
    if (!found) {
      const updated = [
        { email: user.email, lastActive: new Date().toISOString() },
        ...existing,
      ];
      saveSavedAccounts(updated);
      setAccounts(updated);
    } else {
      // Update lastActive
      const updated = existing.map((a) =>
        a.email === user.email ? { ...a, lastActive: new Date().toISOString() } : a
      );
      saveSavedAccounts(updated);
      setAccounts(updated);
    }
  }, [user?.email]);

  const handleSwitchTo = async (email: string) => {
    if (email === user?.email) {
      toast.info("You're already signed in to this account.");
      return;
    }
    await signOut();
    toast.success(`Signed out. Please log in as ${email}.`);
    navigate("/pv-admin");
  };

  const handleAddAccount = async () => {
    await signOut();
    toast.success("Signed out. Log in with a different account.");
    navigate("/pv-admin");
  };

  const handleRemoveAccount = (email: string) => {
    if (email === user?.email) {
      toast.error("You can't remove the account you're currently signed into.");
      return;
    }
    const updated = accounts.filter((a) => a.email !== email);
    saveSavedAccounts(updated);
    setAccounts(updated);
    toast.success(`Removed ${email} from saved accounts.`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Switch Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and switch between your saved accounts on this device.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Saved Accounts
            </CardTitle>
            <CardDescription>
              Tap an account to switch to it. Your current session will be signed out first.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No saved accounts found.
              </p>
            ) : (
              accounts.map((account, i) => {
                const isCurrent = account.email === user?.email;
                return (
                  <div key={account.email}>
                    {i > 0 && <Separator className="my-1" />}
                    <div
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isCurrent
                          ? "bg-primary/5 border border-primary/20"
                          : "hover:bg-accent/50 cursor-pointer"
                      }`}
                      onClick={() => !isCurrent && handleSwitchTo(account.email)}
                      role={isCurrent ? undefined : "button"}
                      tabIndex={isCurrent ? undefined : 0}
                      onKeyDown={(e) => {
                        if (!isCurrent && (e.key === "Enter" || e.key === " ")) {
                          handleSwitchTo(account.email);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {account.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {account.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isCurrent ? (
                              <span className="flex items-center gap-1 text-primary font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                Currently active
                              </span>
                            ) : (
                              `Last active: ${new Date(account.lastActive).toLocaleDateString()}`
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isCurrent && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSwitchTo(account.email);
                              }}
                            >
                              <LogIn className="h-3.5 w-3.5" />
                              Switch
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove account?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove <strong>{account.email}</strong> from your saved accounts on this device. You can always add it back later.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRemoveAccount(account.email)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Button onClick={() => navigate("/pv-dashboard/add-account")} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Another Account
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default DashboardSwitchAccount;
