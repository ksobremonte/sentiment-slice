import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldCheck, QrCode } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEnrolled: boolean;
  onComplete: () => void;
}

const TwoFactorDialog = ({ open, onOpenChange, isEnrolled, onComplete }: Props) => {
  const [step, setStep] = useState<"intro" | "qr" | "verify" | "unenroll">(isEnrolled ? "unenroll" : "intro");
  const [qrUri, setQrUri] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setStep(isEnrolled ? "unenroll" : "intro");
    setQrUri("");
    setFactorId("");
    setVerifyCode("");
  };

  const handleEnroll = async () => {
    setLoading(true);
    try {
      console.log("[2FA] Starting enrollment...");
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator App",
      });
      console.log("[2FA] Enroll response:", JSON.stringify({ data, error }));
      if (error) throw error;
      if (!data?.totp?.qr_code) {
        throw new Error("No QR code received from server. MFA may not be enabled.");
      }
      setQrUri(data.totp.qr_code);
      setFactorId(data.id);
      setStep("qr");
    } catch (err: any) {
      console.error("[2FA] Enrollment error:", err);
      toast.error(err?.message || "Failed to start 2FA enrollment.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      toast.error("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      toast.success("Two-factor authentication enabled successfully.");
      onComplete();
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast.error(err?.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async () => {
    setLoading(true);
    try {
      // Get enrolled factors
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;

      const totpFactor = factorsData.totp?.[0];
      if (!totpFactor) throw new Error("No TOTP factor found.");

      const { error } = await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });
      if (error) throw error;

      toast.success("Two-factor authentication disabled.");
      onComplete();
      onOpenChange(false);
      reset();
    } catch (err: any) {
      toast.error(err?.message || "Failed to disable 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {isEnrolled ? "Manage your 2FA settings." : "Add an extra layer of security to your account."}
          </DialogDescription>
        </DialogHeader>

        {step === "intro" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You'll need an authenticator app (e.g. Google Authenticator, Authy) to scan a QR code and generate verification codes.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleEnroll} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <QrCode className="h-4 w-4 mr-1" />}
                Set Up 2FA
              </Button>
            </div>
          </div>
        )}

        {step === "qr" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Scan this QR code with your authenticator app, then enter the 6-digit code below.</p>
            <div className="flex justify-center p-4 bg-muted/30 rounded-xl">
              <img src={qrUri} alt="2FA QR Code" className="w-48 h-48" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totp-code">Verification Code</Label>
              <Input
                id="totp-code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setStep("intro"); setVerifyCode(""); }}>Back</Button>
              <Button onClick={handleVerify} disabled={loading || verifyCode.length < 6}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Verify & Enable
              </Button>
            </div>
          </div>
        )}

        {step === "unenroll" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication is currently <span className="font-semibold text-foreground">enabled</span>. Disabling it will remove the extra security layer from your account.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleUnenroll} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Disable 2FA
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TwoFactorDialog;
