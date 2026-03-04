import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { translations, SUPPORTED_LANGUAGES, type LangCode } from "./translations";

interface LanguageContextType {
  language: LangCode;
  setLanguage: (lang: LangCode) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children, initialLanguage = "en" }: { children: ReactNode; initialLanguage?: LangCode }) => {
  const [language, setLanguageState] = useState<LangCode>(initialLanguage);

  const setLanguage = useCallback((lang: LangCode) => {
    setLanguageState(lang);
  }, []);

  // Update when initialLanguage changes (e.g. after profile loads)
  useEffect(() => {
    if (initialLanguage && initialLanguage !== language) {
      setLanguageState(initialLanguage);
    }
  }, [initialLanguage]);

  const dir = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.dir as "ltr" | "rtl" || "ltr";

  // Update document dir for RTL support
  useEffect(() => {
    document.documentElement.dir = dir;
  }, [dir]);

  const t = useCallback(
    (key: string): string => {
      const langDict = translations[language];
      if (langDict && key in langDict) return langDict[key];

      // Fallback to English
      const enDict = translations.en;
      if (enDict && key in enDict) return enDict[key];

      // Missing key — log warning and return key itself
      console.warn(`[i18n] Missing translation key: "${key}" for language "${language}"`);
      return key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
