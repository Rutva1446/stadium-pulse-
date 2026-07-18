import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useI18n } from '../context/I18nContext.jsx';

const ROLES = [
  {
    id: 'fan',
    emoji: '🎟️',
    gradient: 'from-blue-600 to-indigo-700',
    glow: 'rgba(59,130,246,0.35)',
    borderActive: 'rgba(59,130,246,0.5)',
    accent: '#3b82f6',
  },
  {
    id: 'staff',
    emoji: '🏟️',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.35)',
    borderActive: 'rgba(245,158,11,0.5)',
    accent: '#f59e0b',
  },
  {
    id: 'security',
    emoji: '🛡️',
    gradient: 'from-red-600 to-rose-700',
    glow: 'rgba(239,68,68,0.35)',
    borderActive: 'rgba(239,68,68,0.5)',
    accent: '#ef4444',
  },
];

// Animated floating orb
function Orb({ style }) {
  return (
    <div
      className="absolute rounded-full blur-3xl opacity-20 pointer-events-none"
      style={{ animation: 'float 6s ease-in-out infinite', ...style }}
      aria-hidden="true"
    />
  );
}

// Particle dots
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width:  `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            left:   `${Math.random() * 100}%`,
            top:    `${Math.random() * 100}%`,
            background: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#f59e0b' : '#8b5cf6',
            opacity: Math.random() * 0.4 + 0.1,
            animation: `float ${4 + Math.random() * 6}s ease-in-out ${Math.random() * 4}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Stadium SVG silhouette
function StadiumSVG() {
  return (
    <svg
      viewBox="0 0 280 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-sm mx-auto animate-float"
      style={{ filter: 'drop-shadow(0 0 30px rgba(59,130,246,0.3))' }}
      aria-hidden="true"
    >
      {/* Outer stadium ring */}
      <ellipse cx="140" cy="80" rx="130" ry="72" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.5" fill="none"/>
      {/* Stadium walls */}
      <ellipse cx="140" cy="80" rx="110" ry="60" fill="rgba(30,58,138,0.08)" stroke="#3b82f6" strokeWidth="1" strokeOpacity="0.3"/>
      {/* Inner bowl */}
      <ellipse cx="140" cy="80" rx="85" ry="47" fill="rgba(59,130,246,0.05)" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.4"/>
      {/* Field */}
      <ellipse cx="140" cy="80" rx="62" ry="35" fill="rgba(16,185,129,0.12)" stroke="#10b981" strokeWidth="1.5" strokeOpacity="0.5"/>
      {/* Center line */}
      <line x1="140" y1="45" x2="140" y2="115" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      {/* Center circle */}
      <circle cx="140" cy="80" r="14" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
      {/* Goals */}
      <rect x="130" y="45" width="20" height="6" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
      <rect x="130" y="109" width="20" height="6" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1" fill="none"/>
      {/* Seating sections (arcs) */}
      {[95, 100, 105, 110].map((r, i) => (
        <ellipse key={i} cx="140" cy="80" rx={r} ry={r * 0.55}
          fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4"/>
      ))}
      {/* Light towers */}
      <line x1="30"  y1="15" x2="50"  y2="50" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5"/>
      <line x1="250" y1="15" x2="230" y2="50" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5"/>
      <circle cx="28"  cy="13" r="4" fill="#f59e0b" opacity="0.7"/>
      <circle cx="252" cy="13" r="4" fill="#f59e0b" opacity="0.7"/>
      {/* Pulse rings on lights */}
      <circle cx="28"  cy="13" r="8"  fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.3" style={{animation:'pulse-ring 2s ease-out infinite'}}/>
      <circle cx="252" cy="13" r="8"  fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.3" style={{animation:'pulse-ring 2s ease-out 0.5s infinite'}}/>
    </svg>
  );
}

