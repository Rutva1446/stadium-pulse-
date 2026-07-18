'use strict';

/**
 * store.js — In-memory data store with live simulation
 *
 * Loads static venue/match data from JSON files at startup.
 * Simulates real-world crowd density changes via a setInterval tick
 * every 15 seconds, using phase-aware drift values from crowd_sim.json.
 */

const path = require('path');
const fs   = require('fs');

// ── Load static data ─────────────────────────────────────────────────────────
const DATA_DIR  = path.join(__dirname, '../../data');
const VENUE     = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'venue.json'),     'utf8'));
const MATCHES   = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'matches.json'),   'utf8'));
const CROWD_SIM = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'crowd_sim.json'), 'utf8'));

// ── Live state ───────────────────────────────────────────────────────────────
const crowdState = {
  gates: {
    A:   { density: CROWD_SIM.initial_densities.A,   status: 'open', queueMinutes: 6  },
    B:   { density: CROWD_SIM.initial_densities.B,   status: 'open', queueMinutes: 2  },
    C:   { density: CROWD_SIM.initial_densities.C,   status: 'open', queueMinutes: 9  },
    D:   { density: CROWD_SIM.initial_densities.D,   status: 'open', queueMinutes: 1  },
    E:   { density: CROWD_SIM.initial_densities.E,   status: 'open', queueMinutes: 12 },
    VIP: { density: CROWD_SIM.initial_densities.VIP, status: 'open', queueMinutes: 0  },
  },
  totalAttendance: 42000,
  capacity:        VENUE.stadium.capacity,
  activeAlerts:    [],
  eventPhase:      MATCHES.current_match.phase,
  lastUpdated:     new Date().toISOString(),
};

// ── Alert helpers ────────────────────────────────────────────────────────────
let _counter = 1;
const pad    = (n) => String(n).padStart(4, '0');

function createAlert(gate, density) {
  const isCritical = density >= CROWD_SIM.thresholds.high;
  return {
    id:           `ALT-${pad(_counter++)}`,
    gate,
    density:      Math.round(density),
    level:        isCritical ? 'critical' : 'warning',
    message:      isCritical
      ? `Gate ${gate} at CRITICAL capacity (${Math.round(density)}%). Immediate action required.`
      : `Gate ${gate} approaching high capacity (${Math.round(density)}%). Monitor closely.`,
    timestamp:    new Date().toISOString(),
    acknowledged: false,
  };
}

function createIncidentAlert(incident) {
  return {
    id:           `INC-${pad(_counter++)}`,
    gate:         incident.location?.gate || 'Unknown',
    level:        'incident',
    message:      `[${incident.type?.toUpperCase()}] ${incident.description || 'Incident reported'}`,
    timestamp:    new Date().toISOString(),
    acknowledged: false,
    details:      incident,
  };
}

// ── Simulation tick ───────────────────────────────────────────────────────────
function tick() {
  const phase  = crowdState.eventPhase;
  const trends = CROWD_SIM.phase_trends[phase] || {};
  const noise  = trends.noise_range || 3;
  const drift  = trends.drift_per_tick || {};

  Object.keys(crowdState.gates).forEach((gate) => {
    const g     = crowdState.gates[gate];
    const delta = (drift[gate] || 0) + (Math.random() * noise * 2 - noise);
    g.density   = Math.max(0, Math.min(100, g.density + delta));
    g.queueMinutes = Math.max(0, Math.round(g.density / 8));

    // Auto-update status label
    g.status = g.density >= 85 ? 'critical' : g.density >= 70 ? 'high' : 'open';

    // Raise alert if threshold crossed and no active unacknowledged alert for this gate
    const threshold = CROWD_SIM.thresholds.medium; // 70
    if (g.density >= threshold) {
      const hasActive = crowdState.activeAlerts.some(
        (a) => a.gate === gate && !a.acknowledged && a.level !== 'incident',
      );
      if (!hasActive) {
        crowdState.activeAlerts.unshift(createAlert(gate, g.density));
      }
    }
  });

  // Attendance grows during pre-match
  if (phase === 'pre-match') {
    crowdState.totalAttendance = Math.min(
      crowdState.capacity,
      crowdState.totalAttendance + Math.floor(Math.random() * 400 + 50),
    );
  }

  // Cap alert list at 25 entries
  crowdState.activeAlerts = crowdState.activeAlerts.slice(0, 25);
  crowdState.lastUpdated  = new Date().toISOString();
}

// ── Phase management ─────────────────────────────────────────────────────────
const PHASES = ['pre-match', 'live', 'post-match'];

function advancePhase() {
  const idx          = PHASES.indexOf(crowdState.eventPhase);
  crowdState.eventPhase = PHASES[(idx + 1) % PHASES.length];
  // Clear non-incident alerts on phase change
  crowdState.activeAlerts = crowdState.activeAlerts.filter((a) => a.level === 'incident');
}

// ── Simulation control ────────────────────────────────────────────────────────
let _timer = null;
const SIM_INTERVAL_MS = 15000;

function startSimulation() {
  if (!_timer) {
    _timer = setInterval(tick, SIM_INTERVAL_MS);
  }
}

function stopSimulation() {
  if (_timer) { clearInterval(_timer); _timer = null; }
}

// ── Public API ────────────────────────────────────────────────────────────────
module.exports = {
  crowdState,
  VENUE,
  MATCHES,
  advancePhase,
  startSimulation,
  stopSimulation,
  acknowledgeAlert(alertId) {
    const alert = crowdState.activeAlerts.find((a) => a.id === alertId);
    if (alert) alert.acknowledged = true;
    return !!alert;
  },
  logIncident(incident) {
    const entry = createIncidentAlert(incident);
    crowdState.activeAlerts.unshift(entry);
    crowdState.activeAlerts = crowdState.activeAlerts.slice(0, 25);
    return entry;
  },
};
