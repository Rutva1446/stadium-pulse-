'use strict';

/**
 * engine.test.js — Unit tests for the StadiumPulse Decision Engine
 *
 * Run: npm test (from /backend directory)
 *
 * Coverage targets:
 *   - classifyDensity()    all four tiers
 *   - recommend()          fan / staff / security × all density levels
 *   - Fan Q&A              matched + unmatched queries
 *   - Incident handling    medical, fire (evacuation)
 *   - Input validation     invalid role, out-of-range density, missing fields
 */

const {
  recommend,
  classifyDensity,
  matchFanQuery,
  DENSITY_THRESHOLDS,
} = require('../src/assistant/engine');

// ─────────────────────────── classifyDensity ─────────────────────────────────

describe('classifyDensity()', () => {
  test('returns "low" for density 0', () => {
    expect(classifyDensity(0)).toBe('low');
  });
  test('returns "low" for density just below LOW threshold', () => {
    expect(classifyDensity(DENSITY_THRESHOLDS.LOW - 1)).toBe('low');
  });
  test('returns "medium" at LOW threshold', () => {
    expect(classifyDensity(DENSITY_THRESHOLDS.LOW)).toBe('medium');
  });
  test('returns "medium" just below MEDIUM threshold', () => {
    expect(classifyDensity(DENSITY_THRESHOLDS.MEDIUM - 1)).toBe('medium');
  });
  test('returns "high" at MEDIUM threshold', () => {
    expect(classifyDensity(DENSITY_THRESHOLDS.MEDIUM)).toBe('high');
  });
  test('returns "high" just below HIGH threshold', () => {
    expect(classifyDensity(DENSITY_THRESHOLDS.HIGH - 1)).toBe('high');
  });
  test('returns "critical" at HIGH threshold', () => {
    expect(classifyDensity(DENSITY_THRESHOLDS.HIGH)).toBe('critical');
  });
  test('returns "critical" at maximum (100)', () => {
    expect(classifyDensity(100)).toBe('critical');
  });
});

// ─────────────────────────── Fan — pre-match ─────────────────────────────────

describe('recommend() — fan / pre-match', () => {
  const base = { role: 'fan', eventPhase: 'pre-match', location: { gate: 'A', section: '112' } };

  test('low density → alertLevel "normal", recommendations include gate clearance', () => {
    const result = recommend({ ...base, crowdDensity: 20 });
    expect(result.alertLevel).toBe('normal');
    expect(result.densityLevel).toBe('low');
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendations[0]).toMatch(/clear|proceed/i);
  });

  test('medium density → alertLevel "normal", mentions queue time', () => {
    const result = recommend({ ...base, crowdDensity: 55 });
    expect(result.alertLevel).toBe('normal');
    expect(result.densityLevel).toBe('medium');
    expect(result.recommendations.some((r) => /queue|allow|min/i.test(r))).toBe(true);
  });

  test('high density → alertLevel "warning", mentions alternate gate', () => {
    const result = recommend({ ...base, crowdDensity: 77 });
    expect(result.alertLevel).toBe('warning');
    expect(result.densityLevel).toBe('high');
    expect(result.recommendations.some((r) => /alternate|Gate B|Gate C/i.test(r))).toBe(true);
  });

  test('critical density → alertLevel "critical", gate redirected', () => {
    const result = recommend({ ...base, crowdDensity: 92 });
    expect(result.alertLevel).toBe('critical');
    expect(result.densityLevel).toBe('critical');
    expect(result.recommendations[0]).toMatch(/capacity|critical|alternate|Gate B/i);
  });
});

// ─────────────────────────── Fan — Q&A ───────────────────────────────────────

describe('recommend() — fan Q&A', () => {
  const base = {
    role: 'fan', eventPhase: 'live', crowdDensity: 55,
    location: { gate: 'C', section: '305' },
  };

  test('"Where is my seat?" returns section/gate info', () => {
    const r = recommend({ ...base, query: 'Where is my seat?' });
    expect(r.qaAnswer).toMatch(/section|gate|seat/i);
  });

  test('"Where is the restroom?" returns concourse guidance', () => {
    const r = recommend({ ...base, query: 'Where is the nearest restroom?' });
    expect(r.qaAnswer).toMatch(/restroom|concourse/i);
  });

  test('"When does the match start?" returns kickoff time', () => {
    const r = recommend({ ...base, query: 'When does the match start?' });
    expect(r.qaAnswer).toMatch(/kickoff|19:00|18:30/i);
  });

  test('"Where can I get food?" returns concession info', () => {
    const r = recommend({ ...base, query: 'Where can I get food?' });
    expect(r.qaAnswer).toMatch(/concession|level|food/i);
  });

  test('Unrecognised query returns helpful fallback', () => {
    const r = recommend({ ...base, query: 'What is the meaning of life?' });
    expect(r.qaAnswer).toMatch(/staff|guest services/i);
  });

  test('Empty query → qaAnswer is null', () => {
    const r = recommend({ ...base, query: '' });
    expect(r.qaAnswer).toBeNull();
  });

  test('No query field → qaAnswer is null', () => {
    const r = recommend({ ...base });
    expect(r.qaAnswer).toBeNull();
  });
});

