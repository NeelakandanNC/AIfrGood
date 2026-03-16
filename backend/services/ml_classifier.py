"""
ML Classifier Service — standalone, no ADK/LLM dependencies.
Loaded once at module import (singleton pattern).
"""

import pickle
import logging
import pandas as pd
from pathlib import Path

logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
_BASE = Path(__file__).parent.parent / "model"
MODEL_PATH   = _BASE / "model.pkl"
ENCODER_PATH = _BASE / "label_encoder.pkl"

# ── Feature lists (must match training) ────────────────────────────────────────
ALL_SYMPTOMS = [
    "chest_pain", "breathlessness", "headache", "fever", "cough",
    "abdominal_pain", "nausea", "vomiting", "dizziness", "fatigue",
    "palpitations", "back_pain", "joint_pain", "diarrhea", "sore_throat",
    "body_ache", "weakness", "blurred_vision", "numbness", "confusion",
    "seizures", "blood_in_stool", "weight_loss", "sweating", "swelling",
    "burning_urination", "rash", "cold", "wheezing", "loss_of_appetite",
]

ALL_CONDITIONS = [
    "diabetes", "hypertension", "asthma", "copd", "heart_disease",
    "kidney_disease", "liver_disease", "thyroid", "tuberculosis",
    "cancer", "hiv", "anemia", "obesity",
]

# ── Singleton model load ────────────────────────────────────────────────────────
_model = None
_label_encoder = None


def load_model():
    global _model, _label_encoder
    if _model is not None:
        return
    try:
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
        with open(ENCODER_PATH, "rb") as f:
            _label_encoder = pickle.load(f)
        logger.info("ML Classifier: model loaded OK")
    except Exception as e:
        logger.error(f"ML Classifier: model load failed — {e}")
        raise


def _ensure_loaded():
    if _model is None:
        load_model()


# ── Public API ─────────────────────────────────────────────────────────────────

def build_model_input(data: dict) -> pd.DataFrame:
    """Convert raw patient dict → feature DataFrame (must match training schema)."""
    symptoms   = data.get("symptoms", [])
    conditions = data.get("conditions", [])
    gender_str = data.get("gender", "Male")

    row = {
        "age":    data["age"],
        "gender": 0 if gender_str.lower() == "male" else 1,
    }
    for s in ALL_SYMPTOMS:
        row[f"symptom_{s}"] = int(s in symptoms)

    row["bp_systolic"]  = data["bp_systolic"]
    row["bp_diastolic"] = data["bp_diastolic"]
    row["heart_rate"]   = data["heart_rate"]
    row["temperature"]  = data["temperature"]   # Fahrenheit
    row["spo2"]         = data["spo2"]

    for c in ALL_CONDITIONS:
        row[f"condition_{c}"] = int(c in conditions)

    row["has_pre_existing"] = int(len(conditions) > 0)
    row["num_symptoms"]     = len(symptoms)
    row["num_conditions"]   = len(conditions)

    return pd.DataFrame([row])


def predict(df: pd.DataFrame) -> dict:
    """Run XGBoost inference. Returns risk_level, confidence dict, max_confidence."""
    _ensure_loaded()
    risk_code  = _model.predict(df)[0]
    risk_label = _label_encoder.inverse_transform([risk_code])[0]
    probs      = _model.predict_proba(df)[0]

    confidence = {
        str(cls): round(float(p) * 100, 1)
        for cls, p in zip(_label_encoder.classes_, probs)
    }
    return {
        "risk_level":     risk_label,
        "confidence":     confidence,
        "max_confidence": round(float(max(probs)) * 100, 1),
    }


def compute_vital_severity(data: dict) -> dict:
    """Rule-based vital severity + comorbidity scoring."""
    bp_sys = data.get("bp_systolic",  120)
    bp_dia = data.get("bp_diastolic", 80)
    hr     = data.get("heart_rate",   75)
    temp   = data.get("temperature",  98.6)   # Fahrenheit
    spo2   = data.get("spo2",         97)

    score = 0
    if   bp_sys >= 180 or bp_dia >= 120: score += 3
    elif bp_sys >= 160 or bp_dia >= 100: score += 2
    elif bp_sys >= 140 or bp_dia >= 90:  score += 1
    elif bp_sys < 90:                    score += 3

    if   hr > 130 or hr < 50:  score += 3
    elif hr > 110 or hr < 55:  score += 2
    elif hr > 100:              score += 1

    if   temp >= 104.0: score += 3
    elif temp >= 102.0: score += 2
    elif temp >= 100.4: score += 1

    if   spo2 < 85: score += 4
    elif spo2 < 90: score += 3
    elif spo2 < 94: score += 2
    elif spo2 < 96: score += 1

    severe   = {"heart_disease", "cancer", "kidney_disease", "hiv"}
    moderate = {"diabetes", "hypertension", "copd", "liver_disease"}
    comorbidity = 0
    for c in data.get("conditions", []):
        if c in severe:   comorbidity += 2
        elif c in moderate: comorbidity += 1

    return {
        "vital_severity_score": score,
        "vital_severity_level": (
            "critical" if score >= 8 else
            "elevated" if score >= 4 else
            "normal"
        ),
        "comorbidity_risk_score": comorbidity,
        "comorbidity_level": (
            "high"     if comorbidity >= 3 else
            "moderate" if comorbidity >= 1 else
            "none"
        ),
    }


# Pre-load at import time so the first request is fast
try:
    load_model()
except Exception:
    pass  # server startup will log the error; endpoint will surface it on call