export default function LandingView() {
  const { setRole } = useApp();
  const { t } = useI18n();
  const [hovered, setHovered] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background effects */}
      <div className="stadium-bg" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />
      <Particles />
      <Orb style={{ width: 500, height: 500, top: '-20%', left: '-10%', background: '#3b82f6' }} />
      <Orb style={{ width: 400, height: 400, bottom: '-15%', right: '-8%',  background: '#8b5cf6', animationDelay: '2s' }} />
      <Orb style={{ width: 300, height: 300, top: '60%',   left: '40%',    background: '#f59e0b', animationDelay: '1s' }} />

      <div
        className="relative z-10 w-full max-w-5xl flex flex-col items-center gap-10"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)', transition: 'all 0.7s ease-out' }}
      >
        {/* Badge */}
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
          style={{
            background: 'rgba(245,158,11,0.1)',
            border:     '1px solid rgba(245,158,11,0.3)',
            color:      '#f59e0b',
          }}
        >
          <span aria-hidden="true">⚽</span>
          <span>{t.landing.badge}</span>
        </div>

        {/* Stadium illustration */}
        <div className="w-full max-w-xs">
          <StadiumSVG />
        </div>

        {/* Hero text */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight gradient-text leading-none">
            Stadium<span className="text-white">Pulse</span>
          </h1>
          <p className="text-2xl md:text-3xl font-bold text-white/90">{t.landing.hero}</p>
          <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            {t.landing.sub}
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-6 md:gap-10 text-center">
          {[
            { val: '82,500', label: 'Capacity' },
            { val: '6',      label: 'Gates Monitored' },
            { val: 'Live',   label: 'Data Updates' },
            { val: 'AI',     label: 'Decision Engine' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-xl md:text-2xl font-black gradient-text-blue">{stat.val}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Role selection */}
        <div className="w-full">
          <p className="text-center text-slate-400 text-sm font-semibold uppercase tracking-widest mb-6">
            {t.landing.selectRole}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLES.map((r, idx) => {
              const info = t.landing[r.id];
              return (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  onMouseEnter={() => setHovered(r.id)}
                  onMouseLeave={() => setHovered(null)}
                  aria-label={`Enter as ${info.title}`}
                  className="relative group flex flex-col items-center gap-5 p-6 rounded-2xl text-left transition-all duration-300"
                  style={{
                    background:   hovered === r.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    border:       `1px solid ${hovered === r.id ? r.borderActive : 'rgba(255,255,255,0.07)'}`,
                    boxShadow:    hovered === r.id ? `0 0 40px ${r.glow}` : 'none',
                    transform:    hovered === r.id ? 'translateY(-6px) scale(1.02)' : 'none',
                    animationDelay: `${idx * 100}ms`,
                  }}
                >
                  {/* Gradient glow badge */}
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${r.gradient} flex items-center justify-center text-4xl transition-transform duration-300`}
                    style={{
                      boxShadow: hovered === r.id ? `0 10px 30px ${r.glow}` : `0 4px 15px ${r.glow}50`,
                      transform: hovered === r.id ? 'scale(1.1) rotate(-3deg)' : 'none',
                    }}
                    aria-hidden="true"
                  >
                    {r.emoji}
                  </div>

                  <div className="text-center">
                    <h2 className="text-xl font-bold text-white mb-1">{info.title}</h2>
                    <p className="text-sm text-slate-400 leading-snug">{info.desc}</p>
                  </div>

                  <span
                    className="w-full text-center py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                    style={{
                      background: hovered === r.id
                        ? `linear-gradient(135deg, ${r.accent}cc, ${r.accent})`
                        : 'rgba(255,255,255,0.06)',
                      color: hovered === r.id ? '#fff' : r.accent,
                      border: `1px solid ${hovered === r.id ? 'transparent' : r.borderActive}`,
                    }}
                  >
                    {info.cta} →
                  </span>

                  {/* Corner shine on hover */}
                  {hovered === r.id && (
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-tr-2xl opacity-10 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at top right, ${r.accent}, transparent 70%)`,
                      }}
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-600 text-center">
          🏆 MetLife Stadium · East Rutherford, NJ · FIFA World Cup 2026 Semi-Final
        </p>
      </div>
    </main>
  );
}
