import React from 'react';
import { useI18n } from '../context/I18nContext.jsx';

export default function LanguageToggle() {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      aria-label={`Switch to ${locale === 'en' ? 'Spanish' : 'English'}`}
      title={`Switch to ${locale === 'en' ? 'Español' : 'English'}`}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
      style={{
        background:  'rgba(255,255,255,0.06)',
        border:      '1px solid rgba(255,255,255,0.1)',
        color:       'var(--text-secondary)',
      }}
    >
      <span aria-hidden="true">{locale === 'en' ? '🇺🇸' : '🇪🇸'}</span>
      <span>{locale === 'en' ? 'EN' : 'ES'}</span>
    </button>
  );
}
