import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  dir: 'ltr' | 'rtl';
  t: (key: keyof typeof translations['fr']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_lang') as Language;
      return saved === 'ar' || saved === 'fr' ? saved : 'fr';
    } catch {
      return 'fr';
    }
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_lang', language);
    } catch {
      // Ignore storage errors in restricted environments
    }
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', dir);
  }, [language, dir]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'fr' ? 'ar' : 'fr'));
  };

  const t = (key: keyof typeof translations['fr']): string => {
    const dict = translations[language] || translations.fr;
    return (dict as Record<string, string>)[key] || (translations.fr as Record<string, string>)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
