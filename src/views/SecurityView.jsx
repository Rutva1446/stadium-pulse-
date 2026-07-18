import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import { useApp } from '../context/AppContext.jsx';
import { useLiveData, useIncident } from '../hooks/useLiveData.js';
import AlertFeed from '../components/AlertFeed.jsx';
import CrowdGauge from '../components/CrowdGauge.jsx';

function getRuleExplanation(res, role) {
  if (!res) return '';
  
  const guidance = res.guidance || res;
  const incident = res.incident || guidance.incident;
  
  if (guidance.source === 'incident' || incident) {
    const severity = guidance.alertLevel || 'critical';
    const type = incident?.type || 'active incident';
    return `Triggered by: Incident Rules → ${type} incident (${severity})`;
  }
  
  if (role === 'fan' && guidance.qaAnswer) {
    if (guidance.qaAnswer.startsWith("I'm not sure about that")) {
      return 'Triggered by: Fan Q&A → Default Fallback';
    }
    return 'Triggered by: Fan Q&A → Keyword Match rule';
  }
  
  if (guidance.densityLevel) {
    return `Triggered by: Density Classification → ${guidance.densityLevel} → Role×Phase rule`;
  }
  
  return 'Triggered by: Default Fallback rule';
}

const INCIDENT_TYPES = [
  'medical', 'fire', 'fight', 'suspicious', 'lost_child',
  'structural', 'crowd_crush', 'power_outage',
];
const GATES = ['A', 'B', 'C', 'D', 'E', 'VIP'];

const SEVERITY_CONFIG = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.35)'  },
  high:     { color: '#f97316', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)'  },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' },
  normal:   { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)' },
};

