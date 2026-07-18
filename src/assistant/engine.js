'use strict';

/**
 * StadiumPulse Decision Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Core rules engine that maps operational context → actionable recommendations.
 *
 * Design philosophy:
 *   Pure function — all inputs passed via `context`, no side effects.
 *   This makes every decision fully unit-testable and auditable.
 *
 * Rule layers (evaluated in priority order):
 *   1. INCIDENT RULES     — Security incidents override all other rules
 *   2. CRITICAL DENSITY   — Crowd ≥ 85% triggers emergency-mode guidance
 *   3. ROLE × PHASE       — Tailored guidance per role + event phase combo
 *   4. DENSITY ADVISORY   — Supplemental crowd management advisories
 *   5. FAN Q&A            — Keyword-matched answers to common fan questions
 *   6. DEFAULT            — Fallback if no specific rule fires
 *
 * @module engine
 */

// ─────────────────────────── DENSITY THRESHOLDS ──────────────────────────────

const DENSITY_THRESHOLDS = {
  LOW: 40,      // < 40  → calm, open flow
  MEDIUM: 70,   // 40–69 → normal operations
  HIGH: 85,     // 70–84 → heightened monitoring
  // ≥ 85      → critical — emergency protocols
};

/**
 * Classifies a numeric density (0–100) into a named tier.
 * @param {number} value - Crowd density 0–100
 * @returns {'low'|'medium'|'high'|'critical'}
 */
function classifyDensity(value) {
  if (value < DENSITY_THRESHOLDS.LOW)    return 'low';
  if (value < DENSITY_THRESHOLDS.MEDIUM) return 'medium';
  if (value < DENSITY_THRESHOLDS.HIGH)   return 'high';
  return 'critical';
}

// ─────────────────────────── INCIDENT RULES ──────────────────────────────────

/** Maps incident type → severity + required response category */
const INCIDENT_CATALOG = {
  medical:      { severity: 'high',     response: 'medical',     evacuate: false },
  fire:         { severity: 'critical', response: 'evacuation',  evacuate: true  },
  fight:        { severity: 'high',     response: 'security',    evacuate: false },
  suspicious:   { severity: 'medium',   response: 'security',    evacuate: false },
  lost_child:   { severity: 'high',     response: 'security',    evacuate: false },
  structural:   { severity: 'critical', response: 'evacuation',  evacuate: true  },
  crowd_crush:  { severity: 'critical', response: 'evacuation',  evacuate: true  },
  power_outage: { severity: 'high',     response: 'operations',  evacuate: false },
};

/**
 * Generates incident-specific guidance (Layer 1).
 * @param {Object} incident - { type, description }
 * @param {Object} location - { gate, section, nearestExit }
 * @returns {Object} Incident response guidance
 */
function handleIncident(incident, location) {
  const catalog = INCIDENT_CATALOG[incident.type] || {
    severity: 'medium', response: 'security', evacuate: false,
  };
  const gate       = location.gate        || 'your zone';
  const exitRoute  = location.nearestExit || 'Exit E1 (North) or Exit E3 (South)';
  const isEvac     = catalog.evacuate;

  const recommendations = [
    isEvac
      ? `🚨 EVACUATE: Initiate evacuation protocol for ${gate}. Direct crowd calmly to nearest exits.`
      : `⚠️ INCIDENT at ${gate}: Dispatch ${catalog.response} team immediately.`,
    `Nearest emergency exit: ${exitRoute}`,
    `Notify Command Center via radio — channel ${isEvac ? '🔴 ALPHA (emergency)' : '🟡 BRAVO (ops)'}`,
    isEvac
      ? `Activate PA system: broadcast calm evacuation instructions in EN + ES`
      : `Document incident ID for after-action review and hand-off`,
    catalog.response === 'medical'
      ? `AED units located at Gates A and C. First Aid at Section 100 field-level.`
      : `Coordinate with police liaison if crowd control equipment is required`,
  ];

  const actions = [
    { type: 'notify',    target: 'command_center', message: `Incident: ${incident.type} at ${gate}` },
    { type: 'alert',     target: 'nearby_staff',   zone: gate, priority: catalog.severity },
    isEvac
      ? { type: 'broadcast', message: 'Emergency evacuation in progress. Please follow staff instructions calmly.' }
      : { type: 'dispatch',  team: catalog.response, location: gate },
  ].filter(Boolean);

  return { alertLevel: catalog.severity, recommendations, actions };
}

