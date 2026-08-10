import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pizza, Lock, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters");

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for the PASSWORD_RECOVERY event which fires when the user clicks the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setSessionReady(true);
        }
      }
    );

    // Also check if we already have a session (user may have already been authenticated via the link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const doUpdate = async () => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return error;
    setSuccess(true);
    setTimeout(() => navigate("/pv-admin"), 3000);
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      // If 2FA is enabled, the session must be elevated to AAL2 before updating the password
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
        setNeedsMfa(true);
        toast.info("Enter your authenticator code to continue");
        return;
      }

      const error = await doUpdate();
      if (error) {
        if ((error as any).code === "insufficient_aal") {
          setNeedsMfa(true);
          toast.info("Enter your authenticator code to continue");
        } else {
          toast.error(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.trim().length < 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) throw fErr;
      const totp = factors?.totp?.find((f) => f.status === "verified") ?? factors?.totp?.[0];
      if (!totp) {
        toast.error("No authenticator found for this account");
        return;
      }
      const { error: vErr } = await supabase.auth.mfa.challengeAndVerify({
        factorId: totp.id,
        code: mfaCode.trim(),
      });
      if (vErr) {
        toast.error("Invalid code. Please try again.");
        return;
      }
      const error = await doUpdate();
      if (error) toast.error(error.message);
    } catch (err: any) {
      toast.error(err?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="min-h-screen bg-cream-warm brick-overlay flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">
            Password Updated!
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Your password has been reset successfully. Redirecting to login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-warm brick-overlay flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary shadow-warm mb-4">
            <Pizza className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Pizza <span className="text-primary">Volante</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            Baguio City
          </p>
        </div>

        {/* Reset Card */}
        <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-warm animate-fade-in">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3 text-center">
            Set a new password
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Enter your new password below
          </p>

          {!sessionReady ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">
                Verifying your reset link…
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 py-6 rounded-xl border-2 bg-background"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-foreground font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-12 pr-12 py-6 rounded-xl border-2 bg-background"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-xl shadow-warm"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating…
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