export default function SecurityView() {
  const { t } = useI18n();
  const { addNotification } = useApp();
  const { data } = useLiveData(10000);
  const { result, loading, error, report } = useIncident();

  const [form, setForm] = useState({
    type: '',
    gate: '',
    section: '',
    description: '',
    reportedBy: '',
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value.slice(0, name === 'description' ? 1000 : 100) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.type || !form.gate) {
      addNotification('Incident type and gate are required', 'warning');
      return;
    }
    const res = await report({
      type:        form.type,
      description: form.description,
      location:    { gate: form.gate, section: form.section },
      reportedBy:  form.reportedBy,
    });
    if (res) {
      addNotification(`Incident ${res.incident.id} logged — AI guidance ready`, 'info');
    }
  }

  const gates     = data?.gates    || {};
  const alerts    = data?.activeAlerts || [];
  const guidance  = result?.guidance;
  const incidentId = result?.incident?.id;

  const sevCfg = SEVERITY_CONFIG[guidance?.alertLevel] || SEVERITY_CONFIG.normal;

  const inputStyle = {
    background:  'rgba(255,255,255,0.05)',
    border:      '1px solid rgba(255,255,255,0.1)',
    color:       'var(--text-primary)',
    borderRadius: 10,
    padding:     '10px 14px',
    fontSize:    14,
    width:       '100%',
    outline:     'none',
    transition:  'border-color 0.2s',
  };

  return (
    <main className="relative min-h-screen pt-16 pb-8 px-4 md:px-6">
      <div className="stadium-bg" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-6 animate-slide-up">
          <h1 className="text-2xl font-black" style={{ color: '#ef4444' }}>
            🛡️ {t.security.title}
          </h1>
          <p className="text-sm text-slate-400">Incident management & emergency response · MetLife Stadium</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* ── Left: Incident Report Form ── */}
          <section className="xl:col-span-1" aria-label="Report an incident">
            <div className="glass-card p-5" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
              <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">
                🚨 {t.security.reportTitle}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Incident type */}
                <div>
                  <label htmlFor="incident-type" className="block text-xs text-slate-400 font-semibold mb-1.5">
                    {t.security.incidentType} *
                  </label>
                  <select
                    id="incident-type"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                    style={inputStyle}
                    aria-required="true"
                  >
                    <option value="">Select type…</option>
                    {INCIDENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {t.security.incidentTypes[type] || type}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Gate / Zone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="incident-gate" className="block text-xs text-slate-400 font-semibold mb-1.5">
                      {t.security.gate} *
                    </label>
                    <select
                      id="incident-gate"
                      name="gate"
                      value={form.gate}
                      onChange={handleChange}
                      required
                      style={inputStyle}
                      aria-required="true"
                    >
                      <option value="">Gate…</option>
                      {GATES.map((g) => <option key={g} value={g}>Gate {g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="incident-section" className="block text-xs text-slate-400 font-semibold mb-1.5">
                      {t.security.section}
                    </label>
                    <input
                      id="incident-section"
                      name="section"
                      type="text"
                      value={form.section}
                      onChange={handleChange}
                      placeholder="e.g. 204"
                      maxLength={20}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label htmlFor="incident-desc" className="block text-xs text-slate-400 font-semibold">
                      {t.security.description}
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {form.description.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="incident-desc"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder={t.security.descPlaceholder}
                    maxLength={1000}
                    rows={3}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    aria-label={t.security.description}
                  />
                </div>

                {/* Reported by */}
                <div>
                  <label htmlFor="incident-reporter" className="block text-xs text-slate-400 font-semibold mb-1.5">
                    {t.security.reportedBy}
                  </label>
                  <input
                    id="incident-reporter"
                    name="reportedBy"
                    type="text"
                    value={form.reportedBy}
                    onChange={handleChange}
                    placeholder="Unit ID / Name"
                    maxLength={50}
                    style={inputStyle}
                  />
                </div>

                {/* Validation error */}
                {error && (
                  <p className="text-xs text-brand-red" role="alert">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !form.type || !form.gate}
                  aria-label={t.security.submit}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #7f1d1d, #ef4444)',
                    color: '#fff',
                    boxShadow: loading ? 'none' : '0 4px 20px rgba(239,68,68,0.3)',
                  }}
                >
                  {loading ? `⏳ ${t.security.submitting}` : `🚨 ${t.security.submit}`}
                </button>
              </form>
            </div>
          </section>

          {/* ── Center: AI Guidance + Zone Status ── */}
          <section className="xl:col-span-1 flex flex-col gap-4" aria-label="AI response guidance">

            {/* AI Response */}
            <div
              className="glass-card p-5 flex-1"
              style={{
                borderColor: guidance ? sevCfg.border : 'var(--border)',
                ...(guidance?.alertLevel === 'critical' ? { animation: 'glow-critical 2s ease-in-out infinite' } : {}),
              }}
              aria-live="polite"
              aria-label={guidance ? 'AI incident guidance' : 'Awaiting incident report'}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl" aria-hidden="true">🤖</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">{t.security.guidance}</h2>
                {incidentId && (
                  <span className="ml-auto text-xs font-mono text-slate-500">{incidentId}</span>
                )}
              </div>

              {!guidance && !loading && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500">
                  <span className="text-4xl mb-3" aria-hidden="true">🛡️</span>
                  <p className="text-sm">Submit an incident report to receive AI-generated response guidance.</p>
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-brand-red border-t-transparent"
                       style={{ animation: 'spin 0.8s linear infinite' }}
                       role="status" aria-label="Loading guidance" />
                  <p className="text-sm text-slate-400">Analysing incident…</p>
                </div>
              )}

              {guidance && !loading && (
                <div>
                  {/* Alert level badge */}
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4 uppercase"
                    style={{ background: sevCfg.bg, color: sevCfg.color, border: `1px solid ${sevCfg.border}` }}
                    role="status"
                    aria-label={`Alert level: ${guidance.alertLevel}`}
                  >
                    <span aria-hidden="true">
                      {guidance.alertLevel === 'critical' ? '🔴' : 
                       (guidance.alertLevel === 'high' || guidance.alertLevel === 'warning') ? '🟠' : 
                       guidance.alertLevel === 'normal' ? '🟢' : '🟡'}
                    </span>
                    {guidance.alertLevel?.toUpperCase()} STATUS
                  </div>

                  {/* Recommendations */}
                  <ul className="space-y-3">
                    {guidance.recommendations?.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-xl"
                          style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                          style={{ background: sevCfg.bg, color: sevCfg.color }}
                          aria-hidden="true"
                        >
                          {i + 1}
                        </span>
                        <p className="text-sm text-slate-200 leading-snug">{rec}</p>
                      </li>
                    ))}
                  </ul>

                  {/* Expandable details tooltip/accordion */}
                  <div className="mt-3">
                    <details className="text-[11px] text-slate-400 border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/40">
                      <summary className="px-2.5 py-1.5 cursor-pointer font-semibold hover:bg-slate-800/50 hover:text-white transition-all list-none flex items-center gap-1.5 select-none">
                        <span className="text-[9px] transform transition-transform duration-200">▶</span>
                        Why this recommendation?
                      </summary>
                      <div className="px-2.5 py-2 border-t border-slate-800/60 bg-slate-950/20 font-mono text-[10px] text-blue-400">
                        {getRuleExplanation(result, 'security')}
                      </div>
                    </details>
                  </div>

                  {/* Actions */}
                  {guidance.actions?.length > 0 && (
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Actions Triggered</p>
                      {guidance.actions.map((action, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                          <span className="text-brand-blue" aria-hidden="true">▸</span>
                          <span><strong>{action.type?.toUpperCase()}</strong> → {action.target || action.team || action.message || ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Right: Zone Status + Alerts ── */}
          <section className="flex flex-col gap-4" aria-label="Zone status and active alerts">

            {/* Zone status gauges */}
            <div className="glass-card p-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">{t.security.zoneStatus}</h2>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(gates).map(([gateId, gate]) => {
                  const d = Math.round(gate.density);
                  return (
                    <div key={gateId} className="flex flex-col items-center gap-1">
                      <CrowdGauge value={d} size={72} label={`Gate ${gateId}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alerts */}
            <div className="glass-card p-4 flex-1 overflow-y-auto" style={{ maxHeight: 380 }}>
              <AlertFeed alerts={alerts} label={`${t.common.incident} Feed`} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
