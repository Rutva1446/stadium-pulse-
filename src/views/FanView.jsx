import React, { useState } from 'react';
import { useI18n } from '../context/I18nContext.jsx';
import AssistantPanel from '../components/AssistantPanel.jsx';
import { useLiveData } from '../hooks/useLiveData.js';

function MatchCard({ match, t }) {
  if (!match) return null;
  const kickoff = new Date('2026-07-10T19:00:00-04:00');
  const now     = new Date();
  const minsLeft = Math.max(0, Math.round((kickoff - now) / 60000));

  return (
    <article
      className="glass-card p-5 animate-slide-up"
      aria-label="Current match information"
      style={{ '--delay': '0ms' }}
    >
      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-4">{t.fan.matchInfo}</p>

      {/* Teams vs */}
      <div className="flex items-center justify-center gap-6 mb-4">
        <div className="text-center">
          <span className="text-5xl" role="img" aria-label={match.home_team.name}>{match.home_team.flag_emoji}</span>
          <p className="text-sm font-bold text-white mt-1">{match.home_team.code}</p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div
            className="flex items-center gap-3 px-4 py-2 rounded-xl text-2xl font-black text-white"
            style={{ background: 'rgba(255,255,255,0.06)' }}
            aria-label={`Score: ${match.score.home} - ${match.score.away}`}
          >
            <span>{match.score.home}</span>
            <span className="text-slate-500 text-base">VS</span>
            <span>{match.score.away}</span>
          </div>
          <span className="text-xs text-brand-gold font-bold uppercase">{match.stage}</span>
        </div>

        <div className="text-center">
          <span className="text-5xl" role="img" aria-label={match.away_team.name}>{match.away_team.flag_emoji}</span>
          <p className="text-sm font-bold text-white mt-1">{match.away_team.code}</p>
        </div>
      </div>

      {/* Match details */}
      <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
        <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-xs text-slate-500">{t.fan.kickoff}</span>
          <span className="font-bold text-white">19:00 ET</span>
        </div>
        <div className="flex flex-col gap-0.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-xs text-slate-500">Countdown</span>
          <span className="font-bold text-brand-gold">
            {minsLeft > 0 ? `${minsLeft} min` : '⏱ LIVE'}
          </span>
        </div>
        <div className="col-span-2 flex flex-col gap-0.5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <span className="text-xs text-slate-500">{t.fan.venue}</span>
          <span className="font-bold text-white">{match.venue}</span>
        </div>
      </div>
    </article>
  );
}

