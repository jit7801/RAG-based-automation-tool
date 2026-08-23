# Gatekeeper — RAG-based Automation Tool

An autonomous daily publisher with a load-bearing RAG editorial gate designed to retrieve current trends, ground factual claims, verify brand safety, check novelty, and automatically publish content or escalate to human review.

---

## 🏗️ Architecture

```
Trend Discovery ──> Ingest & Embed ──> Retrieve Grounded Passages
      │                 │                     │
  Jina / Seed       Weaviate /             Weaviate /
  Corpus            OpenAI embed           cosine search
                                              │
                              Draft Post (OpenAI / Template)
                                              │
                         ┌────────────────────────────┐
                         │     3-Check Editorial Gate  │
                         │  ① Evidence (≥2 publishers) │
                         │  ② Sensitivity (crisis/harm)│
                         │  ③ Novelty (back-catalogue) │
                         └────────────────────────────┘
                               │              │
                         Auto-publish     Human Review
                         ──> #content   ──> #content-review
                              │
                       Indexed into back-catalogue
                       (enables future novelty checks)
```

---

## 🛠️ Tech Stack & Key Elements

- **Frontend**: React (TypeScript), TailwindCSS, SSE Event stream subscriber (Real-time updates).
- **Backend**: Node.js / Express, `node-cron` Scheduler.
- **Orchestration**: Structured 6-step autonomous pipeline (`discover` ➜ `ingest` ➜ `retrieve` ➜ `draft` ➜ `gate` ➜ `act`).
- **Auditability (Swytchcode)**: Single chokepoint client for all external network requests. Emits `swytchcode:call` telemetry for auditable execution, supporting degraded local mocking fallback seamlessly.

---

## 🚦 Verified Test Scenarios

| Scenario | Topic | Expected Behavior |
|---|---|---|
| **1 — Clean Path** | Open-weight inference costs down 38% | **Auto-publishes** (Evidence, Sensitivity, and Novelty pass) |
| **2 — Sensitivity Block** | Industrial fire, casualties reported | **Escalated** — Sensitivity check blocks (100% flag) |
| **3 — Evidence Block** | Northwind Robotics acquisition rumour | **Escalated** — Evidence check blocks (0% corroboration) |
| **4 — Novelty Block** | Vector DB usage-based pricing | **Escalated** — Novelty check blocks (49% similarity vs 42% threshold) |

---

## 🚀 Running Locally

### 1. Installation
Navigate into the nested `gatekeeper` directory and install dependencies:
```bash
cd gatekeeper
npm install
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file inside the `gatekeeper/` directory using `.env.example`:
```env
SWYTCHCODE_API_KEY=your_api_key_here
SWYTCHCODE_BASE_URL=your_base_url_here
PUBLISH_CRON=0 9 * * *
GATE_EVIDENCE_COVERAGE=0.8
GATE_MIN_INDEPENDENT_SOURCES=2
GATE_SENSITIVITY_BLOCK=0.5
GATE_NOVELTY_BLOCK=0.86
```
*(If no `.env` file is present, the server automatically starts in a degraded/local-fallback mode using the local vector database and seed mock data).*

### 3. Launch Development Server
```bash
npm run dev
```
- **Web UI**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:8787](http://localhost:8787)

---

## 📡 API Endpoints

- `GET /api/stream`: Server-Sent Events (SSE) stream for active pipeline updates.
- `POST /api/run`: Trigger manual workflow run.
- `POST /api/runs/:runId/decide`: Submit human review decision (`approved` | `rejected`).
- `GET /api/history`: Retrieve history of runs.
- `GET /api/config`: Current configuration settings, next run time, and connection status.
- `GET /api/trends`: Fetch list of available benchmark scenarios.
- `GET /api/feed`: Channel content log.
