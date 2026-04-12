import { useState } from "react";
import { Fingerprint, Plus, Trash2, Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePasskey } from "@/hooks/usePasskey";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const PasskeySettings = () => {
  const { user } = useAuthContext();
  const { supported, passkeys, loading, registerPasskey, deletePasskey } = usePasskey(user?.id);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleRegister = async () => {
    setRegistering(true);
    const result = await registerPasskey(deviceName || "Security Key");
    setRegistering(false);

    if (result.success) {
      toast.success("Passkey registered successfully!");
      setRegisterOpen(false);
      setDeviceName("");
    } else if (result.error === "cancelled") {
      // User cancelled, do nothing
    } else {
      toast.error(result.error || "Failed to register passkey");
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await deletePasskey(id);
    if (error) {
      toast.error("Failed to remove passkey");
    } else {
      toast.success("Passkey removed");
      setDeleteId(null);
    }
  };

  if (!supported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-primary" />
            Passkey / Security Key
          </CardTitle>
          <CardDescription>
            Your browser does not support passkeys (WebAuthn).
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-primary" />
            Passkey / Security Key
          </CardTitle>
          <CardDescription>
            Use fingerprint, Face ID, or a security key for faster, more secure sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passkeys.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No passkeys registered yet</p>
              <p className="text-xs mt-1">Add a passkey to skip email verification codes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{pk.device_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {format(new Date(pk.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteId(pk.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Separator />

          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => setRegisterOpen(true)}
            disabled={loading}
          >
            <Plus className="h-4 w-4" />
            Add Passkey
          </Button>
        </CardContent>
      </Card>

      {/* Register Dialog */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              Register New Passkey
            </DialogTitle>
            <DialogDescription>
              Give your passkey a name to identify it later, then follow your browser's prompts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="deviceName">Device Name</Label>
              <Input
                id="deviceName"
                placeholder="e.g. MacBook Fingerprint, YubiKey"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
              />
            </div>
            {registering && (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground animate-pulse">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Waiting for your authenticator...</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)} disabled={registering}>
              Cancel
            </Button>
            <Button onClick={handleRegister} disabled={registering} className="gap-2">
              {registering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4" />
                  Register
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Passkey?</DialogTitle>
            <DialogDescription>
              This passkey will no longer work for signing in. You can always add a new one.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleDelete(deleteId)}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PasskeySettings;
