import React, { useState, useEffect } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useLiveData, useAssistant } from '../hooks/useLiveData.js';
import GateStatusCard from '../components/GateStatusCard.jsx';
import AlertFeed from '../components/AlertFeed.jsx';

function getRuleExplanation(result, role) {
  if (!result) return '';
  
  if (result.source === 'incident' || (result.incident && result.incident.type)) {
    const severity = result.alertLevel || 'critical';
    const type = result.incident?.type || 'active incident';
    return `Triggered by: Incident Rules → ${type} incident (${severity})`;
  }
  
  if (role === 'fan' && result.qaAnswer) {
    if (result.qaAnswer.startsWith("I'm not sure about that")) {
      return 'Triggered by: Fan Q&A → Default Fallback';
    }
    return 'Triggered by: Fan Q&A → Keyword Match rule';
  }
  
  if (result.densityLevel) {
    return `Triggered by: Density Classification → ${result.densityLevel} → Role×Phase rule`;
  }
  
  return 'Triggered by: Default Fallback rule';
}

const PHASE_COLORS = {
  'pre-match':  { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  label: 'Pre-Match'  },
  'live':       { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  label: '🔴 LIVE'    },
  'post-match': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Post-Match' },
};

// Animated counter component
function AnimatedStat({ value, suffix = '', color }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start    = 0;
    const end    = parseInt(value) || 0;
    if (end === 0) { setDisplayed(0); return; }
    const step   = Math.max(1, Math.floor(end / 30));
    const timer  = setInterval(() => {
      start += step;
      if (start >= end) { setDisplayed(end); clearInterval(timer); }
      else setDisplayed(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);

  return (
    <span style={{ color }} className="tabular-nums">
      {typeof value === 'number' || !isNaN(parseInt(value))
        ? displayed.toLocaleString() + suffix
        : value}
    </span>
  );
}

function StatCard({ icon, label, value, suffix, color, bg }) {
  return (
    <div
      className="glass-card px-5 py-4 flex items-center gap-4 animate-count-in"
      style={{ borderColor: `${color}30` }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ background: bg }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-black mt-0.5">
          <AnimatedStat value={value} suffix={suffix} color={color} />
        </p>
      </div>
    </div>
  );
}

export default function StaffView() {
  const { t } = useI18n();
  const { addNotification } = useApp();
  const { data, loading, error, refetch } = useLiveData(10000);
  const { ask, loading: aiLoading, result: aiResult } = useAssistant();

  const [selectedGate, setSelectedGate]   = useState(null);
  const [aiRecs, setAiRecs]               = useState([]);
  const [selectedGateResult, setSelectedGateResult] = useState(null);

  // Advance phase API call
  async function advancePhase() {
    try {
      const res = await fetch('/api/dashboard/phase', { method: 'POST' });
      const json = await res.json();
      addNotification(`Phase advanced → ${json.eventPhase}`, 'info');
      refetch();
    } catch {
      addNotification('Failed to advance phase', 'warning');
    }
  }

  // Acknowledge alert
  async function acknowledgeAlert(alertId) {
    try {
      await fetch(`/api/dashboard/alerts/${alertId}/acknowledge`, { method: 'POST' });
      refetch();
    } catch {}
  }

  // Get AI recommendations for selected gate
  async function getGateRecommendations(gateId, gate) {
    setSelectedGate(gateId);
    setAiRecs([]);
    setSelectedGateResult(null);
    const result = await ask({
      role:         'staff',
      location:     { gate: gateId },
      eventPhase:   data?.eventPhase || 'pre-match',
      crowdDensity: gate.density,
    });
    if (result) {
      setAiRecs(result.recommendations || []);
      setSelectedGateResult(result);
    }
  }

  const phase    = data?.eventPhase || 'pre-match';
  const phaseConf = PHASE_COLORS[phase] || PHASE_COLORS['pre-match'];
  const gates    = data?.gates    || {};
  const alerts   = data?.activeAlerts || [];
  const openGates = Object.values(gates).filter((g) => g.status !== 'closed').length;
  const critGates = Object.values(gates).filter((g) => g.density >= 85).length;

  return (
    <main className="relative min-h-screen pt-16 pb-8 px-4 md:px-6">
      <div className="stadium-bg" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* ── Page header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 animate-slide-up">
          <div>
            <h1 className="text-2xl font-black gradient-text">{t.staff.title}</h1>
            <p className="text-sm text-slate-400">MetLife Stadium · Real-time operational view</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Phase badge */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold"
              style={{ background: phaseConf.bg, color: phaseConf.color, border: `1px solid ${phaseConf.color}30` }}
              aria-label={`Current event phase: ${phaseConf.label}`}
            >
              {phaseConf.label}
            </div>

            {/* Live dot */}
            <div className="flex items-center gap-2" aria-label="Live data feed">
              <span className="live-dot" aria-hidden="true" />
              <span className="text-xs text-brand-green font-semibold">LIVE</span>
            </div>

            {/* Phase control (demo) */}
            <button
              onClick={advancePhase}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all hover:scale-105"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
              aria-label="Advance event phase for demo"
            >
              ⏭ {t.staff.advancePhase}
            </button>
          </div>
        </div>

        {/* ── Stats row ── */}
        {loading && !data ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => <div key={i} className="glass-card h-24 shimmer" />)}
          </div>
        ) : error ? (
          <div className="mb-6 p-4 rounded-xl text-brand-red text-sm"
               style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
               role="alert">
            ⚠️ {t.common.error}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon="👥" label={t.staff.stats.attendance}
              value={data?.totalAttendance} suffix=""
              color="#3b82f6" bg="rgba(59,130,246,0.1)"
            />
            <StatCard
              icon="🚨" label={t.staff.stats.alerts}
              value={alerts.length} suffix=""
              color={alerts.length > 0 ? '#ef4444' : '#10b981'}
              bg={alerts.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}
            />
            <StatCard
              icon="🚪" label={t.staff.stats.gates}
              value={openGates} suffix="/6"
              color="#10b981" bg="rgba(16,185,129,0.1)"
            />
            <StatCard
              icon="📊" label="Occupancy"
              value={data?.occupancyPercent} suffix="%"
              color={critGates > 0 ? '#ef4444' : '#f59e0b'}
              bg={critGates > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)'}
            />
          </div>
        )}

        {/* ── Main grid: Gates + Sidebar ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Gates grid */}
          <section className="xl:col-span-2" aria-label="Gate status overview">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                {t.staff.gates}
              </h2>
              {critGates > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full animate-pulse"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}
                  role="status"
                  aria-label={`${critGates} gates at critical capacity`}
                >
                  ⚠️ {critGates} critical
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(gates).map(([gateId, gate]) => (
                <GateStatusCard
                  key={gateId}
                  gateId={gateId}
                  gate={gate}
                  onClick={getGateRecommendations}
                />
              ))}
            </div>

            {/* AI Recommendations panel (shown after gate click) */}
            {aiRecs.length > 0 && (
              <div
                className="mt-4 glass-card p-4 animate-slide-up"
                style={{ borderColor: 'rgba(59,130,246,0.3)' }}
                aria-live="polite"
                aria-label={`AI recommendations for Gate ${selectedGate}`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base" aria-hidden="true">🤖</span>
                  <h3 className="text-sm font-bold text-white">
                    {t.staff.assistant} — Gate {selectedGate}
                  </h3>
                  {aiLoading && <span className="live-dot ml-auto" style={{ width: 7, height: 7 }} aria-label="Loading" />}
                </div>
                <ul className="space-y-2">
                  {aiRecs.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-brand-blue mt-0.5 shrink-0" aria-hidden="true">›</span>
                      {rec}
                    </li>
                  ))}
                </ul>

                {/* Expandable details tooltip/accordion */}
                {selectedGateResult && (
                  <div className="mt-3">
                    <details className="text-[11px] text-slate-400 border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/40">
                      <summary className="px-2.5 py-1.5 cursor-pointer font-semibold hover:bg-slate-800/50 hover:text-white transition-all list-none flex items-center gap-1.5 select-none">
                        <span className="text-[9px] transform transition-transform duration-200">▶</span>
                        Why this recommendation?
                      </summary>
                      <div className="px-2.5 py-2 border-t border-slate-800/60 bg-slate-950/20 font-mono text-[10px] text-blue-400">
                        {getRuleExplanation(selectedGateResult, 'staff')}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Sidebar: Alerts */}
          <section className="flex flex-col gap-4">
            <div className="glass-card p-4 flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              <AlertFeed
                alerts={alerts}
                onAcknowledge={acknowledgeAlert}
                label={t.staff.alerts}
              />
            </div>

            {/* Match summary */}
            {data?.match && (
              <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '200ms' }}
                   aria-label="Match summary">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Current Match</p>
                <div className="flex items-center justify-center gap-4 text-2xl">
                  <span role="img" aria-label={data.match.home_team.name}>{data.match.home_team.flag_emoji}</span>
                  <span className="text-sm text-slate-400 font-bold">vs</span>
                  <span role="img" aria-label={data.match.away_team.name}>{data.match.away_team.flag_emoji}</span>
                </div>
                <p className="text-xs text-slate-500 text-center mt-1">
                  {data.match.home_team.name} vs {data.match.away_team.name}
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
