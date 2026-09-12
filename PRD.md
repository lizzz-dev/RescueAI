# Product Requirements Document (PRD)
## RescueAI — Autonomous Multi-Agent Tactical Emergency Operations & Decision Support System

---

### Document Metadata
- **Product Name**: RescueAI
- **Version**: 1.0.0 (Production Release)
- **Target Organization**: National & Provincial Disaster Management Authorities (NDMA / PDMA), Rescue 1122, Emergency Operations Centers (EOC)
- **Document Status**: Final / Approved
- **Repository**: [https://github.com/lizzz-dev/RescueAI](https://github.com/lizzz-dev/RescueAI)
- **Live Deployment**: [https://rescue-ai-mocha.vercel.app](https://rescue-ai-mocha.vercel.app)

---

## 1. Executive Summary & Vision

### 1.1 Executive Summary
During high-impact crises and natural disasters, Emergency Operations Centers (EOCs) face massive cognitive saturation. Call centers are inundated with unstructured, multi-source intelligence (citizen 1122 calls, emergency field officers, verified NGOs, social media feeds) containing conflicting victim counts, evolving hazard zones, and incomplete casualty figures. 

**RescueAI** is an AI-powered tactical decision-support platform engineered to automate crisis intake, autonomously synthesize conflicting intelligence, optimize cross-agency fleet allocation, and coordinate real-time ICU trauma routing. Operating under a strict **Human-In-The-Loop (HITL)** governance model, RescueAI guarantees that while AI synthesizes operational action plans in sub-second timeframes, every physical dispatch strictly mandates authorized commander authorization.

### 1.2 Vision Statement
To establish an uncompromised, zero-latency emergency command network that bridges multi-agent intelligence with boots-on-the-ground responders, minimizing response latency from minutes to milliseconds while preventing trauma center saturation.

---

## 2. Problem Statement & User Personas

### 2.1 The Problem
1. **Information Asymmetry & Conflicting Intel**: Disparate reporting sources submit contradicting victim estimates (e.g., eyewitness reports stating 3 casualties vs. citizen accounts claiming 15).
2. **Cognitive Saturation in EOCs**: Dispatchers manually correlate road blockages, cascading hazards (gas leaks, aftershocks), and fleet locations while coordinating with hospital ICU registries.
3. **Trauma Hospital Saturation**: Critical patients are frequently dispatched to the nearest hospital rather than the nearest *capable and available* trauma facility, resulting in preventable fatalities.
4. **Lack of Cryptographic Auditability**: Post-incident investigations struggle to reconstruct which operator authorized actions, why specific units were assigned, and what intelligence was available at time of dispatch.

### 2.2 User Personas

| Persona | Role & Clearance | Key Needs & Pain Points |
| :--- | :--- | :--- |
| **Tariq Malik** | Commander // NDMA 1122 (`EOC-LEAD`) | Requires high-level situational awareness, DEFCON telemetry, multi-incident triage overviews, and final authorization power for AI-synthesized incident action plans. |
| **Operator-01** | Tactical Controller // NDMA HQ (`ALPHA-1`) | Monitors raw incident queues, handles multi-channel intake, and triggers AI analysis pipelines on newly registered incidents. |
| **Dispatcher-04** | Fleet Logistics // Rescue 1122 (`BRAVO-4`) | Manages 250+ fleet units (ambulances, hazmat units, heavy rescue equipment) across regional sectors, monitoring unit workload and transit status. |
| **Triage-Lead** | Medical Coordinator (`MEDIC-1`) | Tracks live ER and ICU bed availability across 80+ trauma facilities, preventing patient redirection during mass-casualty events. |

---

## 3. Core Architectural Principles & System Design

```
                     ┌───────────────────────────────────────────────────────────┐
                     │          Multi-Source Crisis Intake Streams               │
                     │  [Citizen 1122]  [Field Officers]  [NGOs]  [Social Media] │
                     └─────────────────────────────┬─────────────────────────────┘
                                                   │
                                                   ▼
                     ┌───────────────────────────────────────────────────────────┐
                     │          Autonomous 6-Agent AI Pipeline (Python)          │
                     │                                                           │
                     │  1. Intake Agent      ────────► Extract & Structure Data  │
                     │  2. Analysis Agent    ────────► Severity & Confidence     │
                     │  3. Risk Agent        ────────► Cascading Secondary Risks │
                     │  4. Resource Agent    ────────► Haversine Fleet Matching  │
                     │  5. Hospital Agent    ────────► Trauma & ICU Balancing    │
                     │  6. Planning Agent    ────────► Synthesized Incident Plan │
                     └─────────────────────────────┬─────────────────────────────┘
                                                   │
                                                   ▼
                     ┌───────────────────────────────────────────────────────────┐
                     │            Human Commander Authorization Gate             │
                     │    [Review SOPs] ──► [EOC Clearance 1122] ──► [Approve]   │
                     └─────────────────────────────┬─────────────────────────────┘
                                                   │
                     ┌─────────────────────────────┴─────────────────────────────┐
                     ▼                                                           ▼
     ┌───────────────────────────────┐                           ┌───────────────────────────────┐
     │ 3D Interactive Tactical Globe │                           │   Immutable Audit Ledger      │
     │  - Pakistan Border Geodesics  │                           │   - Cryptographic timestamp   │
     │  - Live Status Pin Markers    │                           │   - Operator callsign tag     │
     │  - 2D Flat Grid Fallback      │                           │   - Full decision audit trail │
     └───────────────────────────────┘                           └───────────────────────────────┘
```

---

## 4. Functional Specifications

### 4.1 The Autonomous 6-Agent Intelligence Pipeline

RescueAI employs an orchestrated multi-agent system implemented as deterministic, explainable modules backed by domain-specific knowledge bases:

#### 1. Emergency Intake & Extraction Agent (`intake_agent.py`)
- **Input**: Raw, unstructured free-text statements or audio-transcribed dispatch calls.
- **Processing**:
  - Regex-based and heuristic keyword extraction across 9 disaster categories (*Flood, Earthquake, Fire, Road Traffic Accident, Building Collapse, Medical Emergency, Heatwave, Landslide, Industrial Accident*).
  - Hazard tagging (*Toxic Fumes, Structural Instability, Live Electrical Wires, Gas Leak, Flooding, Extreme Heat*).
  - Casualty range extraction (`estimated_victims_min`, `estimated_victims_max`).
  - Source reliability weighting (`FIELD_OFFICER: HIGH`, `VERIFIED_ORG: HIGH`, `CITIZEN: MEDIUM`, `SOCIAL_MEDIA: LOW`).
- **Output**: Validated incident entity with classification confidence score.

#### 2. Triage & Situation Analysis Agent (`analysis_agent.py`)
- **Processing**:
  - Evaluates casualty density, report frequency, and structural hazard proximity.
  - Resolves conflicting multi-witness accounts using weighted source-credibility algorithms.
  - Computes an overall classification severity: `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- **Output**: Deterministic triage priority score and conflict notes.

#### 3. Cascading Risk Assessment Agent (`risk_agent.py`)
- **Processing**:
  - Identifies environmental and structural domino effects (e.g., pipeline breach following an earthquake, landslide damming a river).
  - Evaluates population density impact based on urban sector classifications.
- **Output**: Priority hazard mitigation advisories and secondary threat alerts.

#### 4. Resource Allocation & Routing Agent (`resource_agent.py`)
- **Processing**:
  - Queries real-time fleet availability across 250 units (Ambulances, SAR Teams, Fire Units, Heavy Equipment, Water Tankers, Utility Units).
  - Computes precise geodetic distance using the Haversine formula against incident coordinates.
  - Matches unit capabilities to incident hazard tags (e.g., dispatching Hazmat-equipped units to industrial leaks).
- **Output**: Ordered dispatch recommendation roster with estimated arrival times (ETA).

#### 5. Hospital & Trauma Coordination Agent (`hospital_agent.py`)
- **Processing**:
  - Tracks live bed capacity across 89 provincial and national healthcare facilities.
  - Analyzes Emergency Bed count, ICU Bed availability, and Trauma Center Tier.
  - Balances casualty dispersal so no single hospital crosses 85% critical load.
- **Output**: Primary and secondary trauma facility routing recommendations with patient allocation quotas.

#### 6. Response Planning & SOP Agent (`planning_agent.py`)
- **Processing**:
  - Pulls standard NDMA/1122 Standard Operating Procedures (SOPs) corresponding to the incident typology.
  - Aggregates the outputs of Agents 1–5 into an actionable Incident Action Plan (IAP).
- **Output**: Comprehensive Incident Response Plan ready for Commander approval.

---

### 4.2 Tactical Visualization Command Map (`MapView.jsx`)
1. **3D Tactical Planetary Globe**:
   - Built on Three.js & React Three Fiber (`@react-three/fiber`, `@react-three/drei`).
   - Features real geopolitical border coordinates of Pakistan (closed polygonal boundary).
   - Cardinal reference hubs for Karachi, Lahore, Islamabad, and Quetta.
   - Pulsing laser-point beacons with severity-tailored colors (`#f43f5e` for Crises, `#ec4899` for Hospitals, `#38bdf8` for Fleets).
   - Needle-point coordinate dispersion algorithm preventing overlapping markers in dense metropolitan areas.
2. **Instant 2D Flat Tactical Grid Fallback**:
   - High-contrast SVG vector map of Pakistan with latitude/longitude coordinate grid lines.
   - Fail-safe Error Boundary (`GlobeErrorBoundary`): If a client device lacks WebGL hardware acceleration, the system seamlessly displays the 2D grid with zero page crash or screen blanking.

---

### 4.3 Strict Role-Based Access Control (RBAC) & Clearance Drawer
RescueAI enforces strict military/disaster management operational roles. Arbitrary profile self-editing is disabled in favor of restricted clearance tiers:

| Operator ID | Default Persona | Operational Role | Clearance Level |
| :--- | :--- | :--- | :--- |
| `commander-tm` | **Tariq Malik** (Default) | Commander // NDMA 1122 | **COMMAND OVERRIDE** |
| `op-01` | OPERATOR-01 | Tactical Controller // NDMA HQ | LEVEL-4 CLEARANCE |
| `disp-04` | DISPATCHER-04 | Fleet Logistics // Rescue 1122 | FIELD DISPATCH AUTH |
| `triage-lead` | TRIAGE-LEAD | Trauma Medical Director | ICU COORD ACCESS |
| `chief-00` | EOC-CHIEF | National Operations Chief | STRATEGIC COMMAND |

- **Security Gate**: Switching to any restricted operational role requires entering the EOC Master Passcode (`1122`).
- **Quick-Auth Chip**: An ergonomic key chip (`⚡ Key: 1122`) enables instant demonstration during judging sessions without typing delays.

---

### 4.4 Cryptographic Audit Ledger (`AuditLogs.jsx`)
- Every operational action (incident intake, report addition, AI plan generation, approval, rejection, incident closure) is immutably appended to the database.
- Records include exact timestamp (`PKT`), acting operator persona, incident UUID, and specific dispatch rosters.
- Prevents post-crisis dispute regarding authorization chains.

---

## 5. Technical Stack & Deployment Architecture

### 5.1 Frontend Architecture
- **Framework**: React 18.3 + Vite 5.4
- **3D Graphics Engine**: Three.js 0.161 + React Three Fiber 8.18 + React Three Drei 9.122
- **Animation & Transitions**: Framer Motion 11.18
- **Iconography**: Lucide React
- **Data Visualization**: Recharts 2.12
- **Network Client**: Fetch API with unified `/api` routing and automated JSON error deserialization.

### 5.2 Backend Architecture
- **Framework**: FastAPI 0.115 (Python 3.11+)
- **ORM & Data Layer**: SQLAlchemy 2.0 with declarative data models
- **Validation**: Pydantic v2.9
- **Database**: SQLite (local development in `rescueai.db`; production serverless in `/tmp/rescueai.db` with nationwide automatic seed script `seed_pakistan.py`)
- **Server**: Uvicorn ASGI

### 5.3 Hosting & Cloud Infrastructure
- **Hosting Provider**: Vercel (Edge CDN + Python Serverless Runtime)
- **Zero Cost Guarantee**: 100% free-tier architecture requiring **0 credit/debit cards**.
- **Continuous Deployment**: Automated Git-push deployment triggers via GitHub `origin/main`.
- **High Availability**: Stateless serverless functions with sub-second cold starts and in-memory self-seeding SQLite storage.

---

## 6. Non-Functional Requirements & Guardrails

| Requirement | Metric / Specification | Verification |
| :--- | :--- | :--- |
| **Response Latency** | Full 6-agent analysis execution < 1200ms | Benchmarked across 56 simultaneous incidents |
| **UI Stability** | 0% unhandled blank-screen crashes | Enforced via React `ErrorBoundary` and `GlobeErrorBoundary` |
| **Human-In-The-Loop** | 100% human confirmation required for dispatch | Enforced via mandatory `approved_by` operator signing |
| **Data Integrity** | Real geodetic coordinates across 29 Pakistani districts | Verified via Haversine geographic boundary validation |
| **Accessibility & Mobile** | Fully responsive layout down to 360px viewport | Responsive flex/grid with touch-enabled 3D orbit controls |

---

## 7. Future Roadmap

- **Phase 2 (Telemetry Integration)**: Live IoT GPS transponder feeds from Rescue 1122 ambulances via WebSocket streaming.
- **Phase 3 (Satellite Imagery Triage)**: Multimodal computer vision analysis of post-disaster synthetic aperture radar (SAR) images for automated flood polygon generation.
- **Phase 4 (Off-Grid Mesh Radio)**: LoRa-based low-bandwidth peer-to-peer transmission for local dispatch when cellular infrastructure fails.

---

*Authored and verified for the RescueAI Core Engineering Team.*  
*National Emergency Operations Command Center // NDMA 1122*
