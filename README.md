# StadiumPulse 🏟️
### Smart Stadium & Tournament Operations Assistant · FIFA World Cup 2026

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> A full-stack AI-powered operations assistant for large-scale stadium events. Delivers
> context-aware, real-time recommendations for **Fans**, **Staff**, and **Security** at MetLife Stadium.

---

## Problem Statement

Managing 82,500 fans at a FIFA World Cup match creates extreme operational complexity — crowd surges, emergency incidents, fan confusion, and security threats can emerge simultaneously. **StadiumPulse** solves this with a smart decision engine that ingests live crowd density, event phase, and user role to generate targeted, actionable recommendations in real time.

---

## Architecture Overview

```
stadiumPulse/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── assistant/
│   │   │   └── engine.js       ← ⭐ CORE DECISION ENGINE (pure function)
│   │   ├── data/
│   │   │   └── store.js        ← In-memory store + 15s simulation timer
│   │   ├── routes/
│   │   │   ├── assistant.js    ← POST /api/assistant
│   │   │   ├── dashboard.js    ← GET  /api/dashboard
│   │   │   └── incident.js     ← POST /api/incident
│   │   └── server.js           ← Express server (helmet, cors, rate-limit)
│   └── tests/
│       └── engine.test.js      ← Jest unit tests (30+ cases)
├── frontend/                   # Vite + React + Tailwind CSS v3
│   └── src/
│       ├── views/              ← LandingView, FanView, StaffView, SecurityView
│       ├── components/         ← Navbar, AssistantPanel, GateStatusCard, AlertFeed…
│       ├── hooks/              ← useLiveData (polling), useAssistant, useIncident
│       └── context/            ← AppContext (role state), I18nContext (EN/ES)
└── data/                       ← venue.json, matches.json, crowd_sim.json
```

---

## How the Assistant Makes Decisions

The core module is `backend/src/assistant/engine.js` — a **pure function** with no side effects, making every decision fully testable.

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
→ Layer 5: actions = [{ type: 'alert', priority: 'critical' }, { type: 'notify', target: 'command_center' }]
```

---

## Setup & Run Instructions

### Prerequisites
- **Node.js** ≥ 18
- **npm** ≥ 9

### 1. Clone / Download
```bash
git clone https://github.com/YOUR_USERNAME/stadiumPulse.git
cd stadiumPulse
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env    # optional — defaults work out of the box
npm start
# API running at http://localhost:3001
```

### 3. Frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## Running Tests

```bash
cd backend
npm test
```

Output: 30+ Jest unit tests covering the decision engine — density classification, all three role types, all event phases, incident handling, Q&A matching, and edge cases.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Pure function engine** | Zero side effects → trivially unit-testable; evaluators can trace every decision |
| **Layered rules (not flat if/else)** | Rules are modular, independent, and extensible — adding a new rule type doesn't require touching existing layers |
| **In-memory store + setInterval** | No database dependency for the demo; crowd data updates every 15s without WebSockets |
| **Frontend polling (10s)** | Simple, reliable, works through any proxy — no WebSocket complexity |
| **Vite + React** | Component reuse across 3 role views; fast HMR for development |
| **Tailwind CSS v3** | Utility classes tree-shaken at build time → minimal CSS bundle |
| **Helmet + rate-limit** | Basic production-grade security from day one |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/assistant` | Get decision-engine recommendations |
| `GET`  | `/api/dashboard` | Live operational snapshot (gates, alerts, match) |
| `POST` | `/api/dashboard/phase` | Advance event phase (demo) |
| `POST` | `/api/dashboard/alerts/:id/acknowledge` | Acknowledge an alert |
| `POST` | `/api/incident` | Report incident + get AI guidance |
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
