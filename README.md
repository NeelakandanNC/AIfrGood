# Ydhya — AI-Powered Rapid Triage System

Ydhya is a multi-agent AI triage system that analyses patient vitals, symptoms, and history in seconds — delivering specialist-level clinical decisions to emergency departments. A coordinated pipeline of Google ADK agents (ML classifier → specialist council → CMO review) produces a fully structured verdict with workup orders, safety alerts, and a downloadable PDF clinical handover report.

---

## Architecture

```
Patient Intake (React Frontend)
        │
        ▼
   POST /api/triage ──► FastAPI Backend (JWT Auth + SQLite)
        │
        ▼
   SSE Stream ◄── Google ADK Multi-Agent Pipeline
                        │
                        ├── ClassificationAgent  (XGBoost ML risk prediction)
                        ├── SpecialistCouncil    (parallel specialist evaluation)
                        │     ├── CardiologyAgent
                        │     ├── NeurologyAgent
                        │     ├── PulmonologyAgent
                        │     ├── EmergencyMedicineAgent
                        │     ├── GeneralMedicineAgent
                        │     └── OtherSpecialityAgent
                        └── CMOAgent             (final verdict & workup consolidation)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Material UI, Recharts, Zustand |
| Backend | Python, FastAPI, Google ADK |
| ML Model | XGBoost classifier (Low / Medium / High risk) |
| LLM | Gemini 2.0 Flash (via Google ADK) |
| Database | SQLite (doctors, patients, notes) |
| Auth | JWT (bcrypt password hashing) |
| Streaming | Server-Sent Events (SSE) |
| PDF | ReportLab (clinical handover reports) |

---

## Project Structure

```
pragyanxkanini/
├── backend/
│   ├── server.py                   # FastAPI app — CORS, auth, routes, SSE, PDF
│   ├── auth.py                     # JWT creation & verification
│   ├── db.py                       # SQLite helpers
│   ├── app/
│   │   ├── agent.py                # Root SequentialAgent
│   │   ├── config.py               # Gemini model config
│   │   └── sub_agents/
│   │       ├── ClassificationAgent/
│   │       ├── CMOAgent/
│   │       ├── IngestAgent/
│   │       └── SpecialistCouncil/
│   │           └── sub_agents/     # 6 specialist agents
│   ├── services/
│   │   ├── ml_classifier.py        # XGBoost inference wrapper
│   │   └── pdf_generator.py        # ReportLab clinical PDF
│   ├── model/                      # Trained XGBoost model + label encoder
│   ├── triage.db                   # SQLite database (auto-created)
│   └── .env                        # Secrets (not committed)
├── frontend/
│   └── src/
│       ├── api/                    # triageApi.js, quickTriageApi.js
│       ├── state/                  # Zustand store
│       ├── layouts/                # DashboardLayout (hover-expand sidebar)
│       ├── pages/                  # TriagePage, ResultPage, CouncilPage,
│       │                           #   QueuePage, AnalyticsPage,
│       │                           #   QuickTriagePage, AboutPage, LoginPage
│       ├── components/
│       │   ├── common/             # RiskBadge, PriorityCircle, ActionChip
│       │   ├── intake/             # PatientForm, DocumentUpload
│       │   ├── stream/             # SSELogPanel (live pipeline terminal)
│       │   ├── result/             # VerdictHeader, SafetyAlerts, WorkupTable
│       │   └── council/            # CouncilRadar, SpecialistCard
│       └── theme.js
└── README.md
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Google AI Studio API key

### 1. Backend

```bash
cd backend

# Install dependencies
pip install fastapi uvicorn google-adk python-dotenv pydantic \
            xgboost scikit-learn reportlab bcrypt python-jose

# Configure environment
echo "GOOGLE_API_KEY=your_key_here" > .env
echo "JWT_SECRET=any_random_secret" >> .env

# Start server
uvicorn server:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173** — Vite proxies `/api` to the backend.

---

## Usage

### Triage Flow

1. **Login** — Register or log in as a doctor
2. **New Triage** — Enter patient demographics, vitals (BP, HR, SpO₂, Temp), symptoms, and conditions
3. **Live Stream** — Watch the SSE log as the pipeline processes in real-time
4. **Results** — Full verdict with risk level, priority score (0–100), safety alerts, workup plan, and department routing
5. **Council View** — Radar chart + individual specialist cards with scores, flags, and differentials
6. **Patient Queue** — Priority-sorted table of all active patients with risk/department filters
7. **Analytics** — Risk distribution, department load, alert frequency, trend charts
8. **Quick Triage** — Offline ML-only classification for rapid screening
9. **About** — Overview of Ydhya for new practitioners and stakeholders

### PDF Report

Available on the Result page. Includes: patient details, risk strip, CMO verdict, key factors, safety alerts, workup table, specialist council summary, and doctor's notes.

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new doctor |
| POST | `/api/auth/login` | Login — returns JWT + doctor profile |

### Triage

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/triage` | Start triage, returns `session_id` |
| GET | `/api/triage/stream/{session_id}` | SSE stream of pipeline events |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/patients` | All active patients |
| GET | `/api/dashboard/stats` | Aggregated stats |

### Patient

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/api/patients/{id}` | Discharge patient |
| GET | `/api/patients/{id}/notes` | Fetch doctor's notes |
| POST | `/api/patients/{id}/notes` | Save doctor's notes |
| GET | `/api/patients/{id}/report.pdf` | Download PDF report |

### SSE Event Types

| Event | Description |
|-------|-------------|
| `status` | Pipeline progress updates |
| `classification_result` | ML risk classification output |
| `specialist_opinion` | Per-specialist assessment |
| `cmo_verdict` | Final verdict with workup, alerts, routing |
| `complete` | Pipeline finished |
| `error` | Pipeline error |