// ─────────────────────────── FAN Q&A PATTERNS ────────────────────────────────

/**
 * Q&A patterns: each pattern has keyword regexes + an answer factory.
 * Answer factories receive context so they can personalise with gate/section info.
 */
const QA_PATTERNS = [
  {
    keywords: [/seat/i, /section/i, /where.*sit/i, /find.*seat/i, /my seat/i],
    answer: (ctx) =>
      `Your seat is in Section ${ctx.location?.section || '112'}, accessible via ` +
      `${ctx.location?.gate || 'Gate A'}. Look for ushers in orange vests near the portal. ` +
      `Odd row numbers are on the left side of each section; even rows on the right.`,
  },
  {
    keywords: [/restroom/i, /bathroom/i, /toilet/i, /\bloo\b/i, /\bwc\b/i],
    answer: (ctx) =>
      `Nearest restrooms to ${ctx.location?.gate ? `Gate ${ctx.location.gate}` : 'your area'}: ` +
      `Head down the main concourse — restrooms appear every 50 m on both sides. ` +
      `Accessible (wheelchair-friendly) restrooms are marked with a blue ♿ icon.`,
  },
  {
    keywords: [/food/i, /eat/i, /drink/i, /concession/i, /beer/i, /snack/i, /hungry/i, /thirsty/i],
    answer: (ctx) =>
      `Concessions near ${ctx.location?.gate ? `Gate ${ctx.location.gate}` : 'your section'}: ` +
      `Level 1 has fast-food kiosks; Level 2 has full meal stations. ` +
      `Halal 🌙 and vegetarian 🌿 options are available at stands with coloured banners. ` +
      `Longest queues are typically 10–15 min during half-time — visit during live play for shorter waits.`,
  },
  {
    keywords: [/kickoff/i, /kick.?off/i, /\bstart\b/i, /when.*match/i, /when.*game/i, /begin/i],
    answer: () =>
      `Kickoff is at 19:00 local time (23:30 UTC). Gates opened at 17:00. ` +
      `Pre-match ceremony begins at 18:30 — please be in your seat by 18:50. ` +
      `Half-time is approximately 45 min after kickoff.`,
  },
  {
    keywords: [/\bexit\b/i, /\bleave\b/i, /way out/i, /get out/i, /how.*leave/i],
    answer: (ctx) =>
      `To exit from ${ctx.location?.section ? `Section ${ctx.location.section}` : 'your section'}: ` +
      `Use the numbered exit portal closest to you. After the match, exits are managed in waves ` +
      `announced by zone over the PA. Follow the green exit signs and staff direction — ` +
      `rushing causes dangerous bottlenecks, staggered exit is faster overall.`,
  },
  {
    keywords: [/medical/i, /doctor/i, /first.?aid/i, /ambulance/i, /\bhurt\b/i, /\bsick\b/i, /emergency/i],
    answer: () =>
      `First Aid stations are at Gate A (North concourse Level 1) and Gate C (South concourse Level 1), ` +
      `and at Section 100 field-level. Flag any orange-vest staff member immediately, ` +
      `or call the stadium emergency line: 📞 +1-555-STADIUM. AED defibrillators are ` +
      `mounted on pillars near each First Aid post.`,
  },
  {
    keywords: [/parking/i, /\bcar\b/i, /transport/i, /taxi/i, /\buber\b/i, /\blyft\b/i, /\bbus\b/i, /\btrain\b/i, /subway/i],
    answer: () =>
      `🚌 Shuttle buses run from Lot 7 every 10 min. ` +
      `🚗 Uber/Lyft pickup: designated zones in Lot 3. ` +
      `🚇 Train: Blue Line to Stadium Station (5 min walk from Gate A). ` +
      `🚕 Taxi rank at Gate B (South entrance).`,
  },
  {
    keywords: [/wifi/i, /internet/i, /connect/i, /\bnetwork\b/i, /\bphone\b/i, /signal/i],
    answer: () =>
      `Stadium WiFi: Network "StadiumPulse-Free" — no password required. ` +
      `Full coverage in all seating areas and concourses. ` +
      `Speeds may be slower during peak times (kickoff, half-time).`,
  },
  {
    keywords: [/accessibility/i, /wheelchair/i, /\bdisabled\b/i, /mobility/i, /hearing/i, /\bada\b/i],
    answer: () =>
      `♿ Wheelchair seating: Sections 100–103 (Level 1, field-level). ` +
      `Hearing loop available — ask staff for a receiver at the Info Desk. ` +
      `Companion seating is provided next to all accessible spots. ` +
      `Priority entry queues at Gates A, C, and E for mobility-impaired guests.`,
  },
  {
    keywords: [/\blost\b/i, /\bmissing\b/i, /lost.*child/i, /find.*family/i, /reunif/i],
    answer: () =>
      `Lost & Found / Family Reunification: Guest Services desks at Gate A (North) and Gate D (South). ` +
      `For a lost child, notify any orange-vest staff immediately — ` +
      `a PA announcement will be made and the child taken to the Family Zone at Section 101.`,
  },
  {
    keywords: [/merchandise/i, /\bshop\b/i, /store/i, /souvenir/i, /jersey/i, /shirt/i],
    answer: () =>
      `Official merchandise stores: Gate B (North-West concourse) and Gate C (South concourse). ` +
      `Also available online at the official FIFA World Cup 2026 store — ` +
      `on-site stock may sell out, so shop early!`,
  },
];

