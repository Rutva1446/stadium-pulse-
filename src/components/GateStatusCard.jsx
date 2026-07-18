import React from 'react';
import CrowdGauge from './CrowdGauge.jsx';
import { useI18n } from '../context/I18nContext.jsx';

const LEVEL_CONFIG = {
  open:     { label: 'Open',     color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)' },
  medium:   { label: 'Busy',     color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.25)' },
  high:     { label: 'High',     color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.3)'  },
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    border: 'rgba(239,68,68,0.4)'   },
};

export default function GateStatusCard({ gateId, gate, onClick }) {
  const { t } = useI18n();
  const density = Math.round(gate.density || 0);
  const status  = gate.status || 'open';
  const cfg     = LEVEL_CONFIG[status] || LEVEL_CONFIG.open;

  return (
    <article
      className="glass-card p-4 cursor-pointer animate-fade-up"
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        border: `1px solid ${cfg.border}`,
        ...(status === 'critical' ? { animation: 'glow-critical 2s ease-in-out infinite' } : {}),
      }}
      onClick={() => onClick?.(gateId, gate)}
      tabIndex={0}
      role="button"
      aria-label={`Gate ${gateId}: ${density}% density, ${status}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(gateId, gate)}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Gate {gateId}</p>
          <p className="text-sm font-bold text-white">{gate.direction || ''}</p>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.border}` }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Gauge */}
      <div className="flex items-center justify-between">
        <CrowdGauge value={density} size={80} label={t.staff.density} />

        {/* Stats */}
        <div className="flex flex-col gap-2 text-right">
          <div>
            <p className="text-xs text-slate-500">{t.staff.queue}</p>
            <p className="text-lg font-bold" style={{ color: cfg.color }}>
              {gate.queueMinutes ?? 0}
              <span className="text-xs font-normal text-slate-400 ml-1">{t.staff.mins}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Density</p>
            <p className="text-base font-semibold text-white">{density}%</p>
          </div>
        </div>
      </div>

      {/* Density bar */}
      <div className="mt-3">
        <div className="density-bar-wrap">
          <div
            className="density-bar"
            style={{
              width: `${density}%`,
              background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`,
            }}
            role="progressbar"
            aria-valuenow={density}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>
    </article>
  );
}
