# RescueAI — Tactical AI Emergency Response & Operations Command

[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black.svg)](https://threejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

An AI-driven emergency decision-support platform that transforms fragmented, contradictory disaster reports into an explainable, resource-aware, and **human-authorized** response plan in seconds.

> **Safety Principle**: RescueAI never autonomously dispatches real emergency personnel. Every AI recommendation flows through:  
> `Emergency Report → Multi-Agent Analysis → Explainable Recommendation → Human Commander Review → Authorized Simulated Dispatch`.

---

## 🌟 Key Highlights

- 🌐 **Interactive 3D Tactical Globe**: Built with Three.js and React Three Fiber. Features an auto-rotating wireframe sphere, glowing geopolitical boundary of Pakistan, strategic city hubs, 100+ orbiting telemetry particles, and real-time orbital hover HUD telemetry cards.
- 🇵🇰 **Nationwide Coverage (27+ Cities)**: Pre-seeded nationwide dataset across Pakistan (Karachi, Lahore, Islamabad, Quetta, Peshawar, Multan, Faisalabad, Gwadar, Gilgit, Skardu, etc.) with 70+ incidents, 89+ trauma centers, and 250+ rescue fleets.
- ⚡ **6 Specialized Autonomous Agents**:
  1. **Intake Agent**: Classifies free-text/voice/social media reports into structured schema.
  2. **Analysis Agent**: Evaluates triage severity, confidence, and conflicting info detection.
  3. **Resource Agent**: Multi-factor matching balancing travel distance, crew readiness, and fleet capability.
  4. **Hospital Agent**: Live trauma, ICU, and burn center bed capacity scoring.
  5. **Secondary Risk Agent**: Anticipates cascading risks (gas leaks, structural collapse, aftershocks).
  6. **Planning Agent**: Synthesizes a prioritized, step-by-step action plan with RAG citations.
- 🎯 **Tactical Incident Registry & Filters**: Multi-criteria filtering by Status (`REPORTED`, `TRIAGED`, `DISPATCHED`, `RESOLVED`), Severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), and Type, paired with a dynamic results counter.
- 📍 **City Quick-Pick & GPS Auto-Fill**: Streamlined emergency intake modal with a 29-city dropdown that automatically populates precise GPS coordinates for accurate geospatial mapping.
- 🛡️ **DEFCON Readiness & Live Telemetry**: Dynamic command-center layout with DEFCON status, live PKT timestamp, and animated telemetry indicators.

---

## 1. System Architecture

```
rescueai/
├── backend/
│   ├── agents/                   # The 6 specialized agents + orchestrator + RAG
│   │   ├── intake_agent.py       # Agent 1: raw text -> structured incident
│   │   ├── analysis_agent.py     # Agent 2: severity/urgency scoring + explainability
│   │   ├── resource_agent.py     # Agent 3: multi-factor resource matching
│   │   ├── hospital_agent.py     # Agent 4: hospital bed capacity scoring
│   │   ├── risk_agent.py         # Agent 5: secondary-risk & hazard anticipation
│   │   ├── planning_agent.py     # Agent 6: synthesizes comprehensive response plan
│   │   ├── knowledge_base.py     # Lightweight TF-IDF RAG retriever
│   │   └── orchestrator.py       # Pipeline execution & conflict resolution
│   ├── routers/                  # FastAPI routers
│   │   ├── incidents.py          # Incident intake, analysis, approval, resolve
│   │   ├── misc.py               # Resources, hospitals, dashboard stats, audit, alerts
│   │   └── demo.py               # One-click crisis scenario loader
│   ├── knowledge_base/           # RAG source documents (markdown guidelines)
│   ├── tests/                    # Unit & integration test suite (13 passing tests)
│   ├── models.py                 # SQLAlchemy ORM (9 tables)
│   ├── schemas.py                # Pydantic request/response validation schemas
│   ├── database.py               # SQLite / PostgreSQL engine config
│   ├── seed_pakistan.py          # Nationwide data seeder (27+ cities, 70+ incidents)
│   └── main.py                   # FastAPI application & static bundle server
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── MapView.jsx       # 3D Tactical Globe (Three.js/R3F) & 2D Tactical Grid
│       │   ├── ParticleBackground.jsx # Ambient canvas particle dust
│       │   ├── PageTransition.jsx# Smooth Framer Motion page navigation
│       │   ├── ResponsePlanPanel.jsx # AI recommendation & explainability inspector
│       │   ├── SeverityBadge.jsx # Color-coded tactical severity indicators
│       │   └── StatCard.jsx      # Telemetry metric cards with animated counters
│       ├── pages/                # Command Center, Incidents, Map, Fleets, Hospitals, Analytics
│       ├── api/client.js         # Axios API client wrapper
│       └── styles.css            # Dark tactical EOC design system
├── Dockerfile                    # Multi-stage production container
└── docker-compose.yml
```

### Multi-Agent Pipeline Flow

```
[Raw Emergency Reports] ────────► [Agent 1: Intake]
                                          │
                                          ▼
                               [Structured Incident]
                                          │
             ┌────────────────────────────┼────────────────────────────┐
             ▼                            ▼                            ▼
   [Agent 2: Analysis]           [Agent 5: Risk]             [Conflict Detection]
   (Severity & Confidence)     (Secondary Hazards)         (Conflicting Eyewitnesses)
             │                            │                            │
             └────────────────────────────┼────────────────────────────┘
                                          ▼
             ┌────────────────────────────┴────────────────────────────┐
             ▼                                                         ▼
   [Agent 3: Resources]                                      [Agent 4: Hospitals]
   (Fleets / SAR / Fire)                                     (Trauma & ICU Beds)
             │                                                         │
             └────────────────────────────┬────────────────────────────┘
                                          ▼
                             [Agent 6: Response Planning]
                             (RAG Knowledge Base Citations)
                                          │
                                          ▼
                         [AI Recommendation & Action Steps]
                                          │
                           ═══════════════════════════════
                           🔴 HUMAN COMMANDER APPROVAL GATE
                           ═══════════════════════════════
                                          │
                                          ▼
                        [Simulated Dispatch + Audit Ledger]
```

