'use strict';

const express = require('express');
const router  = express.Router();
const path    = require('path');
const fs      = require('fs');

const TICKETS_FILE = path.join(__dirname, '../../data/tickets.json');
let tickets = {};

try {
  tickets = JSON.parse(fs.readFileSync(TICKETS_FILE, 'utf8'));
} catch (err) {
  console.error('Failed to load tickets.json:', err);
}

/**
 * GET /api/tickets/:id
 * Looks up ticket details by ID. Case-insensitive.
 */
router.get('/:id', (req, res) => {
  const ticketId = (req.params.id || '').trim().toUpperCase();
  const ticket = tickets[ticketId];

  if (!ticket) {
    return res.status(404).json({
      error: `Ticket "${req.params.id}" not found. Try TKT-101, TKT-202, TKT-303, TKT-404, TKT-505, or TKT-VIP.`
    });
  }

  return res.json(ticket);
});

module.exports = router;