function TicketCard({ t, ticket, onChangeTicket }) {
  return (
    <article
      className="glass-card p-5 animate-slide-up"
      style={{ borderColor: 'rgba(59,130,246,0.2)', animationDelay: '100ms' }}
      aria-label="Your ticket information"
    >
      {/* Ticket strip top */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">{t.fan.myTicket}</p>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full font-mono"
            style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            {ticket.id}
          </span>
          <button
            onClick={onChangeTicket}
            className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700 hover:scale-105"
          >
            {t.fan.ticketVerification.changeTicket}
          </button>
        </div>
      </div>

      {/* Seat grid */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { icon: '🏟️', label: t.fan.gate,    value: `Gate ${ticket.gate}` },
          { icon: '📍', label: t.fan.section, value: `Section ${ticket.section}` },
          { icon: '↕️', label: 'Row',          value: `Row ${ticket.row}` },
          { icon: '💺', label: t.fan.seat,     value: `Seat ${ticket.seat}` },
        ].map(({ icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
               style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-xl" aria-hidden="true">{icon}</span>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="font-bold text-white">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashed separator (ticket style) */}
      <div className="my-4 border-dashed border-t border-slate-700" />
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>📶 Scan at Gate {ticket.gate} scanner</span>
        <span>🎫 {ticket.class}</span>
      </div>
    </article>
  );
}

function TicketVerificationForm({ t, onVerifySuccess }) {
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const demoTickets = ['TKT-101', 'TKT-202', 'TKT-303', 'TKT-404', 'TKT-505', 'TKT-VIP'];

  const handleVerify = async (idToVerify) => {
    const id = (idToVerify || ticketId).trim();
    if (!id) return;
    setLoading(true);
    setError('');

    const API_BASE = import.meta.env.VITE_API_URL || '';

    try {
      const res = await fetch(`${API_BASE}/api/tickets/${encodeURIComponent(id)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to verify ticket (HTTP ${res.status})`);
      }
      const ticketData = await res.json();
      onVerifySuccess(ticketData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleVerify();
  };

  return (
    <div className="max-w-md mx-auto my-12 glass-card p-6 md:p-8 animate-slide-up" style={{ '--delay': '100ms' }}>
      <div className="text-center mb-6">
        <span className="text-5xl" role="img" aria-label="Ticket">🎟️</span>
        <h2 className="text-2xl font-black text-white mt-3">{t.fan.ticketVerification.title}</h2>
        <p className="text-sm text-slate-400 mt-2">{t.fan.ticketVerification.sub}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="ticket-id" className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {t.fan.ticketVerification.label}
          </label>
          <input
            id="ticket-id"
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder={t.fan.ticketVerification.placeholder}
            disabled={loading}
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all border border-slate-700 bg-slate-900/50 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoComplete="off"
            required
          />
        </div>

        {error && (
          <div className="p-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 leading-relaxed font-medium">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !ticketId.trim()}
          className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-102 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-blue-500/20 disabled:opacity-40"
        >
          {loading ? t.fan.ticketVerification.verifying : t.fan.ticketVerification.verify}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-800 pt-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          {t.fan.ticketVerification.demoTitle}
        </p>
        <div className="flex flex-wrap gap-2">
          {demoTickets.map((id) => (
            <button
              key={id}
              onClick={() => {
                setTicketId(id);
                handleVerify(id);
              }}
              disabled={loading}
              className="text-xs font-bold px-3 py-1.5 rounded-full hover:scale-105 transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8',
              }}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FanView() {
  const { t } = useI18n();
  const { data } = useLiveData(10000);
  const [ticket, setTicket] = useState(null);

  const match        = data?.match   || null;
  const eventPhase   = data?.eventPhase || 'pre-match';
  const crowdDensity = ticket ? (data?.gates?.[ticket.gate]?.density ?? 50) : 50;

  return (
    <main className="relative min-h-screen pt-16 pb-8 px-4 md:px-6">
      <div className="stadium-bg" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between animate-slide-up">
          <div>
            <h1 className="text-2xl font-black gradient-text">{t.fan.title}</h1>
            <p className="text-sm text-slate-400">
              Welcome to MetLife Stadium · {eventPhase.replace('-', ' ').toUpperCase()}
            </p>
          </div>
          <div
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
            aria-label="Live data active"
          >
            <span className="live-dot" style={{ width: 7, height: 7 }} aria-hidden="true" />
            Live Data
          </div>
        </div>

        {!ticket ? (
          <TicketVerificationForm t={t} onVerifySuccess={setTicket} />
        ) : (
          /* Main grid */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Left column: match + ticket */}
            <div className="flex flex-col gap-4 xl:col-span-1">
              <MatchCard match={match} t={t} />
              <TicketCard t={t} ticket={ticket} onChangeTicket={() => setTicket(null)} />

              {/* Crowd status quick view */}
              <div className="glass-card p-4 animate-slide-up" style={{ animationDelay: '200ms' }}
                   aria-label="Gate crowd status">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Gate Status</p>
                <div className="space-y-2">
                  {data?.gates && Object.entries(data.gates).map(([gateId, gate]) => {
                    const d     = Math.round(gate.density);
                    const color = d >= 85 ? '#ef4444' : d >= 70 ? '#f97316' : d >= 40 ? '#3b82f6' : '#10b981';
                    const isUserGate = gateId === ticket.gate;
                    return (
                      <div key={gateId} className={`flex items-center gap-3 p-1.5 rounded-xl transition-all ${isUserGate ? 'bg-blue-500/10 border border-blue-500/20' : ''}`}>
                        <span className={`text-xs font-bold w-16 ${isUserGate ? 'text-blue-400 font-extrabold' : 'text-slate-400'}`}>
                          Gate {gateId} {isUserGate ? '★' : ''}
                        </span>
                        <div className="flex-1 density-bar-wrap">
                          <div
                            className="density-bar"
                            style={{ width: `${d}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }}
                            role="progressbar"
                            aria-valuenow={d}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Gate ${gateId}: ${d}% density`}
                          />
                        </div>
                        <span className="text-xs font-mono text-right w-10" style={{ color }}>{d}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Assistant chat — spans 2 cols on xl */}
            <div className="lg:col-span-1 xl:col-span-2 flex flex-col" style={{ minHeight: 520 }}>
              <AssistantPanel
                role="fan"
                location={ticket}
                eventPhase={eventPhase}
                crowdDensity={crowdDensity}
              />
            </div>
          </div>
        )}

        {/* Accessibility info bar */}
        <div
          className="mt-4 flex flex-wrap gap-4 px-4 py-3 rounded-xl text-xs text-slate-400 animate-slide-up"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', animationDelay: '300ms' }}
          aria-label="Accessibility information"
        >
          <span>♿ Accessible entry: Gates A, C, E</span>
          <span>🔊 Hearing loop available — ask staff</span>
          <span>📞 Emergency: +1-555-STADIUM</span>
          <span>📶 WiFi: StadiumPulse-Free</span>
        </div>
      </div>
    </main>
  );
}
