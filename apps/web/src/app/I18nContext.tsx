'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRANSLATIONS, Lang } from '../lib/translations';

interface I18nContextProps {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: Lang) => void;
  t: (key: string, variables?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>('ar');
  const [dir, setDir] = useState<'rtl' | 'ltr'>('rtl');

  useEffect(() => {
    const savedLang = localStorage.getItem('visaflow_lang') as Lang;
    if (savedLang && (savedLang === 'ar' || savedLang === 'en')) {
      setLangState(savedLang);
      setDir(savedLang === 'ar' ? 'rtl' : 'ltr');
    }
  }, []);

  const setLang = (nextLang: Lang) => {
    setLangState(nextLang);
    setDir(nextLang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('visaflow_lang', nextLang);
  };

  const t = (key: string, variables?: Record<string, string>): string => {
    const dict = TRANSLATIONS[lang] as Record<string, string>;
    let translation = dict[key] || TRANSLATIONS['en'][key as keyof typeof TRANSLATIONS['en']] || key;

    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, v);
      });
    }

    return translation;
  };

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, t }}>
      <div dir={dir} className={lang === 'ar' ? 'font-ar' : 'font-en'}>
        {children}
      </div>
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