---

## 2. Quick Start

### Option A — Run Unified App (Recommended)

Run both the FastAPI backend and built React frontend together on port `7860`:

```bash
# 1. Clone the repository
git clone https://github.com/lizzz-dev/RescueAI.git
cd RescueAI

# 2. Setup Python environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 3. Install dependencies
pip install -r backend/requirements.txt

# 4. Seed nationwide Pakistan dataset (70+ incidents, 89 hospitals, 250 fleets across 27 cities)
python backend/seed_pakistan.py

# 5. Build frontend
cd frontend
npm install
npm run build
cd ..

# 6. Launch server
python -m uvicorn backend.main:app --host 127.0.0.1 --port 7860
```

Open your browser to: **`http://127.0.0.1:7860`**  
- Web Application: `http://127.0.0.1:7860`
- Interactive Swagger API Docs: `http://127.0.0.1:7860/docs`

---

### Option B — Docker

```bash
docker compose up --build
```
- App: `http://localhost:7860`
- Swagger API Docs: `http://localhost:7860/docs`

---

### Option C — Development Mode (Hot Reload)

**Backend Terminal:**
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 7860 --reload
```

**Frontend Terminal:**
```bash
cd frontend
npm run dev
# Running at http://localhost:5173 (proxies API requests to port 7860)
```

---

## 3. Deployment: Hugging Face Spaces

This repository is pre-configured for one-click deployment on **Hugging Face Spaces (Docker)**:

1. Create a new Space at [huggingface.co/new-space](https://huggingface.co/new-space).
2. Set Space Name, select **SDK = Docker**, and choose the **free CPU basic** tier.
3. Push this repository to your Space:
   ```bash
   git remote add space https://huggingface.co/spaces/<your-username>/<your-space-name>
   git push space main
   ```
4. Hugging Face automatically detects the root `Dockerfile` and deploys the unified app on port `7860`.
   *(Space metadata: `title: RescueAI`, `emoji: 🚨`, `sdk: docker`, `app_port: 7860`)*

---

## 4. API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/incidents` | Submit emergency text report → Agent 1 structures it |
| `POST` | `/api/incidents/{id}/reports` | Submit secondary eyewitness report (triggers conflict detection) |
| `GET` | `/api/incidents` | List all incidents (supports filtering by status & severity) |
| `GET` | `/api/incidents/{id}` | Retrieve incident detail and linked eyewitness reports |
| `POST` | `/api/incidents/{id}/analyze` | Execute Agents 2–6 to synthesize response plan |
| `GET` | `/api/incidents/{id}/response-plan` | Fetch latest AI response recommendation |
| `POST` | `/api/incidents/{id}/approve` | **Human Commander Approval** → flips fleet status to `DISPATCHED` |
| `POST` | `/api/incidents/{id}/reject` | Reject AI proposal with commander reason |
| `POST` | `/api/incidents/{id}/resolve` | Mark incident fully resolved |
| `GET` | `/api/resources` | Rescue fleets inventory (Ambulances, SAR, Fire, Utility) |
| `GET` | `/api/hospitals` | Hospital registry with ER & ICU bed counts |
| `GET` | `/api/dashboard/stats` | High-level operations telemetry numbers |
| `GET` | `/api/dashboard/analytics` | Incident distribution, severity breakdown, and fleet utilization |
| `GET` | `/api/audit-logs` | Immutable audit ledger tracking all AI and commander actions |
| `GET` | `/api/notifications` | Real-time dispatch alerts stream |
| `POST` | `/api/demo/load-scenario` | Loads live crisis scenario with conflicting eyewitness reports |

---

## 5. Automated Test Suite

RescueAI includes a comprehensive test suite exercising agent logic, scoring formulas, edge cases, and end-to-end pipeline execution:

```bash
# Run backend tests
cd backend
python -m unittest tests.test_agents -v
```

**13 Passing Tests Cover**:
- Incident type keyword extraction and edge cases
- Severity and urgency mathematical scoring
- Conflicting report discrepancy detection (casualty count variances)
- Workload-aware fleet matching (not just closest, but available and capable)
- Trauma hospital capacity weighting and ICU availability
- Gap reporting when zero resources are nearby
- RAG TF-IDF knowledge base document retrieval
- Full multi-agent end-to-end integration

---

## 6. What's Real vs. Simulated

| Component | Status | Details |
|---|---|---|
| **AI Agents** | **Real & Deterministic** | 6 rule-based, explainable scoring agents; no hallucination or hidden logic |
| **Geospatial Mapping** | **Real Coordinates** | 3D globe coordinates mapped to real Pakistani cities & boundaries |
| **Fleet Dispatch** | **Simulated** | Fleet status updates in SQLite database; no real-world sirens triggered |
| **Hospital Comms** | **Simulated** | Logged to notifications table for operational demonstration |
| **RAG Knowledge Base** | **Real Retrieval** | TF-IDF vector retrieval over curated disaster response markdown manuals |

---

## 7. License & Credits

Built for emergency response decision-support and hackathon demonstrations.  
Created by **Team RescueAI** // Tactical EOC Systems.
