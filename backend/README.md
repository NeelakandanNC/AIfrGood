# Ydhya — Backend

The Ydhya backend is an AI-powered clinical triage engine for emergency departments. It combines an XGBoost ML classifier with a council of specialised LLM agents (via Google ADK) to produce structured clinical verdicts, and exposes a FastAPI server with JWT auth, SQLite persistence, SSE streaming, and ReportLab PDF generation.

---

## System Architecture

### Agent Pipeline

```
Patient Input → ClassificationAgent → SpecialistCouncil (Parallel) → CMOAgent → Verdict
```

| Stage | Agent | Type | Role |
|-------|-------|------|------|
| 1 | **ClassificationAgent** | XGBoost ML | Predicts Low / Medium / High risk from vitals + comorbidities |
| 2 | **SpecialistCouncil** | Parallel LLM group | 6 specialists evaluate concurrently — Cardiology, Neurology, Pulmonology, Emergency Medicine, General Medicine, Other Specialty |
| 3 | **CMOAgent** | Meta-reasoner LLM | Synthesises council opinions, resolves conflicts, produces final structured verdict |

### Post-Processing (`server.py`)

After the ADK pipeline completes, the server enriches the raw CMO output with:
- Consolidated workup (deduped, sorted by STAT → URGENT → ROUTINE)
- Safety alerts (RED_FLAG → CRITICAL, YELLOW_FLAG → WARNING)
- Specialist summaries and council consensus label
- Priority score (0–100)
- Dissenting opinions and secondary department flags

---

## Directory Structure

```
backend/
├── server.py                   # FastAPI app — CORS, auth, routes, SSE, PDF
├── auth.py                     # JWT creation, verification, bcrypt hashing
├── db.py                       # SQLite helpers (doctors, patients, notes)
├── no_llm_server.py            # Lightweight server (ML-only, no LLM)
├── app/
│   ├── agent.py                # Root SequentialAgent
│   ├── config.py               # Gemini model config (get_model())
│   └── sub_agents/
│       ├── ClassificationAgent/
│       ├── IngestAgent/
│       ├── CMOAgent/
│       └── SpecialistCouncil/
│           └── sub_agents/
│               ├── CardiologyAgent/
│               ├── NeurologyAgent/
│               ├── PulmonologyAgent/
│               ├── EmergencyMedicine/
│               ├── GeneralMedicine/
│               └── OtherSpecialityAgent/
├── services/
│   ├── ml_classifier.py        # XGBoost inference wrapper
│   └── pdf_generator.py        # ReportLab clinical handover PDF
├── model/
│   ├── model.pkl               # Trained XGBoost classifier
│   └── label_encoder.pkl       # Risk-level label encoder
├── triage.db                   # SQLite database (auto-created on startup)
└── .env                        # Secrets (not committed)
```

---

## Setup

### Prerequisites

- Python 3.10+
- Google AI Studio API key (`GOOGLE_API_KEY`)

### Installation

```bash
cd backend
pip install fastapi uvicorn google-adk python-dotenv pydantic \
            xgboost scikit-learn reportlab bcrypt python-jose
```

### Environment Variables

Create `backend/.env`:

```env
GOOGLE_API_KEY=your_google_ai_studio_key
JWT_SECRET=any_random_secret_string
```

### Run

```bash
uvicorn server:app --reload --port 8000
```

The SQLite database (`triage.db`) is created automatically on first startup.

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new doctor account |
| POST | `/api/auth/login` | Login — returns JWT + doctor profile |

### Triage

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/triage` | Start triage session — returns `{ session_id }` |
| GET | `/api/triage/stream/{session_id}` | SSE stream — events: `status`, `classification_result`, `specialist_opinion`, `cmo_verdict`, `complete`, `error` |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/patients` | All active patients for the logged-in doctor |
| GET | `/api/dashboard/stats` | Aggregate stats (risk distribution, dept load, alert counts) |

### Patient Actions *(JWT required)*

| Method | Endpoint | Description |
|--------|----------|-------------|
| DELETE | `/api/patients/{session_id}` | Discharge patient |
| GET | `/api/patients/{session_id}/notes` | Fetch saved doctor's notes |
| POST | `/api/patients/{session_id}/notes` | Save doctor's notes |
| GET | `/api/patients/{session_id}/report.pdf` | Download PDF clinical handover report |

---

## PDF Report

Generated with **ReportLab** (`services/pdf_generator.py`). Sections:

1. Header — system name, timestamp, confidentiality notice
2. Patient details + vitals (temperature in °F)
3. Risk assessment strip (colour-coded: High=red, Medium=orange, Low=green)
4. CMO verdict — explanation, key factors, council consensus, confidence
5. Safety alerts — CRITICAL (red) and WARNING (orange)
6. Workup recommendations table — Test / Priority / Ordered By / Rationale (full text, auto-wrapping rows)
7. Specialist council summary table (full one-liner, auto-wrapping rows)
8. Doctor's notes — rendered only if notes have been saved

---

## Database Schema

```sql
CREATE TABLE doctors (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,       -- bcrypt hash
    name       TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE patients (
    session_id     TEXT PRIMARY KEY,
    doctor_id      INTEGER NOT NULL REFERENCES doctors(id),
    patient_data   TEXT NOT NULL,   -- JSON
    classification TEXT,            -- JSON
    verdict        TEXT,            -- JSON (enriched CMO verdict)
    doctor_notes   TEXT,            -- JSON
    status         TEXT DEFAULT 'active',
    timestamp      TEXT NOT NULL
);
```

---

## AI Details

- **ML Model**: XGBoost Classifier — predicts Low / Medium / High risk from vitals and comorbidities
- **LLM**: `gemini-2.0-flash` for all specialist and CMO agents
- **Safety principle**: CMO applies a worst-case escalation rule — any credible RED_FLAG from any specialist overrides a lower ML risk prediction
- **Agent framework**: Google ADK (`SequentialAgent` → `ParallelAgent` → `LlmAgent`)
