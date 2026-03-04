import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User, Shield, Palette, Bell, SlidersHorizontal, AlertTriangle,
  Camera, KeyRound, Smartphone, Activity, Sun, Moon, Type, Globe,
  Mail, BellRing, LayoutDashboard, ArrowUpDown, UserX, Trash2, Save,
  Loader2,
} from "lucide-react";
import ChangePasswordDialog from "@/components/dashboard/ChangePasswordDialog";
import TwoFactorDialog from "@/components/dashboard/TwoFactorDialog";
import LoginActivityDialog from "@/components/dashboard/LoginActivityDialog";

const SectionHeader = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-lg">
      <Icon className="h-5 w-5 text-primary" />
      {title}
    </CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
);

const FONT_SIZE_MAP: Record<string, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

const DashboardSettings = () => {
  const { user } = useAuthContext();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const { theme: currentTheme, setTheme: applyTheme } = useTheme();

  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Appearance state
  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [language, setLanguage] = useState("en");
  const [savingAppearance, setSavingAppearance] = useState(false);

  const [dashboardView, setDashboardView] = useState("grid");
  const [sortOrder, setSortOrder] = useState("newest");

  // Notification toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [appAlerts, setAppAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [mentionAlerts, setMentionAlerts] = useState(true);

  // Dialog states
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [loginActivityOpen, setLoginActivityOpen] = useState(false);
  const [is2FAEnrolled, setIs2FAEnrolled] = useState(false);

  // Check 2FA status
  useEffect(() => {
    const check2FA = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = data?.totp?.filter((f) => f.status === "verified") || [];
      setIs2FAEnrolled(verifiedFactors.length > 0);
    };
    check2FA();
  }, []);

  // Sync profile data when loaded
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarPreview(profile.avatar_url || null);
      setTheme(profile.theme || "light");
      setFontSize(profile.font_size || "medium");
      setLanguage(profile.language || "en");
      // Apply theme instantly
      applyTheme(profile.theme || "light");
      // Apply font size
      document.documentElement.style.fontSize = FONT_SIZE_MAP[profile.font_size || "medium"];
    }
  }, [profile]);

  // Apply theme in real-time when dropdown changes
  const handleThemeChange = (val: string) => {
    setTheme(val);
    applyTheme(val);
  };

  // Apply font size in real-time
  const handleFontSizeChange = (val: string) => {
    setFontSize(val);
    document.documentElement.style.fontSize = FONT_SIZE_MAP[val];
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      let newAvatarUrl = profile?.avatar_url || null;
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar(avatarFile);
        setAvatarFile(null);
      }
      await updateProfile({ display_name: displayName.trim(), avatar_url: newAvatarUrl });
      toast.success("Profile updated successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAppearance = async () => {
    setSavingAppearance(true);
    try {
      await updateProfile({ theme, font_size: fontSize, language });
      toast.success("Appearance preferences saved successfully.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save appearance.");
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleSave = (section: string) => {
    toast.success(`${section} saved successfully`);
  };

  const handle2FAToggle = (checked: boolean) => {
    setTwoFactorOpen(true);
  };

  const on2FAComplete = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const verifiedFactors = data?.totp?.filter((f) => f.status === "verified") || [];
    setIs2FAEnrolled(verifiedFactors.length > 0);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and configuration.</p>
        </div>

        {/* Profile Settings */}
        <Card>
          <SectionHeader icon={User} title="Profile Settings" description="Update your personal information and profile picture." />
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarPreview ? (
                  <AvatarImage src={avatarPreview} alt="Profile" className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-xs text-muted-foreground">JPG or PNG, max 2MB</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileSelect} />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" placeholder="Enter your name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user?.email || ""} disabled className="opacity-70" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <SectionHeader icon={Shield} title="Security" description="Manage your password, two-factor authentication, and login activity." />
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Change Password</p>
                  <p className="text-xs text-muted-foreground">Update your password regularly for security.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)}>Update</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">
                    {is2FAEnrolled ? "2FA is enabled. Click to manage." : "Add an extra layer of security to your account."}
                  </p>
                </div>
              </div>
              <Switch checked={is2FAEnrolled} onCheckedChange={handle2FAToggle} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Login Activity</p>
                  <p className="text-xs text-muted-foreground">View recent sign-in sessions.</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLoginActivityOpen(true)}>View</Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <SectionHeader icon={Palette} title="Appearance" description="Customize how the dashboard looks and feels." />
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  Theme
                </Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Type className="h-3.5 w-3.5" /> Font Size
                </Label>
                <Select value={fontSize} onValueChange={handleFontSizeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Globe className="h-3.5 w-3.5" /> Language
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="tl">Filipino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveAppearance} disabled={savingAppearance} className="gap-2">
                {savingAppearance ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingAppearance ? "Saving..." : "Save Appearance"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <SectionHeader icon={Bell} title="Notifications" description="Control how and when you receive alerts." />
          <CardContent className="space-y-4">
            {[
              { icon: Mail, label: "Email Alerts", desc: "Receive important updates via email.", value: emailAlerts, set: setEmailAlerts },
              { icon: BellRing, label: "In-App Alerts", desc: "Show notifications inside the dashboard.", value: appAlerts, set: setAppAlerts },
              { icon: Mail, label: "Weekly Digest", desc: "Get a summary of activity every week.", value: weeklyDigest, set: setWeeklyDigest },
              { icon: BellRing, label: "Mention Alerts", desc: "Notify when you're mentioned in a review.", value: mentionAlerts, set: setMentionAlerts },
            ].map((item, i) => (
              <div key={i}>
                {i > 0 && <Separator className="mb-4" />}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <Switch checked={item.value} onCheckedChange={item.set} />
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={() => handleSave("Notifications")} className="gap-2">
                <Save className="h-4 w-4" /> Save Notifications
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <SectionHeader icon={SlidersHorizontal} title="Preferences" description="Set your default dashboard behavior." />
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Default Dashboard View
                </Label>
                <Select value={dashboardView} onValueChange={setDashboardView}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <ArrowUpDown className="h-3.5 w-3.5" /> Default Sort Order
                </Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => handleSave("Preferences")} className="gap-2">
                <Save className="h-4 w-4" /> Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Control */}
        <Card className="border-destructive/30">
          <SectionHeader icon={AlertTriangle} title="Account Control" description="Deactivate or permanently delete your account." />
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Deactivate Account</p>
                  <p className="text-xs text-muted-foreground">Temporarily disable your account. You can reactivate anytime.</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Deactivate</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently remove your account and all data. This cannot be undone.</p>
                </div>
              </div>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <TwoFactorDialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen} isEnrolled={is2FAEnrolled} onComplete={on2FAComplete} />
      <LoginActivityDialog open={loginActivityOpen} onOpenChange={setLoginActivityOpen} />
    </DashboardLayout>
  );
};

export default DashboardSettings;
