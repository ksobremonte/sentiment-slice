import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Pizza, ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logLoginActivity } from "@/lib/logLoginActivity";

const VerifyOtp = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const pendingLogin = location.state as {
    userId: string;
    email: string;
  } | null;

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

  const handleVerify = async () => {
    if (code.length !== 6 || !pendingLogin) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-login-otp", {
        body: { userId: pendingLogin.userId, code },
      });

      if (error) throw error;

      if (data?.valid) {
        // Mark OTP as verified in session storage
        sessionStorage.setItem("otp_verified", pendingLogin.userId);
        logLoginActivity(pendingLogin.userId);
        toast.success("Welcome back!");
        navigate("/pv-dashboard", { replace: true });
      } else {
        toast.error(data?.error || "Invalid or expired code. Please try again.");
        setCode("");
      }
    } catch (err: any) {
      toast.error("Verification failed. Please try again.");
      setCode("");
    } finally {
      setLoading(false);
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
    // Sign out the pending session
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
            Back to Sign In
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

        {/* OTP Card */}
        <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-warm animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Verify Your Identity
            </h2>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium text-foreground">{maskedEmail}</span>
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <InputOTP
              value={code}
              onChange={setCode}
              maxLength={6}
              onComplete={handleVerify}
            >
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
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="text-sm text-primary hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending
                ? "Sending..."
                : countdown > 0
                ? `Resend in ${countdown}s`
                : "Resend Code"}
            </button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Code expires in 5 minutes
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
