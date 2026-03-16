"""
TriageAI — Other Specialty Relevance Agent
Location: backend/app/sub_agents/OtherSpecialtyAgent/agent.py

Lightweight agent. Scores relevance of departments NOT in the
main 6-specialist council. No deep reasoning. Just scores + one-liners.
"""

from google.adk.agents import LlmAgent
from pydantic import BaseModel, Field
from typing import List, Literal, Optional
from app.config import get_model


# ============================================================
# OUTPUT SCHEMA
# ============================================================


class DepartmentScore(BaseModel):
    department: Literal[
        "Orthopedics",
        "ENT",
        "Dermatology",
        "Ophthalmology",
        "Pediatrics",
        "Obstetrics & Gynecology",
        "Psychiatry",
        "Urology",
        "Nephrology",
        "Endocrinology",
        "Oncology",
        "Infectious Disease",
        "General Surgery",
    ] = Field(description="Department name.")

    relevance: float = Field(
        ge=0.0, le=10.0,
        description="0 = irrelevant, 10 = strongly relevant."
    )

    reason: Optional[str] = Field(
        default=None,
        description="One-liner reason. Max 80 chars. Null if relevance < 3."
    )


class OtherSpecialtyOutput(BaseModel):
    departments: List[DepartmentScore] = Field(
        description="Score ALL 13 departments. Most will be 0-2."
    )


# ============================================================
# AGENT
# ============================================================

other_specialty_llm_agent = LlmAgent(
    name="OtherSpecialtyRelevance",
    model=get_model(),
    instruction="""Score how relevant each of the 13 departments is for this patient.

Patient data:
{classification_result}

RULES:
- Use ONLY data from classification_result. Do not invent symptoms or findings.
- Score ALL 13 departments. Most will score 0-2.
- Add a one-line reason (max 80 chars) ONLY if relevance >= 3. Null otherwise.
- Be conservative. 7+ means strong clinical match with actual symptoms/conditions.

QUICK GUIDE:
  0-1: No connection
  2-3: Minor link (risk factor exists, no active concern)
  4-5: Worth noting for follow-up
  6-7: Should be consulted
  8-10: Primary concern territory (rare from this agent)

""",
    output_schema=OtherSpecialtyOutput,
    output_key="other_specialty_opinion",
    include_contents="none",
)