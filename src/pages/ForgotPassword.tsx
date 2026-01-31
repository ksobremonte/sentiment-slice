import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Pizza, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { z } from "zod";
import { useHcaptchaSiteKey } from "@/hooks/useHcaptchaSiteKey";

const emailSchema = z.string().trim().email({ message: "Invalid email address" });

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const { resetPassword } = useAuthContext();
  const { siteKey, loading: siteKeyLoading } = useHcaptchaSiteKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the captcha");
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email, captchaToken);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-cream-warm brick-overlay flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success/10 mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground mb-4">Check your email</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            We've sent a password reset link to <span className="text-foreground font-semibold">{email}</span>
          </p>
          <Link to="/wp-admin">
            <Button variant="outline" size="lg" className="rounded-xl border-2 font-semibold">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-warm brick-overlay flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/wp-admin" className="text-sm text-primary hover:underline font-semibold inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
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

        {/* Forgot Password Card */}
        <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-warm animate-fade-in">
          <h2 className="text-2xl font-display font-bold text-foreground mb-3 text-center">
            Forgot your password?
          </h2>
          <p className="text-muted-foreground text-center mb-8">
            Enter your email and we'll send you a reset link
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 py-6 rounded-xl border-2 bg-background"
                  required
                />
              </div>
            </div>

            {/* hCaptcha */}
            <div className="flex justify-center overflow-hidden rounded-xl bg-muted/30 p-4">
              <div className="scale-[0.9] origin-center">
                {siteKeyLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : siteKey ? (
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={siteKey}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    theme="light"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Captcha is not configured.
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-6 text-lg rounded-xl shadow-warm"
              size="lg"
              disabled={loading || siteKeyLoading || !siteKey}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
