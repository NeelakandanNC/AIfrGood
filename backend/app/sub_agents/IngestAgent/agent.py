from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from app.config import get_model

# ============================================================
# OUTPUT SCHEMA (The Target Format)
# ============================================================
class StructuredPatientData(BaseModel):
    """The standardized patient profile used for downstream specialists."""
    patient_id: str = Field(description="Unique patient identifier (e.g., PT-2026-001)")
    name: str = Field(description="Patient's full name")
    age: int = Field(description="Age in years")
    gender: Literal["Male", "Female", "Other"] = Field(description="Biological gender")
    symptoms: List[str] = Field(description="List of current presenting symptoms (e.g., 'nausea', 'dizziness')")
    bp_systolic: int = Field(description="Systolic blood pressure (mmHg)")
    bp_diastolic: int = Field(description="Diastolic blood pressure (mmHg)")
    heart_rate: int = Field(description="Heart rate (BPM)")
    temperature: float = Field(description="Body temperature in Fahrenheit")
    spo2: int = Field(description="Oxygen saturation percentage")
    conditions: List[str] = Field(description="Pre-existing medical conditions (e.g., 'diabetes')")
    weight_kg: Optional[float] = Field(default=None, description="Body weight in kilograms")
    height_cm: Optional[float] = Field(default=None, description="Height in centimetres")
    bmi: Optional[float] = Field(default=None, description="Body Mass Index (kg/m²); obesity >30 is cardiac/metabolic risk, <18.5 is malnutrition/cachexia risk")
    additional_info: Optional[str] = Field(default=None, description="Additional clinical context: family history, allergies, current medications, recent travel, etc.")

# ============================================================
# INGEST AGENT DEFINITION
# ============================================================
IngestAgent = LlmAgent(
    name="DataIngestAgent",
    model=get_model(),
    instruction="""
    You are a meticulous Clinical Data Coordinator in a high-pressure District Hospital.
    Your task is to convert raw, unstructured triage data into a clean, validated JSON schema.

    You can take raw data from : 
    {user_input}

    STRICT NORMALIZATION RULES:
    1. EXTRACT IDs: Identify strings like PT-XXXX and map to patient_id.
    2. VITALS EXTRACTION:
       - If BP is "155/95", bp_systolic=155 and bp_diastolic=95.
       - If pulse is mentioned, map to heart_rate.
       - If SpO2/Saturation is mentioned, map to spo2.
    3. TEMPERATURE: If "normal", use 98.6. If in Celsius, convert to Fahrenheit.
    4. LISTS: Flatten symptoms and conditions into lists of lowercase strings.
    5. DEFAULTS: If a vital is missing and no clue is provided, use a clinically
       neutral value (e.g., spo2: 98, heart_rate: 72) but prioritize extraction.
    6. ANTHROPOMETRY: If weight_kg or height_cm are present in the input, pass them through
       unchanged. If bmi is already computed in the input, use it; otherwise compute it as
       weight_kg / (height_cm/100)^2 rounded to 1 decimal. Leave these as null if not provided.
    7. ADDITIONAL INFO: Pass through additional_info as-is without any modification or
       summarisation. Leave as null if not provided.
    """,
    output_schema=StructuredPatientData,
    output_key="raw_data",
    include_contents="none",
)