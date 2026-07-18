'use strict';

require('dotenv').config();

const path      = require('path');
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const { startSimulation } = require('./data/store');
const assistantRoutes     = require('./routes/assistant');
const dashboardRoutes     = require('./routes/dashboard');
const incidentRoutes      = require('./routes/incident');
const ticketRoutes        = require('./routes/tickets');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security middleware ───────────────────────────────────────────────────────
// contentSecurityPolicy is relaxed slightly because we serve the React app +
// Google Fonts from this same server; other helmet protections stay enabled.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'style-src':  ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src':   ["'self'", 'https://fonts.gstatic.com'],
      'script-src': ["'self'"],
    },
  },
}));
app.use(cors({
  origin:  process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
}));
app.use(express.json({ limit: '10kb' })); // Prevent oversized payloads

// ── Rate limiting: 100 req/min per IP ────────────────────────────────────────
const limiter = rateLimit({
  windowMs:       60 * 1000,
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  message:        { error: 'Too many requests — please slow down.' },
});
app.use('/api/', limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/assistant', assistantRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/incident',  incidentRoutes);
app.use('/api/tickets',   ticketRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() }),
);

// ── Serve the built React frontend ─────────────────────────────────────────────
// vite build outputs to /dist at the project root (one level up from /src).
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Any non-/api route falls through to index.html so React Router (if used)
// and direct page loads/refreshes both work correctly.
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ── 404 (API routes only reach here) ───────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));

// ── Error handler ─────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

// ── Start server + simulation ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🏟️  StadiumPulse API running → http://localhost:${PORT}`);
  startSimulation();
  console.log('📡 Live crowd simulation started (15 s interval)\n');
});
