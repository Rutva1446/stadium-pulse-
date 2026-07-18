import React from 'react';

const LEVEL_CONFIG = {
  critical: { icon: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
  warning:  { icon: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
  incident: { icon: '🚨', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.3)' },
  info:     { icon: 'ℹ️', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.25)' },
};

function timeAgo(iso) {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60)   return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

export default function AlertFeed({ alerts = [], onAcknowledge, label = 'Alert Feed' }) {
  return (
    <section aria-label={label}>
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">{label}</h2>

      {alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm gap-2">
          <span className="text-2xl" aria-hidden="true">✅</span>
          No active alerts — all clear
        </div>
      )}

      <ul className="flex flex-col gap-2" role="list" aria-live="polite">
        {alerts.map((alert, i) => {
          const cfg = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.info;
          return (
            <li
              key={alert.id}
              className="rounded-xl px-4 py-3 animate-slide-in"
              style={{
                background:   cfg.bg,
                border:       `1px solid ${cfg.border}`,
                animationDelay: `${i * 50}ms`,
              }}
              role="listitem"
              aria-label={`${alert.level} alert: ${alert.message}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <span className="text-base mt-0.5 shrink-0" aria-hidden="true">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-snug">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs font-semibold uppercase"
                        style={{ color: cfg.color }}
                      >
                        {alert.level}
                      </span>
                      {alert.gate && (
                        <span className="text-xs text-slate-500">Gate {alert.gate}</span>
                      )}
                      {alert.timestamp && (
                        <span className="text-xs text-slate-600">{timeAgo(alert.timestamp)}</span>
                      )}
                    </div>
                  </div>
                </div>
                {onAcknowledge && !alert.acknowledged && (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    aria-label={`Acknowledge alert ${alert.id}`}
                    className="text-xs shrink-0 px-2 py-1 rounded-lg font-medium transition-colors"
                    style={{
                      background:  'rgba(255,255,255,0.06)',
                      border:      '1px solid rgba(255,255,255,0.1)',
                      color:       'var(--text-secondary)',
                    }}
                  >
                    ✓ Ack
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
