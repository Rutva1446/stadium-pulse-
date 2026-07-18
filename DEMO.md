# StadiumPulse — Demo Walkthrough Script

> **Estimated time:** 2–3 minutes  
> **Prerequisites:** Backend on `:3001`, frontend on `:5173`

---

## Setup (before the demo)

```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```
Open **http://localhost:5173**

---

## Scene 1 — Landing Page (30 seconds)

1. Show the landing page with the animated stadium SVG, floating particles, and hero text.
2. Point out the **language toggle** (top-right) — click it to switch to Spanish 🇪🇸, then back to English.
3. Hover over each of the three role cards — notice the **glow + lift effect** and colour differentiation:
   - 🎟️ Fan → blue
   - 🏟️ Staff → gold
   - 🛡️ Security → red

---

## Scene 2 — Fan View (45 seconds)

1. Click **"Enter as Fan"**.
2. Point out the **match card**: Brazil 🇧🇷 vs France 🇫🇷, live countdown to 19:00, venue info.
3. Show the **ticket card**: Gate A, Section 112, Row 14, Seat 7.
4. Notice the **crowd status bars** — 6 live gate density bars updating in real time.
5. In the Assistant panel, click a **quick-action chip**:
   - Click **"🚻 Nearest restroom?"** → notice the instant AI response about concourse locations.
6. Type a custom question: `"Where can I get halal food?"` → response mentions the halal stands.
7. Ask `"How do I exit after the match?"` → contextual exit flow guidance.

---

## Scene 3 — Staff Dashboard (45 seconds)

1. Click **← Change Role** → Select **"Enter as Staff"**.
2. Point out the **live stats row**: animated counters — attendance, active alerts, open gates, occupancy %.
3. Show the **gate grid**: 6 GateStatusCard components with SVG circular gauges, colour-coded.
4. Click any gate card (e.g. Gate E which starts at ~71%) → watch **AI Recommendations** appear below the grid.
5. Click **⏭ Advance Phase (Demo)** → phase changes from `pre-match` → `live` → crowd behaviour changes, recommendations update.
6. In the alert feed, click **✓ Ack** on an alert — it disappears from the feed.

---

## Scene 4 — Security View + Incident (45 seconds)

1. Click **← Change Role** → Select **"Enter as Security"**.
2. Show the **zone gauge grid** — 6 circular gauges for each gate, colour-coded by density.
3. Fill in the incident form:
   - Type: **Medical Emergency**
   - Gate: **C**
   - Section: `204`
   - Description: `Fan collapsed in Section 204, appears unconscious`
   - Reported by: `Unit-7`
4. Click **🚨 Submit Incident**.
5. Watch the **AI Response Guidance** panel fill with:
   - Alert level badge (high / critical)
   - Numbered response steps (dispatch team, nearest exit, radio channel, AED location)
   - Actions triggered (notify command center, dispatch medical)
6. Try with **Fire / Smoke** → note the **EVACUATE** heading, PA broadcast action, glow-critical animation.

---

## Key Talking Points for Judges

- **Decision engine** is a pure function in `backend/src/assistant/engine.js` — show the file, point out the 5 rule layers.
- **Testable** — run `cd backend && npm test` live to show 30+ passing tests.
- **Real-time** — data updates every 15s (backend) / 10s (frontend) — watch a gate density number change during the demo.
- **Multilingual** — EN/ES toggle works on all fan-facing strings.
- **Accessible** — semantic HTML, ARIA labels, keyboard navigation, focus rings.
- **Repo size** — `node_modules` excluded via `.gitignore`; total source is well under 10MB.
