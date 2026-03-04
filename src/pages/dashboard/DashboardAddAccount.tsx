import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, UserPlus, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { z } from "zod";
import { useHcaptchaSiteKey } from "@/hooks/useHcaptchaSiteKey";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const STORAGE_KEY = "pv_saved_accounts";

interface SavedAccount {
  email: string;
  lastActive: string;
}

const getSavedAccounts = (): SavedAccount[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

const saveAccount = (email: string) => {
  const accounts = getSavedAccounts();
  const now = new Date().toISOString();
  const exists = accounts.findIndex((a) => a.email === email);
  if (exists >= 0) {
    accounts[exists].lastActive = now;
  } else {
    accounts.push({ email, lastActive: now });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
};

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const DashboardAddAccount = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  const { siteKey: hcaptchaSiteKey, loading: hcaptchaKeyLoading } = useHcaptchaSiteKey();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (!captchaToken) {
      toast.error("Please complete the captcha");
      return;
    }

    if (email.trim().toLowerCase() === user?.email?.toLowerCase()) {
      toast.error("You're already signed in with this account.");
      return;
    }

    setLoading(true);

    // Save the current account first
    if (user?.email) {
      saveAccount(user.email);
    }

    // Sign out current session, then sign in with the new one
    await supabase.auth.signOut();

    const verifyRes = await supabase.functions.invoke("verify-captcha", {
      body: { token: captchaToken },
    });

    if (verifyRes.error || !verifyRes.data?.success) {
      setLoading(false);
      toast.error("Captcha verification failed. Please try again.");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      // Re-sign in with old account is not possible since we signed out — redirect to login
      navigate("/pv-admin");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message || "Invalid credentials. Please try again.");
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
      // Sign back in is not trivial — redirect to login
      navigate("/pv-admin");
      return;
    }

    // Save the new account
    saveAccount(email.trim().toLowerCase());
    toast.success("Account added successfully! You're now signed in.");
    navigate("/pv-dashboard/switch-account");
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 mb-2 -ml-2"
            onClick={() => navigate("/pv-dashboard/switch-account")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Switch Account
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Add Another Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Log in with a different account. Your current session will be preserved in the account list.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5 text-primary" />
              Sign In with New Account
            </CardTitle>
            <CardDescription>
              Enter the credentials for the account you want to add.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="add-email" className="text-foreground font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="add-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-password" className="text-foreground font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="add-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* hCaptcha */}
              <div className="flex justify-center overflow-hidden rounded-xl bg-muted/30 p-3">
                <div className="scale-[0.85] origin-center">
                  {hcaptchaKeyLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Loading captcha...
                    </p>
                  ) : hcaptchaSiteKey ? (
                    <HCaptcha
                      ref={captchaRef}
                      sitekey={hcaptchaSiteKey}
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
                className="w-full gap-2"
                size="lg"
                disabled={loading || hcaptchaKeyLoading || !hcaptchaSiteKey}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Add & Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5">
              <Separator className="my-4" />
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <p>
                  Your current account will be saved to the Switch Account list. You can switch back anytime from the dashboard.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAddAccount;
