import { ReactNode } from "react";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { useProfile } from "@/hooks/useProfile";
import type { LangCode } from "@/i18n/translations";

/**
 * Wraps LanguageProvider and feeds it the user's saved language from their profile.
 * Must be rendered inside AuthProvider.
 */
const LanguageFromProfile = ({ children }: { children: ReactNode }) => {
  const { profile } = useProfile();
  const lang = (profile?.language as LangCode) || "en";

  return (
    <LanguageProvider initialLanguage={lang}>
      {children}
    </LanguageProvider>
  );
};

export default LanguageFromProfile;
