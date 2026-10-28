import { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { UI_TRANSLATIONS } from '../utils/i18n.js';

export const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
  dir: 'ltr',
});

const STORAGE_KEY = 'crwn-language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'ar' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((next) => {
    const value = next === 'ar' ? 'ar' : 'en';
    setLanguageState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.body.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback(
    (key) => {
      const table = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
      return table[key] || UI_TRANSLATIONS.en[key] || key;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      dir: language === 'ar' ? 'rtl' : 'ltr',
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};
