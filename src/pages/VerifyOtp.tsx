import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pizza, ShieldCheck, Loader2, ArrowLeft, Fingerprint, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logLoginActivity } from "@/lib/logLoginActivity";
import { usePasskey } from "@/hooks/usePasskey";

type VerifyMethod = "choose" | "otp" | "passkey";

const VerifyOtp = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [method, setMethod] = useState<VerifyMethod>("choose");
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const pendingLogin = location.state as {
    userId: string;
    email: string;
  } | null;

  const { supported: passkeySupported, hasPasskeys, loading: passkeyLoading, authenticatePasskey } =
    usePasskey(pendingLogin?.userId);

  // Always show choose screen once passkey status is loaded
  // (no longer auto-skips to OTP)

  useEffect(() => {
    if (!pendingLogin) {
      navigate("/pv-admin", { replace: true });
    }
  }, [pendingLogin, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSuccess = () => {
    if (!pendingLogin) return;
    sessionStorage.setItem("otp_verified", pendingLogin.userId);
    logLoginActivity(pendingLogin.userId);
    toast.success("Welcome back!");
    navigate("/pv-dashboard", { replace: true });
  };

  const handleVerify = async () => {
    if (code.length !== 6 || !pendingLogin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-login-otp", {
        body: { userId: pendingLogin.userId, code },
      });
      if (error) throw error;
      if (data?.valid) {
        handleSuccess();
      } else {
        toast.error(data?.error || "Invalid or expired code. Please try again.");
        setCode("");
      }
    } catch {
      toast.error("Verification failed. Please try again.");
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    setPasskeyError(null);
    const result = await authenticatePasskey();
    if (result.success) {
      handleSuccess();
    } else if (result.error === "cancelled") {
      // User cancelled
    } else {
      setPasskeyError(result.error || "Authentication failed. Try again.");
    }
  };

  const handleResend = async () => {
    if (!pendingLogin || countdown > 0) return;
    setResending(true);
    try {
      await supabase.functions.invoke("send-login-otp", {
        body: { userId: pendingLogin.userId, email: pendingLogin.email },
      });
      toast.success("A new code has been sent to your email.");
      setCountdown(60);
      setCode("");
    } catch {
      toast.error("Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  const handleBack = async () => {
    if (method === "passkey") {
      setMethod("choose");
      setPasskeyError(null);
      return;
    }
    if (method === "otp") {
      setMethod("choose");
      return;
    }
    await supabase.auth.signOut();
    navigate("/pv-admin", { replace: true });
  };

  if (!pendingLogin) return null;

  const maskedEmail = pendingLogin.email.replace(
    /(.{2})(.*)(@.*)/,
    (_, a, b, c) => a + "*".repeat(Math.min(b.length, 6)) + c
  );

  return (
    <div className="min-h-screen bg-cream-warm brick-overlay flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-sm text-primary hover:underline font-semibold inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {method === "choose"
              ? "Back to Sign In"
              : "Back to options"}
          </button>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary shadow-warm mb-4">
            <Pizza className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Pizza <span className="text-primary">Volante</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Baguio City</p>
        </div>

        {/* Choose Method */}
        {method === "choose" && (
          <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-warm animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Verify Your Identity
              </h2>
              <p className="text-sm text-muted-foreground">
                Choose how you want to verify your identity
              </p>
            </div>

            <div className="space-y-3">
              {/* Passkey Option - Primary */}
              <button
                onClick={() => {
                  if (hasPasskeys) {
                    setMethod("passkey");
                    setTimeout(() => handlePasskeyAuth(), 300);
                  } else {
                    toast.error("No passkeys registered. Register one in Dashboard Settings first.");
                  }
                }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${
                  hasPasskeys
                    ? "border-primary bg-primary/5 hover:bg-primary/10"
                    : "border-border bg-muted/30 hover:bg-muted/50"
                }`}
              >
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                  hasPasskeys ? "bg-primary/10 group-hover:bg-primary/20" : "bg-muted"
                }`}>
                  <Fingerprint className={`h-6 w-6 ${hasPasskeys ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-left flex-1">
                  <p className="font-semibold text-foreground">Passkey / Security Key</p>
                  <p className="text-xs text-muted-foreground">Use your registered security key</p>
                </div>
                {hasPasskeys && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                    Recommended
                  </span>
                )}
              </button>

              {/* Email OTP Option */}
              <button
                onClick={() => setMethod("otp")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-primary/30 hover:bg-muted/50 transition-all group"
              >
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Mail className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                </div>
              <div className="text-left flex-1">
                  <p className="font-semibold text-foreground">Email OTP</p>
                  <p className="text-xs text-muted-foreground">
                    Receive a 6-digit code via email
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Passkey Authentication */}
        {method === "passkey" && (
          <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-warm animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <Fingerprint className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Sign in with a Passkey
              </h2>
              <p className="text-sm text-muted-foreground">
                Follow your browser's prompt to authenticate with your security key, fingerprint, or Face ID
              </p>
            </div>

            {passkeyLoading && (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground animate-pulse">
                  Waiting for authenticator...
                </p>
              </div>
            )}

            {passkeyError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">{passkeyError}</p>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={handlePasskeyAuth}
                className="w-full py-6 text-lg rounded-xl shadow-warm gap-2"
                size="lg"
                disabled={passkeyLoading}
              >
                {passkeyLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Fingerprint className="w-5 h-5" />
                    Try Again
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  setMethod("otp");
                  setPasskeyError(null);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Use email code instead
              </Button>
            </div>
          </div>
        )}

        {/* OTP Card */}
        {method === "otp" && (
          <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-warm animate-fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Verify Your Identity
              </h2>
              <p className="text-sm text-muted-foreground">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-foreground">{maskedEmail}</span>
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <InputOTP value={code} onChange={setCode} maxLength={6} onComplete={handleVerify}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-xl shadow-warm"
              size="lg"
              disabled={loading || code.length < 6}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Sign In"
              )}
            </Button>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
              <button
                onClick={handleResend}
                disabled={resending || countdown > 0}
                className="text-sm text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? "Sending..." : countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </button>
            </div>

            {hasPasskeys && (
              <div className="text-center mt-4 pt-4 border-t">
                <button
                  onClick={() => setMethod("choose")}
                  className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  Use passkey instead
                </button>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-6">Code expires in 5 minutes</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyOtp;
