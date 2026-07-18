import React from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';
import LanguageToggle from './LanguageToggle.jsx';

const ROLE_COLORS = {
  fan:      'text-brand-blue',
  staff:    'text-brand-gold',
  security: 'text-brand-red',
};

const ROLE_ICONS = {
  fan:      '🎟️',
  staff:    '🏟️',
  security: '🛡️',
};

export default function Navbar() {
  const { role, clearRole, notifications } = useApp();
  const { t } = useI18n();

  return (
    <>
      {/* ── Top Navbar ─────────────────────────────────────────────────── */}
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 h-14"
        style={{
          background: 'rgba(2, 8, 20, 0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          {/* Stadium SVG logo */}
          <svg width="32" height="22" viewBox="0 0 64 44" fill="none" aria-hidden="true">
            <ellipse cx="32" cy="22" rx="30" ry="18" stroke="#3b82f6" strokeWidth="2" fill="none"/>
            <ellipse cx="32" cy="22" rx="20" ry="11" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" fill="none"/>
            <ellipse cx="32" cy="22" rx="12" ry="7" fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth="1" strokeOpacity="0.6"/>
            <line x1="32" y1="15" x2="32" y2="29" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
          </svg>
          <span className="font-bold text-lg tracking-tight gradient-text">{t.nav.brand}</span>
          {role && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span>{ROLE_ICONS[role]}</span>
              <span className={ROLE_COLORS[role]}>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
            </span>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-brand-green font-semibold"
               aria-label="Live data feed active">
            <span className="live-dot" aria-hidden="true" />
            <span>{t.nav.live}</span>
          </div>

          <LanguageToggle />

          {role && (
            <button
              onClick={clearRole}
              aria-label={t.nav.back}
              className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid rgba(255,255,255,0.08)' }}
            >
              ← {t.nav.back}
            </button>
          )}
        </div>
      </nav>

      {/* ── Toast Notifications ─────────────────────────────────────────── */}
      <div
        role="region"
        aria-live="polite"
        aria-label="Notifications"
        className="fixed top-16 right-4 z-50 flex flex-col gap-2 w-80 max-w-xs"
      >
        {notifications.map((n) => (
          <div
            key={n.id}
            className="animate-slide-in rounded-xl px-4 py-3 text-sm font-medium"
            style={{
              background: n.level === 'critical'
                ? 'rgba(239,68,68,0.15)'
                : n.level === 'warning'
                ? 'rgba(245,158,11,0.12)'
                : 'rgba(59,130,246,0.12)',
              border: `1px solid ${
                n.level === 'critical' ? 'rgba(239,68,68,0.4)'
                : n.level === 'warning' ? 'rgba(245,158,11,0.35)'
                : 'rgba(59,130,246,0.3)'
              }`,
              backdropFilter: 'blur(12px)',
            }}
            role="alert"
          >
            <span className="font-bold mr-1.5">
              {n.level === 'critical' ? '🚨 [CRITICAL]' : 
               n.level === 'warning' ? '⚠️ [WARNING]' : 
               n.level === 'normal' ? '🟢 [NORMAL]' : 'ℹ️ [INFO]'}
            </span>
            {n.msg}
          </div>
        ))}
      </div>
    </>
  );
}
