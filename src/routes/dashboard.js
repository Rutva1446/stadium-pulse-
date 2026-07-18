'use strict';

const express = require('express');
const router  = express.Router();
const {
  crowdState, VENUE, MATCHES, advancePhase, acknowledgeAlert,
} = require('../data/store');

/**
 * GET /api/dashboard
 * Returns full live operational snapshot for the staff/security dashboard.
 */
router.get('/', (req, res) => {
  const unacked = crowdState.activeAlerts.filter((a) => !a.acknowledged).slice(0, 10);
  res.json({
    gates:            crowdState.gates,
    totalAttendance:  crowdState.totalAttendance,
    capacity:         crowdState.capacity,
    occupancyPercent: Math.round((crowdState.totalAttendance / crowdState.capacity) * 100),
    activeAlerts:     unacked,
    alertCount:       unacked.length,
    eventPhase:       crowdState.eventPhase,
    match:            MATCHES.current_match,
    venue:            { name: VENUE.stadium.name, city: VENUE.stadium.city },
    lastUpdated:      crowdState.lastUpdated,
  });
});

/**
 * POST /api/dashboard/phase
 * Advances the event phase (pre-match → live → post-match → pre-match).
 * Demo endpoint — lets evaluators simulate phase transitions.
 */
router.post('/phase', (req, res) => {
  advancePhase();
  res.json({ eventPhase: crowdState.eventPhase, message: `Phase advanced to: ${crowdState.eventPhase}` });
});

/**
 * POST /api/dashboard/alerts/:id/acknowledge
 * Marks a single alert as acknowledged.
 */
router.post('/alerts/:id/acknowledge', (req, res) => {
  const ok = acknowledgeAlert(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Alert not found.' });
  return res.json({ success: true, alertId: req.params.id });
});

module.exports = router;