/**
 * Matches a free-text fan query to a Q&A pattern (Layer 5).
 * @param {string} query - Raw fan question
 * @param {Object} ctx   - Request context (for personalised answers)
 * @returns {string|null} Answer string, or null if no match
 */
function matchFanQuery(query, ctx) {
  if (!query || typeof query !== 'string') return null;
  for (const pattern of QA_PATTERNS) {
    if (pattern.keywords.some((kw) => kw.test(query))) {
      return pattern.answer(ctx);
    }
  }
  return null;
}

// ─────────────────────── ROLE × PHASE × DENSITY RULES ────────────────────────

/**
 * Layered rule table: role → phase → densityLevel → string[]
 * Returns plain-language recommendations tailored to the combination.
 */
const ROLE_PHASE_RULES = {
  fan: {
    'pre-match': {
      low:      [
        'Gate {gate} is clear — proceed directly to your seat.',
        'All concessions and merchandise stands are open.',
        'Pre-match concert begins at 18:30. Head to your seat early for the best experience!',
      ],
      medium:   [
        'Moderate crowds at {gate}. Allow 10–15 min for entry.',
        'Mobile ticket scanning is faster than printed tickets — have yours ready.',
        'Concessions are open — shorter queues now than at half-time.',
      ],
      high:     [
        '⚠️ Heavy crowds at {gate}. Recommended alternate entry: Gate B or Gate C.',
        'Expect 15–20 min queue. Express lane available for VIP/accessible ticket holders.',
        'Security screening is active — remove belts and large metal items before the scanner.',
      ],
      critical: [
        '🚨 {gate} is at full capacity. Please use Gate B (North-West) as your alternate entry.',
        'Expect 20+ min delay. Overflow lanes are being opened by staff.',
        'Do not push or crowd the gate — staggered entry is being managed for safety.',
      ],
    },
    'live': {
      low:      [
        'Great time to grab food — concession queues are short during live play.',
        'Restrooms on Level 2 are less busy than Level 1 right now.',
        'Enjoy the match! Match updates available on the in-seat screen.',
      ],
      medium:   [
        'Concession queues: approximately 5–10 min. Best time to visit is after a goal or stoppage.',
        'Stay seated during active play for your safety and the experience of others.',
        'Half-time is the ideal time for restroom and food runs.',
      ],
      high:     [
        '⚠️ Concourse is busy. Wait for a natural break in play before leaving your seat.',
        'Emergency exits are clearly marked in green above each section portal.',
        'Security staff are stationed throughout the concourse for assistance.',
      ],
      critical: [
        '⚠️ Concourse is very congested. Please remain in your seat until crowd thins.',
        'Staff are actively managing flow — follow their instructions.',
        'If you must leave urgently, ask the nearest usher for assistance.',
      ],
    },
    'post-match': {
      low:      [
        'Exit flow is clear — have a safe journey home!',
        '🚌 Shuttle buses running from Lot 7 every 5 min.',
        '🚇 Blue Line trains have been boosted to every 3 min until 23:00.',
      ],
      medium:   [
        'Staggered exits in progress. Sections 100–120 exit first — follow PA announcements.',
        'Allow 15–20 min for the main crowd to disperse before heading to transport.',
        'Rideshare pickup is in Lot 3 — use the official app to book ahead.',
      ],
      high:     [
        '⚠️ Staggered exits in progress. Please wait for your zone announcement.',
        'Transport queues: 20–30 min expected. Use this time to connect with friends or grab a bite.',
        'Follow green exit signs and staff direction — rushing worsens bottlenecks.',
      ],
      critical: [
        '🚨 Post-match exit management active. Remain seated until your zone is announced.',
        'Multiple exit gates are open — do not all converge on Gate A.',
        'Follow staff guidance. Your safety is our top priority.',
      ],
    },
  },

  staff: {
    'pre-match': {
      low:      [
        'All gates nominal. Standard entry procedures in effect.',
        'Pre-position extra scanner units at Gate A — arrival peak expected in 30 min.',
        'Confirm comms with parking team: Lot 5 at 40% capacity.',
      ],
      medium:   [
        'Arrival wave building. Activate secondary scanner lanes at Gates A and C.',
        'Coordinate with parking team — Lot 5 approaching 70% capacity.',
        'Brief Queue Management teams at Gates A, C, E.',
      ],
      high:     [
        '⚡ Open overflow lanes at Gates A and B immediately.',
        'Request 4 additional staff from reserve pool to Gate A (Ops channel).',
        'Brief crowd at Gate A to redirect to Gate D — currently at low density.',
      ],
      critical: [
        '🔴 CRITICAL: Halt new entry at Gate A. Divert all incoming fans to Gates B, C, D.',
        'Notify Command Centre — Gate A requires immediate density relief.',
        'Deploy Barrier Management team to Gate A. ETA: 5 min.',
        'PA broadcast: announce Gate A closure and alternate entry directions.',
      ],
    },
    'live': {
      low:      [
        'Match in progress. Standard concourse patrol rotations active.',
        'Check-in with Medical post at Section 100 and Gate C First Aid.',
        'Monitor Section 200 upper deck — stairwells tend to bottleneck at half-time.',
      ],
      medium:   [
        'Concourse busy near food stalls. Station staff at main intersections.',
        'Confirm half-time readiness: concession queues, restroom management.',
        'Verify all emergency exits are unobstructed before half-time bell.',
      ],
      high:     [
        '⚡ Station extra staff at all main concourse intersections.',
        'Implement one-way concourse flow at Gate B concourse — enforce politely.',
        'Alert team leads: elevated crowd density, heightened situational awareness required.',
      ],
      critical: [
        '🔴 Concourse critically congested. Close stairwell 3 to ascending traffic.',
        'Activate one-way concourse protocol across all levels.',
        'Alert Security Command. Prepare to reduce concourse access if density does not drop.',
      ],
    },
    'post-match': {
      low:      [
        'Standard post-match exit flow. Deploy staff to transport connection points.',
        'Assist mobility-impaired guests with priority exit routing.',
        'Begin sweep of seating areas for lost property.',
      ],
      medium:   [
        'Activate staggered exit protocol. Announce sections 100–120 first via PA.',
        'Transport liaison: update shuttle frequency to every 5 min.',
        'Monitor Gate C — historically busiest post-match exit.',
      ],
      high:     [
        '⚡ Gate congestion forming. Stagger exit announcements every 5 min.',
        'Open supplementary exit via Gate F (staff/service) for public use now.',
        'Request additional transport vehicles from contractor — radio Channel 4.',
      ],
      critical: [
        '🔴 Exit critical. All gates open simultaneously — deploy full staff to exit portals.',
        'Request additional police presence at North and South exits immediately.',
        'Coordinate with traffic control: open contraflow lane on main access road.',
      ],
    },
  },

  security: {
    'pre-match': {
      low:      [
        'All perimeters nominal. Routine sweep in progress.',
        'Confirm comms check with all unit leads — Channel Alpha.',
        'Screening checkpoint throughput: normal. No flags.',
      ],
      medium:   [
        'Entry crowd building. Monitor Gate A queue for unusual behaviour.',
        'Increase patrol density at all outer perimeter checkpoints.',
        'Random bag-check rate: increase to 20% at Gates A and E.',
      ],
      high:     [
        '⚡ Heavy entry flow — elevated vigilance at all checkpoints.',
        'Activate secondary screening at Gates A and C.',
        'Radio check: confirm Unit 3 (North) and Unit 7 (South) positions.',
        'Coordinate with local PD liaison re: outer perimeter status.',
      ],
      critical: [
        '🔴 Entry critical. Implement controlled-access protocol at all gates.',
        'Stand up Incident Command. Notify Police Liaison immediately.',
        'All personnel: move to primary positions. No breaks until density drops.',
        'Request crowd control equipment from equipment store — Gate A perimeter.',
      ],
    },
    'live': {
      low:      [
        'Crowd calm. Standard in-stadium patrol rotation active.',
        'Check-in with Medical and Fire Watch positions — confirm all clear.',
        'Monitor social media for any early incident reports (Stadium Digital Ops).',
      ],
      medium:   [
        'Monitor Section 300 — elevated crowd energy reported. Dispatch observation unit.',
        'Verify all emergency exits are fully unobstructed and signage is clear.',
        'Inner perimeter: 15-min patrol cycle active.',
      ],
      high:     [
        '⚡ Crowd energy elevated. Increase inner perimeter patrol frequency.',
        'Position rapid-response teams at field-level access points.',
        'Report any disturbance immediately — do not manage alone, request backup.',
      ],
      critical: [
        '🔴 CRITICAL density in seating area. Stand up Rapid Response Team now.',
        'Notify Event Commander. Prepare evacuation staging areas.',
        'Stadium Medical on standby — crowd crush prevention protocols active.',
      ],
    },
    'post-match': {
      low:      [
        'Post-match exit flow normal. Escort VIP guests via Gate VIP-W.',
        'Begin perimeter sweep — document and report any unattended items.',
        'Coordinate with transport police at Blue Line station.',
      ],
      medium:   [
        'Exit crowds building. Coordinate with traffic police at main road junctions.',
        'Maintain high visibility at all exit portals — presence deters incidents.',
        'Monitor crowd temperature — post-match emotions can be volatile.',
      ],
      high:     [
        '⚡ Exit congestion. Deploy crowd-control barriers at Gate A (South side).',
        'Additional patrol at transport links — monitor for opportunistic incidents.',
        'Increase patrol at Lot 3 (rideshare zone) — frequently congested post-match.',
      ],
      critical: [
        '🔴 Exit critical. Deploy full team to assist traffic management immediately.',
        'Activate post-event security protocol — notify all units via broadcast.',
        'Request mutual aid from off-duty officers if crowd does not thin in 10 min.',
      ],
    },
  },
};

