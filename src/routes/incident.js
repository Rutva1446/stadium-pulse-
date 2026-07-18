'use strict';

const express         = require('express');
const router          = express.Router();
const { recommend }   = require('../assistant/engine');
const { crowdState, logIncident } = require('../data/store');

/**
 * POST /api/incident
 * Body: { type, description, location: { gate, section }, reportedBy? }
 * Logs incident to the active alert feed and returns AI guidance.
 */
router.post('/', (req, res) => {
  const { type, description, location, reportedBy } = req.body;

  // Validation
  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Incident type is required.' });
  }
  if (!location || !location.gate) {
    return res.status(400).json({ error: 'Incident location (gate) is required.' });
  }
  if (description && description.length > 1000) {
    return res.status(400).json({ error: 'Description too long — maximum 1000 characters.' });
  }

  // Log to live store
  const logged = logIncident({ type: type.toLowerCase(), description, location, reportedBy });

  // Get engine recommendation for this incident
  const gate = location.gate || 'A';
  const guidance = recommend({
    role:         'security',
    location,
    eventPhase:   crowdState.eventPhase,
    crowdDensity: crowdState.gates[gate]?.density ?? 50,
    incident:     { type: type.toLowerCase(), description },
  });

  return res.status(201).json({ incident: logged, guidance });
});

module.exports = router;
