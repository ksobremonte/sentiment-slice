import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pizza, Mail, Lock, Eye, EyeOff, Loader2, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { z } from "zod";
import { useHcaptchaSiteKey } from "@/hooks/useHcaptchaSiteKey";

const signupSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  const { signUp } = useAuthContext();
  const { siteKey, loading: siteKeyLoading } = useHcaptchaSiteKey();

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signupSchema.safeParse({ email, password, confirmPassword });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the captcha");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, captchaToken);
    setLoading(false);

    if (error) {
      toast.error(error.message);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } else {
      toast.success("Account created successfully!");
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-cream-warm brick-overlay flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/" className="text-sm text-primary hover:underline font-semibold inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Website
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

        {/* Signup Card */}
        <div className="bg-card border-2 border-border rounded-3xl p-8 shadow-warm animate-fade-in">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8 text-center">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 py-6 rounded-xl border-2 bg-background"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password requirements */}
              {password && (
                <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-muted/50 rounded-xl">
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordChecks.length ? 'text-success' : 'text-muted-foreground'}`}>
                    <Check className="w-3.5 h-3.5" />
                    8+ characters
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordChecks.uppercase ? 'text-success' : 'text-muted-foreground'}`}>
                    <Check className="w-3.5 h-3.5" />
                    Uppercase
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordChecks.lowercase ? 'text-success' : 'text-muted-foreground'}`}>
                    <Check className="w-3.5 h-3.5" />
                    Lowercase
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-medium ${passwordChecks.number ? 'text-success' : 'text-muted-foreground'}`}>
                    <Check className="w-3.5 h-3.5" />
                    Number
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 py-6 rounded-xl border-2 bg-background"
                  required
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-destructive font-medium">Passwords don't match</p>
              )}
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
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/wp-admin" className="text-primary hover:underline font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
