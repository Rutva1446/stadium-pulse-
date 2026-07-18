'use strict';

const express   = require('express');
const router    = express.Router();
const { recommend } = require('../assistant/engine');

/**
 * POST /api/assistant
 * Body: { role, location, eventPhase, crowdDensity, query?, incident? }
 * Returns engine recommendation result.
 */
router.post('/', (req, res) => {
  const { role, location, eventPhase, crowdDensity, query, incident } = req.body;

  // Input length guards
  if (query && typeof query === 'string' && query.length > 500) {
    return res.status(400).json({ error: 'Query too long — maximum 500 characters.' });
  }
  if (incident?.description && incident.description.length > 1000) {
    return res.status(400).json({ error: 'Incident description too long — maximum 1000 characters.' });
  }

  const result = recommend({ role, location, eventPhase, crowdDensity, query, incident });
  return res.json(result);
});

module.exports = router;