// ─────────────────────────── Staff recommendations ───────────────────────────

describe('recommend() — staff / pre-match', () => {
  const base = { role: 'staff', eventPhase: 'pre-match', location: { gate: 'A' } };

  test('high density → recommends opening overflow lanes', () => {
    const result = recommend({ ...base, crowdDensity: 78 });
    expect(result.alertLevel).toBe('warning');
    expect(result.recommendations.some((r) => /overflow|lane|staff/i.test(r))).toBe(true);
  });

  test('critical density → generates critical action and notifies command center', () => {
    const result = recommend({ ...base, crowdDensity: 90 });
    expect(result.alertLevel).toBe('critical');
    expect(result.actions.some((a) => a.priority === 'critical')).toBe(true);
    expect(result.actions.some((a) => a.target === 'command_center')).toBe(true);
  });

  test('low density → no critical actions generated', () => {
    const result = recommend({ ...base, crowdDensity: 20 });
    expect(result.alertLevel).toBe('normal');
    expect(result.actions.length).toBe(0);
  });
});

// ─────────────────────────── Security — incidents ────────────────────────────

describe('recommend() — security / incidents', () => {
  const base = {
    role: 'security', eventPhase: 'live', crowdDensity: 65,
    location: { gate: 'C', section: '204', nearestExit: 'Exit E3 (South)' },
  };

  test('medical incident → severity "high", dispatch medical team', () => {
    const r = recommend({ ...base, incident: { type: 'medical', description: 'Fan collapsed' } });
    expect(r.source).toBe('incident');
    expect(r.alertLevel).toBe('high');
    expect(r.recommendations.some((rec) => /dispatch|medical|first.?aid|AED/i.test(rec))).toBe(true);
  });

  test('fire incident → severity "critical", evacuation recommended', () => {
    const r = recommend({ ...base, incident: { type: 'fire', description: 'Smoke in concourse' } });
    expect(r.alertLevel).toBe('critical');
    expect(r.recommendations.some((rec) => /EVACUATE|evacuation/i.test(rec))).toBe(true);
    expect(r.actions.some((a) => a.type === 'broadcast')).toBe(true);
  });

  test('crowd_crush incident → evacuation protocol', () => {
    const r = recommend({ ...base, incident: { type: 'crowd_crush', description: 'Crush at Gate C' } });
    expect(r.alertLevel).toBe('critical');
    expect(r.recommendations[0]).toMatch(/EVACUATE/i);
  });

  test('lost_child incident → security response, no evacuation', () => {
    const r = recommend({ ...base, incident: { type: 'lost_child', description: 'Child separated from parent' } });
    expect(r.alertLevel).toBe('high');
    expect(r.actions.every((a) => a.type !== 'broadcast')).toBe(true);
  });
});

// ─────────────────────────── Input validation ────────────────────────────────

describe('recommend() — input validation / edge cases', () => {
  test('unknown role defaults to fan behaviour without crashing', () => {
    const r = recommend({ role: 'administrator', eventPhase: 'live', crowdDensity: 50 });
    expect(r).toBeDefined();
    expect(r.densityLevel).toBe('medium');
  });

  test('density > 100 is clamped to critical', () => {
    const r = recommend({ role: 'fan', eventPhase: 'live', crowdDensity: 999 });
    expect(r.densityLevel).toBe('critical');
  });

  test('density < 0 is clamped to low', () => {
    const r = recommend({ role: 'fan', eventPhase: 'live', crowdDensity: -100 });
    expect(r.densityLevel).toBe('low');
  });

  test('missing location does not throw', () => {
    expect(() => recommend({ role: 'staff', eventPhase: 'pre-match', crowdDensity: 60 })).not.toThrow();
  });

  test('missing eventPhase defaults gracefully', () => {
    const r = recommend({ role: 'fan', crowdDensity: 50 });
    expect(r).toBeDefined();
    expect(Array.isArray(r.recommendations)).toBe(true);
  });

  test('returns source="rules" for non-incident calls', () => {
    const r = recommend({ role: 'staff', eventPhase: 'live', crowdDensity: 60 });
    expect(r.source).toBe('rules');
  });

  test('returns source="incident" for incident calls', () => {
    const r = recommend({
      role: 'security', eventPhase: 'live', crowdDensity: 60,
      incident: { type: 'fight', description: 'Altercation in stands' },
    });
    expect(r.source).toBe('incident');
  });
});
