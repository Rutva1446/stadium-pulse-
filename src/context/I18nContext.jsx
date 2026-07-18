import React, { createContext, useContext, useState } from 'react';
import en from '../i18n/en.js';
import es from '../i18n/es.js';

const LOCALES = { en, es };
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState('en');
  const t = LOCALES[locale] || en;
  const toggleLocale = () => setLocale((l) => (l === 'en' ? 'es' : 'en'));

  return (
    <I18nContext.Provider value={{ locale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