/**
 * Resolves role × phase × density rules (Layer 3).
 * Replaces {gate} placeholder in rule strings.
 * @returns {string[]} Array of recommendation strings
 */
function getRolePhaseRules(role, phase, densityLevel, location) {
  const gate = location?.gate || 'your gate';
  const rules = ROLE_PHASE_RULES[role]?.[phase]?.[densityLevel] || [
    'Situation is being monitored. Please follow staff guidance.',
  ];
  return rules.map((r) => r.replace(/\{gate\}/g, `Gate ${gate}`));
}

// ───────────────────────────── MAIN FUNCTION ─────────────────────────────────

/**
 * recommend(context) → RecommendationResult
 *
 * @param {Object}  context
 * @param {string}  context.role          - 'fan' | 'staff' | 'security'
 * @param {Object}  [context.location]    - { gate, section, nearestExit }
 * @param {string}  context.eventPhase    - 'pre-match' | 'live' | 'post-match'
 * @param {number}  context.crowdDensity  - 0–100
 * @param {string}  [context.query]       - Fan free-text question
 * @param {Object}  [context.incident]    - { type, description }
 *
 * @returns {{ recommendations, alertLevel, actions, densityLevel, qaAnswer, source }}
 */
function recommend(context) {
  // ── Input sanitisation ────────────────────────────────────────────────────
  const role     = ['fan', 'staff', 'security'].includes(context.role) ? context.role : 'fan';
  const phase    = ['pre-match', 'live', 'post-match'].includes(context.eventPhase)
    ? context.eventPhase : 'pre-match';
  const density  = Math.max(0, Math.min(100, Number(context.crowdDensity) || 0));
  const location = context.location || {};

  const densityLevel = classifyDensity(density);

  // ── Layer 1: Incident handling (highest priority, early return) ───────────
  if (context.incident && context.incident.type) {
    return {
      ...handleIncident(context.incident, location),
      densityLevel,
      qaAnswer: null,
      source: 'incident',
    };
  }

  // ── Layer 2: Alert level derived from density ─────────────────────────────
  const alertLevel =
    densityLevel === 'critical' ? 'critical' :
    densityLevel === 'high'     ? 'warning'  : 'normal';

  // ── Layer 3: Role × Phase × Density rules ────────────────────────────────
  const recommendations = getRolePhaseRules(role, phase, densityLevel, location);

  // ── Layer 4 & 5: Fan Q&A ─────────────────────────────────────────────────
  let qaAnswer = null;
  if (role === 'fan' && context.query) {
    qaAnswer = matchFanQuery(context.query, context);
    if (!qaAnswer) {
      qaAnswer =
        "I'm not sure about that — please ask a nearby staff member in an orange vest, " +
        'or visit the Guest Services desk at Gate A (North) or Gate D (South).';
    }
  }

  // ── Layer 5: Operational actions for staff/security ──────────────────────
  const actions = [];
  if (role !== 'fan') {
    if (densityLevel === 'critical') {
      actions.push({
        type: 'alert', priority: 'critical',
        message: `Critical density at Gate ${location.gate || 'zone'} — immediate action required`,
      });
      actions.push({ type: 'notify', target: 'command_center' });
    } else if (densityLevel === 'high') {
      actions.push({
        type: 'alert', priority: 'warning',
        message: `High density at Gate ${location.gate || 'zone'} — monitor closely`,
      });
    }
  }

  return {
    recommendations,
    alertLevel,
    actions,
    densityLevel,
    qaAnswer,
    source: 'rules',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
module.exports = {
  recommend,
  classifyDensity,
  matchFanQuery,
  handleIncident,
  DENSITY_THRESHOLDS,
};
