import React, { useState, useRef, useEffect } from 'react';
import { useAssistant } from '../hooks/useLiveData.js';
import { useI18n } from '../context/I18nContext.jsx';

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

const TYPING_INDICATOR = (
  <div className="flex items-center gap-1 px-4 py-3" aria-live="polite" aria-label="Assistant is thinking">
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="w-2 h-2 rounded-full bg-blue-400"
        style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
        aria-hidden="true"
      />
    ))}
    <span className="sr-only">Assistant is thinking…</span>
  </div>
);

export default function AssistantPanel({ role, location, eventPhase, crowdDensity, compact = false }) {
  const { t } = useI18n();
  const { ask, loading, error } = useAssistant();

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      from: 'assistant',
      text: role === 'fan'
        ? '👋 Hi! I\'m your StadiumPulse assistant. Ask me anything about your seat, food, transport, or match info!'
        : '🏟️ StadiumPulse AI ready. Ask me for operational guidance or crowd recommendations.',
    },
  ]);
  const [input, setInput]     = useState('');
  const bottomRef             = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text) {
    if (!text?.trim() || loading) return;
    const userText = text.trim().slice(0, 500);
    setInput('');

    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', text: userText }]);

    const result = await ask({ role, location, eventPhase, crowdDensity, query: userText });

    if (result) {
      const replyText = result.qaAnswer
        || (result.recommendations?.length ? result.recommendations.join('\n\n') : 'No specific guidance at this time.');
      setMessages((prev) => [
        ...prev,
        {
          id:        Date.now() + 1,
          from:      'assistant',
          text:      replyText,
          alertLevel: result.alertLevel,
          result:    result,
        },
      ]);
    } else {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'assistant', text: 'Sorry, the request could not be processed.', alertLevel: 'warning' },
      ]);
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const quickActions = Object.values(t.fan.qa || {});

  return (
    <section
      className="glass-card flex flex-col overflow-hidden"
      style={{ height: compact ? '100%' : '520px' }}
      aria-label="AI Assistant Panel"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-2"
           style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-lg" aria-hidden="true">🤖</span>
        <div>
          <h2 className="text-sm font-bold text-white">{t.fan.assistant}</h2>
          <p className="text-xs text-slate-500">Powered by StadiumPulse AI</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5" aria-hidden="true">
          <span className="live-dot" style={{ width: 7, height: 7 }} />
          <span className="text-xs text-brand-green font-medium">Online</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" role="log" aria-live="polite" aria-label="Chat messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-start max-w-[80%]">
              {msg.from === 'assistant' && (
                <span className="text-base mr-2 mt-1 shrink-0" aria-hidden="true">🤖</span>
              )}
              <div
                className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line"
                style={
                  msg.from === 'user'
                    ? {
                        background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
                        color: '#fff',
                        borderBottomRightRadius: 4,
                      }
                    : {
                        background: msg.alertLevel === 'critical'
                          ? 'rgba(239,68,68,0.1)'
                          : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${
                          msg.alertLevel === 'critical' ? 'rgba(239,68,68,0.3)'
                          : msg.alertLevel === 'warning' ? 'rgba(245,158,11,0.3)'
                          : 'var(--border)'
                        }`,
                        color: 'var(--text-primary)',
                        borderBottomLeftRadius: 4,
                      }
                }
              >
                {msg.text}
              </div>
            </div>
            {msg.from === 'assistant' && msg.result && (
              <div className="ml-8 mt-1.5 w-full max-w-[80%]">
                <details className="text-[11px] text-slate-400 border border-slate-700/50 rounded-lg overflow-hidden bg-slate-900/40">
                  <summary className="px-2.5 py-1 cursor-pointer font-semibold hover:bg-slate-800/50 hover:text-white transition-all list-none flex items-center gap-1.5 select-none">
                    <span className="text-[9px] transform transition-transform duration-200">▶</span>
                    Why this recommendation?
                  </summary>
                  <div className="px-2.5 py-1.5 border-t border-slate-800/60 bg-slate-950/20 font-mono text-[10px] text-blue-400">
                    {getRuleExplanation(msg.result, role)}
                  </div>
                </details>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <span className="text-base mr-2" aria-hidden="true">🤖</span>
            {TYPING_INDICATOR}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick action chips — only for fan role */}
      {role === 'fan' && quickActions.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {quickActions.map((qa) => (
            <button
              key={qa}
              onClick={() => sendMessage(qa)}
              disabled={loading}
              aria-label={`Quick question: ${qa}`}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:scale-105"
              style={{
                background:  'rgba(59,130,246,0.1)',
                border:      '1px solid rgba(59,130,246,0.25)',
                color:       '#93c5fd',
              }}
            >
              {qa}
            </button>
          ))}
        </div>
      )}

      {/* Inline error text */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-400 border-t border-red-500/10" style={{ background: 'rgba(239, 68, 68, 0.05)' }} role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 px-4 pb-4 pt-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <label htmlFor="assistant-input" className="sr-only">{t.fan.placeholder}</label>
        <div className="relative flex-1">
          <input
            id="assistant-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 500))}
            placeholder={t.fan.placeholder}
            maxLength={500}
            disabled={loading}
            autoComplete="off"
            className="w-full rounded-xl pl-4 pr-16 py-2.5 text-sm outline-none transition-all"
            style={{
              background:   'rgba(255,255,255,0.06)',
              border:       '1px solid var(--border)',
              color:        'var(--text-primary)',
            }}
            aria-label={t.fan.placeholder}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono pointer-events-none">
            {input.length}/500
          </span>
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label={t.fan.send}
          className="px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            color:      '#fff',
          }}
        >
          {loading ? '…' : '↑'}
        </button>
      </form>
    </section>
  );
}
