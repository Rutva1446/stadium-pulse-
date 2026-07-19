# StadiumPulse 🏟️
### Smart Stadium & Tournament Operations Assistant · FIFA World Cup 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

### 🔗 [Live Demo](https://stadium-pulse-3.onrender.com)

> **Note:** Hosted on Render's free tier — if the app hasn't been visited in 15+ minutes,
> the first load may take 30–60 seconds to wake up. Please wait for it to load fully.

> A full-stack AI-powered operations assistant for large-scale stadium events. Delivers
> context-aware, real-time recommendations for **Fans**, **Staff**, and **Security** at MetLife Stadium.

---

## Problem Statement

Managing 82,500 fans at a FIFA World Cup match creates extreme operational complexity — crowd surges, emergency incidents, fan confusion, and security threats can emerge simultaneously. **StadiumPulse** solves this with a smart decision engine that ingests live crowd density, event phase, and user role to generate targeted, actionable recommendations in real time.

---

## Architecture Overview

StadiumPulse runs as a **single Node.js service**: Express serves both the JSON API and the built React frontend from one process, one port, and one deploy target — no separate frontend/backend hosting required.

```
stadium-pulse/
├── src/
│   ├── server.js               ← Express entry point (helmet, cors, compression, rate-limit)
│   ├── assistant/
│   │   └── engine.js           ← ⭐ CORE DECISION ENGINE (pure function)
│   ├── data/
│   │   └── store.js            ← In-memory store + 15s crowd simulation timer
│   ├── routes/
│   │   ├── assistant.js        ← POST /api/assistant
│   │   ├── dashboard.js        ← GET  /api/dashboard
│   │   ├── incident.js         ← POST /api/incident
│   │   └── tickets.js          ← GET/POST /api/tickets
│   ├── views/                  ← LandingView, FanView, StaffView, SecurityView (React)
│   ├── components/             ← Navbar, AssistantPanel, GateStatusCard, AlertFeed…
│   ├── hooks/                  ← useLiveData (visibility-aware polling), useAssistant, useIncident
│   └── context/                ← AppContext (role state), I18nContext (EN/ES)
├── data/                        ← venue.json, matches.json, crowd_sim.json, tickets.json
├── tests/
│   └── engine.test.js           ← Jest unit tests (30+ cases)
├── vite.config.js
└── package.json                 ← single dependency tree for backend + frontend
```

---

## How the Assistant Makes Decisions

The core module is `src/assistant/engine.js` — a **pure function** with no side effects, making every decision fully testable.

```js
recommend(context) → { recommendations[], alertLevel, actions[], qaAnswer, source }
```

Rules are layered in strict priority order:

| Layer | Rule Type | Trigger | Output |
|-------|-----------|---------|--------|
| 1 | **Incident Rules** | `context.incident.type` present | Evacuation/dispatch guidance, PA broadcast actions |
| 2 | **Density Classification** | `crowdDensity` → `low/medium/high/critical` | Alert level (normal/warning/critical) |
| 3 | **Role × Phase × Density** | `role + eventPhase + densityLevel` | Tailored recommendation strings per combo |
| 4 | **Fan Q&A** | `query` keyword match (regex) | Personalised answer using venue context |
| 5 | **Default** | No rule fires | Fallback to "follow staff guidance" |

**Density thresholds:**
```
< 40  → low      (calm)
40–69 → medium   (normal ops)
70–84 → high     (heightened monitoring)
≥ 85  → critical (emergency protocols)
```

**Example decision path:**
```
context = { role: 'staff', eventPhase: 'pre-match', crowdDensity: 91, location: { gate: 'A' } }
→ Layer 2: classifyDensity(91) = 'critical'
→ Layer 2: alertLevel = 'critical'
→ Layer 3: ROLE_PHASE_RULES['staff']['pre-match']['critical']
→ Output: ["🔴 CRITICAL: Halt entry at Gate A. Divert fans to Gates B–D.", ...]
→ actions = [{ type: 'alert', priority: 'critical' }, { type: 'notify', target: 'command_center' }]
```

---

## Setup & Run Instructions

> 💡 You can try the [live demo](https://stadium-pulse-3.onrender.com) above without any setup — or follow the steps below to run it locally.

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Clone
```bash
git clone https://github.com/Rutva1446/stadium-pulse-.git
cd stadium-pulse-
```

### 2. Install & build
```bash
npm install
cp .env.example .env    # optional — defaults work out of the box
npm run build            # builds the React frontend into /dist
```

### 3. Run
```bash
npm start
# Full app (API + frontend) running at http://localhost:3001
```

Open **http://localhost:3001** in your browser.

---

## Running Tests

```bash
npm test
```

Output: 30+ Jest unit tests covering the decision engine — density classification, all three role types, all event phases, incident handling, Q&A matching, and edge cases.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Pure function engine** | Zero side effects → trivially unit-testable; evaluators can trace every decision |
| **Layered rules (not flat if/else)** | Rules are modular, independent, and extensible — adding a new rule type doesn't require touching existing layers |
| **Single Express service serves frontend + API** | One process, one deploy target, no CORS complexity — Express serves the built React app directly from `/dist` |
| **In-memory store + setInterval** | No database dependency for the demo; crowd data updates every 15s without WebSockets |
| **Visibility-aware polling (10s)** | Frontend pauses its poll when the browser tab is backgrounded and resumes on return — avoids wasted requests |
| **Gzip compression + immutable asset caching** | Vite's content-hashed bundles are cached for 1 year client-side; JS bundle transfers ~70% smaller over the wire |
| **Vite + React** | Component reuse across 3 role views; fast HMR for development |
| **Tailwind CSS v3** | Utility classes tree-shaken at build time → minimal CSS bundle |
| **Helmet + CORS + rate-limit + trust proxy** | Production-grade security from day one, correctly configured for deployment behind Render's reverse proxy |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assistant` | Get decision-engine recommendations |
| `GET`  | `/api/dashboard` | Live operational snapshot (gates, alerts, match) |
| `POST` | `/api/dashboard/phase` | Advance event phase (demo) |
| `POST` | `/api/dashboard/alerts/:id/acknowledge` | Acknowledge an alert |
| `POST` | `/api/incident` | Report incident + get AI guidance |
| `GET/POST` | `/api/tickets` | Ticket/seat lookup |
| `GET`  | `/api/health` | Health check |

---

## Demo Walkthrough

See **[DEMO.md](DEMO.md)** for a 2–3 minute evaluator walkthrough script.

---

## Multi-Language Support

Toggle EN ↔ ES via the language button in the navbar. All fan-facing UI strings, quick actions, and form labels are translated.

---

## License

[MIT](LICENSE) © 2026 StadiumPulse Contributors
