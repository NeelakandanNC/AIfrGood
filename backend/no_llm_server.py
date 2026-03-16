"""
Ydhya — Offline Quick Triage Server
No LLM, no ADK, no auth, no DB.
Runs entirely on local XGBoost model.

Start: uvicorn no_llm_server:app --reload --port 8001
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv

load_dotenv()

from services.ml_classifier import (
    build_model_input,
    predict,
    compute_vital_severity,
)

app = FastAPI(title="Ydhya Quick Triage", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Request schema ─────────────────────────────────────────────────────────────

class QuickTriageRequest(BaseModel):
    name: str = ""
    age: int
    gender: str = "Male"
    bp_systolic: float
    bp_diastolic: float
    heart_rate: float
    temperature: float          # Celsius from frontend
    spo2: float
    symptoms: List[str] = []
    conditions: List[str] = []

# ── Response schema ────────────────────────────────────────────────────────────

class QuickTriageResponse(BaseModel):
    risk_level: str
    confidence: float
    action: str
    summary: str
    vital_flags: List[str]
    contributing_factors: List[str]
    confidence_breakdown: dict
    derived_metrics: dict

# ── Action mapping ─────────────────────────────────────────────────────────────

_ACTIONS = {
    "High":   "Immediate — Send to Emergency",
    "Medium": "Urgent — Doctor consultation within 30 minutes",
    "Low":    "Standard — OPD care, monitor vitals",
}

# ── Report builder ─────────────────────────────────────────────────────────────

def generate_human_report(data: dict, prediction: dict, vitals_result: dict) -> dict:
    risk_level = prediction["risk_level"]
    action     = _ACTIONS.get(risk_level, "Consult a doctor")
    symptoms   = data.get("symptoms", [])
    conditions = data.get("conditions", [])

    # Summary
    symptom_text   = ", ".join(s.replace("_", " ") for s in symptoms[:3]) if symptoms else "no specific symptoms"
    condition_text = ", ".join(c.replace("_", " ") for c in conditions[:2]) if conditions else "no known pre-existing conditions"

    summary = (
        f"This patient is at {risk_level.upper()} risk. "
        f"Presenting with {symptom_text}"
        + (f" and a history of {condition_text}" if conditions else "")
        + f", with a comorbidity burden rated as '{vitals_result['comorbidity_level']}'. "
        f"Vital severity is '{vitals_result['vital_severity_level']}' "
        f"(score: {vitals_result['vital_severity_score']})."
    )

    # Vital flags
    vital_flags = []
    bp_sys  = data.get("bp_systolic", 120)
    bp_dia  = data.get("bp_diastolic", 80)
    hr      = data.get("heart_rate", 75)
    temp_f  = data.get("temperature", 98.6)  # already converted to F by endpoint
    spo2    = data.get("spo2", 97)

    if bp_sys >= 180 or bp_dia >= 120:
        vital_flags.append(f"Blood pressure critically high ({bp_sys}/{bp_dia} mmHg)")
    elif bp_sys >= 160 or bp_dia >= 100:
        vital_flags.append(f"Blood pressure elevated ({bp_sys}/{bp_dia} mmHg)")
    elif bp_sys < 90:
        vital_flags.append(f"Blood pressure critically low ({bp_sys} mmHg systolic)")

    if hr > 130:
        vital_flags.append(f"Heart rate dangerously high ({hr} bpm)")
    elif hr > 100:
        vital_flags.append(f"Heart rate elevated ({hr} bpm)")
    elif hr < 50:
        vital_flags.append(f"Heart rate dangerously low ({hr} bpm)")

    if spo2 < 85:
        vital_flags.append(f"SpO2 critically low ({spo2}%) — oxygen support needed")
    elif spo2 < 90:
        vital_flags.append(f"SpO2 severely low ({spo2}%)")
    elif spo2 < 94:
        vital_flags.append(f"SpO2 below normal ({spo2}%)")

    if temp_f >= 104.0:
        vital_flags.append(f"Fever critically high ({temp_f:.1f}°F)")
    elif temp_f >= 102.0:
        vital_flags.append(f"Fever high ({temp_f:.1f}°F)")
    elif temp_f >= 100.4:
        vital_flags.append(f"Mild fever ({temp_f:.1f}°F)")

    if not vital_flags:
        vital_flags.append("All vitals within normal range")

    # Contributing factors
    contributing_factors = []
    if symptoms:
        nice = [s.replace("_", " ") for s in symptoms]
        contributing_factors.append(f"Symptom(s) present: {', '.join(nice)}")
    if conditions:
        nice = [c.replace("_", " ") for c in conditions]
        contributing_factors.append(f"Pre-existing: {', '.join(nice)}")

    comorbidity = vitals_result["comorbidity_level"]
    if comorbidity != "none":
        contributing_factors.append(f"Comorbidity burden: {comorbidity}")

    vscore = vitals_result["vital_severity_score"]
    if vscore >= 4:
        contributing_factors.append(f"Vital severity score: {vscore} (abnormal)")

    return {
        "action":                action,
        "summary":               summary,
        "vital_flags":           vital_flags,
        "contributing_factors":  contributing_factors,
    }

# ── Endpoint ───────────────────────────────────────────────────────────────────

@app.post("/api/quick-triage", response_model=QuickTriageResponse)
async def quick_triage(req: QuickTriageRequest):
    try:
        data = req.model_dump()

        # Convert Celsius → Fahrenheit (model trained on °F)
        data["temperature"] = data["temperature"] * 9 / 5 + 32

        df            = build_model_input(data)
        prediction    = predict(df)
        vitals_result = compute_vital_severity(data)
        report        = generate_human_report(data, prediction, vitals_result)

        return QuickTriageResponse(
            risk_level=prediction["risk_level"],
            confidence=prediction["max_confidence"],
            action=report["action"],
            summary=report["summary"],
            vital_flags=report["vital_flags"],
            contributing_factors=report["contributing_factors"],
            confidence_breakdown=prediction["confidence"],
            derived_metrics={
                "vital_severity_score": vitals_result["vital_severity_score"],
                "vital_severity_level": vitals_result["vital_severity_level"],
                "comorbidity_risk_score": vitals_result["comorbidity_risk_score"],
                "comorbidity_level": vitals_result["comorbidity_level"],
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "ok", "mode": "offline-ml"}
