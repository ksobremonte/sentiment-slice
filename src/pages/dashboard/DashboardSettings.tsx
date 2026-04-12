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
import { useLanguage } from "@/i18n/LanguageContext";
import { SUPPORTED_LANGUAGES, type LangCode } from "@/i18n/translations";
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
import PasskeySettings from "@/components/dashboard/PasskeySettings";

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
  const { profile, updateProfile, uploadAvatar } = useProfile();
  const { theme: currentTheme, setTheme: applyTheme } = useTheme();
  const { t, language: ctxLanguage, setLanguage: setCtxLanguage } = useLanguage();

  const [displayName, setDisplayName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [theme, setTheme] = useState("light");
  const [fontSize, setFontSize] = useState("medium");
  const [language, setLanguage] = useState<LangCode>("en");
  const [savingAppearance, setSavingAppearance] = useState(false);

  const [dashboardView, setDashboardView] = useState("grid");
  const [sortOrder, setSortOrder] = useState("newest");

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [appAlerts, setAppAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);
  const [mentionAlerts, setMentionAlerts] = useState(true);

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const [loginActivityOpen, setLoginActivityOpen] = useState(false);
  const [is2FAEnrolled, setIs2FAEnrolled] = useState(false);

  useEffect(() => {
    const check2FA = async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const verifiedFactors = data?.totp?.filter((f) => f.status === "verified") || [];
      setIs2FAEnrolled(verifiedFactors.length > 0);
    };
    check2FA();
  }, []);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setAvatarPreview(profile.avatar_url || null);
      setTheme(profile.theme || "light");
      setFontSize(profile.font_size || "medium");
      setLanguage((profile.language as LangCode) || "en");
      applyTheme(profile.theme || "light");
      document.documentElement.style.fontSize = FONT_SIZE_MAP[profile.font_size || "medium"];
    }
  }, [profile]);

  const handleThemeChange = (val: string) => {
    setTheme(val);
    applyTheme(val);
  };

  const handleFontSizeChange = (val: string) => {
    setFontSize(val);
    document.documentElement.style.fontSize = FONT_SIZE_MAP[val];
  };

  // Instantly switch UI language when dropdown changes
  const handleLanguageChange = (val: string) => {
    const lang = val as LangCode;
    setLanguage(lang);
    setCtxLanguage(lang);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast.error(t("toast.imageType"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("toast.imageSize"));
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error(t("toast.nameEmpty"));
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
      toast.success(t("toast.profileUpdated"));
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
      toast.success(t("toast.appearanceSaved"));
    } catch (err: any) {
      toast.error(err?.message || "Failed to save appearance.");
    } finally {
      setSavingAppearance(false);
    }
  };

  const handleSave = (section: string) => {
    toast.success(`${section} saved successfully`);
  };

  const handle2FAToggle = () => setTwoFactorOpen(true);

  const on2FAComplete = async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    const verifiedFactors = data?.totp?.filter((f) => f.status === "verified") || [];
    setIs2FAEnrolled(verifiedFactors.length > 0);
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>

        {/* Profile */}
        <Card>
          <SectionHeader icon={User} title={t("settings.profile")} description={t("settings.profileDesc")} />
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarPreview ? <AvatarImage src={avatarPreview} alt="Profile" className="object-cover" /> : null}
                <AvatarFallback className="bg-primary/20 text-primary text-xl font-bold">
                  {displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4" />{t("settings.changePhoto")}
                </Button>
                <p className="text-xs text-muted-foreground">{t("settings.photoHint")}</p>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleFileSelect} />
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="displayName">{t("settings.displayName")}</Label>
                <Input id="displayName" placeholder={t("settings.displayNamePlaceholder")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t("settings.email")}</Label>
                <Input id="email" value={user?.email || ""} disabled className="opacity-70" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? t("settings.saving") : t("settings.saveProfile")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <SectionHeader icon={Shield} title={t("settings.security")} description={t("settings.securityDesc")} />
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("settings.changePassword")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.changePasswordDesc")}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)}>{t("settings.update")}</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("settings.twoFactor")}</p>
                  <p className="text-xs text-muted-foreground">
                    {is2FAEnrolled ? t("settings.twoFactorEnabled") : t("settings.twoFactorDesc")}
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
                  <p className="text-sm font-medium">{t("settings.loginActivity")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.loginActivityDesc")}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setLoginActivityOpen(true)}>{t("settings.view")}</Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <SectionHeader icon={Palette} title={t("settings.appearance")} description={t("settings.appearanceDesc")} />
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  {theme === "dark" ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
                  {t("settings.theme")}
                </Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">{t("settings.themeLight")}</SelectItem>
                    <SelectItem value="dark">{t("settings.themeDark")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Type className="h-3.5 w-3.5" /> {t("settings.fontSize")}
                </Label>
                <Select value={fontSize} onValueChange={handleFontSizeChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">{t("settings.fontSmall")}</SelectItem>
                    <SelectItem value="medium">{t("settings.fontMedium")}</SelectItem>
                    <SelectItem value="large">{t("settings.fontLarge")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Globe className="h-3.5 w-3.5" /> {t("settings.language")}
                </Label>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveAppearance} disabled={savingAppearance} className="gap-2">
                {savingAppearance ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingAppearance ? t("settings.saving") : t("settings.saveAppearance")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <SectionHeader icon={Bell} title={t("settings.notifications")} description={t("settings.notificationsDesc")} />
          <CardContent className="space-y-4">
            {[
              { icon: Mail, label: t("settings.emailAlerts"), desc: t("settings.emailAlertsDesc"), value: emailAlerts, set: setEmailAlerts },
              { icon: BellRing, label: t("settings.inAppAlerts"), desc: t("settings.inAppAlertsDesc"), value: appAlerts, set: setAppAlerts },
              { icon: Mail, label: t("settings.weeklyDigest"), desc: t("settings.weeklyDigestDesc"), value: weeklyDigest, set: setWeeklyDigest },
              { icon: BellRing, label: t("settings.mentionAlerts"), desc: t("settings.mentionAlertsDesc"), value: mentionAlerts, set: setMentionAlerts },
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
                <Save className="h-4 w-4" /> {t("settings.saveNotifications")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <SectionHeader icon={SlidersHorizontal} title={t("settings.preferences")} description={t("settings.preferencesDesc")} />
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <LayoutDashboard className="h-3.5 w-3.5" /> {t("settings.dashboardView")}
                </Label>
                <Select value={dashboardView} onValueChange={setDashboardView}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">{t("settings.grid")}</SelectItem>
                    <SelectItem value="list">{t("settings.list")}</SelectItem>
                    <SelectItem value="compact">{t("settings.compact")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <ArrowUpDown className="h-3.5 w-3.5" /> {t("settings.sortOrder")}
                </Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("settings.newest")}</SelectItem>
                    <SelectItem value="oldest">{t("settings.oldest")}</SelectItem>
                    <SelectItem value="rating">{t("settings.highestRating")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => handleSave("Preferences")} className="gap-2">
                <Save className="h-4 w-4" /> {t("settings.savePreferences")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Control */}
        <Card className="border-destructive/30">
          <SectionHeader icon={AlertTriangle} title={t("settings.accountControl")} description={t("settings.accountControlDesc")} />
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserX className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("settings.deactivate")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.deactivateDesc")}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">{t("settings.deactivateBtn")}</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trash2 className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">{t("settings.deleteAccount")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.deleteAccountDesc")}</p>
                </div>
              </div>
              <Button variant="destructive" size="sm">{t("settings.deleteBtn")}</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <TwoFactorDialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen} isEnrolled={is2FAEnrolled} onComplete={on2FAComplete} />
      <LoginActivityDialog open={loginActivityOpen} onOpenChange={setLoginActivityOpen} />
    </DashboardLayout>
  );
};

export default DashboardSettings;
