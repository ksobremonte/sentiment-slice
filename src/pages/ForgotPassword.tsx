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

const emailSchema = z.string().trim().email({ message: "Invalid email address" });

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const { resetPassword } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
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
    const { error } = await resetPassword(email);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-6">
            <CheckCircle className="w-9 h-9 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Check your email</h2>
          <p className="text-muted-foreground mb-6">
            We've sent a password reset link to <span className="text-foreground font-medium">{email}</span>
          </p>
          <Link to="/login">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary shadow-glow mb-4">
            <Pizza className="w-9 h-9 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Pizza <span className="text-gradient">Volante</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Baguio City</p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card animate-fade-in">
          <h2 className="text-xl font-semibold text-foreground mb-2 text-center">
            Forgot your password?
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Enter your email and we'll send you a reset link
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-11"
                  required
                />
              </div>
            </div>

            {/* hCaptcha */}
            <div className="flex justify-center">
              <HCaptcha
                ref={captchaRef}
                sitekey="10000000-ffff-ffff-ffff-000000000001"
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                theme="dark"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline font-medium inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
