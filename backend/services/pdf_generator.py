import html
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)


def _s(val) -> str:
    """Sanitise value to a plain string and escape HTML entities for Paragraph."""
    if val is None:
        return ""
    return html.escape(str(val))


# ── Shared styles ────────────────────────────────────────────────────────────

BLUE       = colors.HexColor("#0D47A1")
GREY_LINE  = colors.HexColor("#C8C8C8")
GREY_BG    = colors.HexColor("#F5F5F5")
WHITE      = colors.white
BLACK      = colors.black

def _style(name, size=9, font="Helvetica", color=BLACK, align=TA_LEFT, leading=None, bold=False):
    return ParagraphStyle(
        name,
        fontSize=size,
        fontName=f"Helvetica-Bold" if bold else font,
        textColor=color,
        alignment=align,
        leading=leading or (size + 3),
    )


def generate_pdf(patient_data: dict, classification: dict, verdict: dict, doctor_notes: dict | None) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=15*mm, rightMargin=15*mm,
        topMargin=15*mm, bottomMargin=15*mm,
    )

    W = 180 * mm  # usable page width

    s_title    = _style("title",    size=18, bold=True,  color=BLUE,  align=TA_CENTER)
    s_subtitle = _style("subtitle", size=11, color=colors.HexColor("#505050"), align=TA_CENTER)
    s_ts       = _style("ts",       size=9,  color=colors.HexColor("#787878"), align=TA_RIGHT)
    s_section  = _style("section",  size=12, bold=True,  color=BLUE)
    s_body     = _style("body",     size=9)
    s_bold     = _style("bold",     size=9,  bold=True)
    s_small    = _style("small",    size=8)
    s_small_b  = _style("small_b",  size=8,  bold=True)
    s_th       = _style("th",       size=9,  bold=True,  color=WHITE)
    s_td       = _style("td",       size=8)
    s_td_b     = _style("td_b",     size=8,  bold=True)
    s_italic   = _style("italic",   size=8,  font="Helvetica-Oblique", color=colors.HexColor("#787878"))

    story = []

    # ── Header ───────────────────────────────────────────────────────────────
    story.append(Paragraph("YDHYA RAPID TRIAGE SYSTEM", s_title))
    story.append(Paragraph("Clinical Handover Report  -  CONFIDENTIAL", s_subtitle))
    gen_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    story.append(Paragraph(f"Generated: {gen_time}", s_ts))
    story.append(HRFlowable(width="100%", thickness=0.8, color=BLUE, spaceAfter=4*mm))
    story.append(Spacer(1, 2*mm))

    # ── Patient Details ───────────────────────────────────────────────────────
    temp_c = patient_data.get("temperature", 0)
    temp_f = round((float(temp_c) * 9 / 5) + 32, 1) if temp_c else "?"

    pd_data = [
        [Paragraph("<b>Name:</b>",       s_small), Paragraph(_s(patient_data.get("name", "Unknown")), s_small),
         Paragraph("<b>BP:</b>",         s_small), Paragraph(f"{_s(patient_data.get('bp_systolic','?'))}/{_s(patient_data.get('bp_diastolic','?'))} mmHg", s_small)],
        [Paragraph("<b>Age:</b>",        s_small), Paragraph(_s(patient_data.get("age", "?")), s_small),
         Paragraph("<b>HR:</b>",         s_small), Paragraph(f"{_s(patient_data.get('heart_rate','?'))} bpm", s_small)],
        [Paragraph("<b>Gender:</b>",     s_small), Paragraph(_s(patient_data.get("gender", "?")), s_small),
         Paragraph("<b>Temp:</b>",       s_small), Paragraph(f"{temp_f} \u00b0F", s_small)],
        [Paragraph("<b>Symptoms:</b>",   s_small), Paragraph(_s(", ".join(patient_data.get("symptoms", []))), s_small),
         Paragraph("<b>SpO2:</b>",       s_small), Paragraph(f"{_s(patient_data.get('spo2','?'))} %", s_small)],
        [Paragraph("<b>Conditions:</b>", s_small), Paragraph(_s(", ".join(patient_data.get("conditions", [])) or "None"), s_small),
         "", ""],
    ]
    pd_table = Table(pd_data, colWidths=[25*mm, 65*mm, 20*mm, 70*mm])
    pd_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), GREY_BG),
        ("VALIGN",     (0, 0), (-1, -1), "TOP"),
        ("GRID",       (0, 0), (-1, -1), 0.3, GREY_LINE),
        ("PADDING",    (0, 0), (-1, -1), 4),
    ]))
    story.append(pd_table)
    story.append(Spacer(1, 4*mm))

    # ── Risk Strip ────────────────────────────────────────────────────────────
    risk_level        = _s(verdict.get("final_risk_level", verdict.get("ml_risk_level", "Unknown")))
    priority_score    = verdict.get("priority_score", 0)
    recommended_action = _s(verdict.get("recommended_action", ""))
    primary_department = _s(verdict.get("primary_department", ""))

    risk_color_map = {"High": "#B71C1C", "Medium": "#E65100", "Low": "#1B5E20"}
    risk_bg = colors.HexColor(risk_color_map.get(str(verdict.get("final_risk_level", verdict.get("ml_risk_level", ""))), "#646464"))

    strip_text = f"RISK: {risk_level}  |  Priority: {priority_score}/100  |  Action: {recommended_action}  |  Dept: {primary_department}"
    s_strip = _style("strip", size=11, bold=True, color=WHITE, align=TA_CENTER)
    strip_table = Table([[Paragraph(strip_text, s_strip)]], colWidths=[W])
    strip_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), risk_bg),
        ("PADDING",    (0, 0), (-1, -1), 7),
    ]))
    story.append(strip_table)
    story.append(Spacer(1, 4*mm))

    # ── CMO Verdict ───────────────────────────────────────────────────────────
    story.append(Paragraph("CMO VERDICT", s_section))
    story.append(HRFlowable(width="100%", thickness=0.3, color=GREY_LINE, spaceAfter=3*mm))

    explanation = _s(verdict.get("explanation", "No explanation available."))
    story.append(Paragraph(explanation, s_body))
    story.append(Spacer(1, 2*mm))

    key_factors = verdict.get("key_factors", [])
    if key_factors:
        story.append(Paragraph("<b>Key Factors:</b>", s_body))
        for f in key_factors:
            story.append(Paragraph(f"&nbsp;&nbsp;&bull; {_s(f)}", s_body))
        story.append(Spacer(1, 2*mm))

    council_consensus = _s(verdict.get("council_consensus", ""))
    confidence = verdict.get("confidence", 0)
    confidence_str = f"{int(confidence * 100)}%" if isinstance(confidence, float) else _s(confidence)
    story.append(Paragraph(f"<b>Council Consensus:</b> {council_consensus}&nbsp;&nbsp;&nbsp;<b>Confidence:</b> {confidence_str}", s_body))
    story.append(Spacer(1, 4*mm))

    # ── Safety Alerts ─────────────────────────────────────────────────────────
    safety_alerts = verdict.get("safety_alerts", [])
    if safety_alerts:
        story.append(Paragraph("SAFETY ALERTS", s_section))
        story.append(HRFlowable(width="100%", thickness=0.3, color=GREY_LINE, spaceAfter=3*mm))

        s_alert = _style("alert", size=9, bold=True, color=WHITE)
        for alert in safety_alerts:
            sev     = alert.get("severity", "WARNING")
            source  = _s(alert.get("source", ""))
            label   = _s(alert.get("label", ""))
            pattern = _s(alert.get("pattern", ""))
            text    = f"[{source}] {label}" + (f" - {pattern}" if pattern else "")
            alert_bg = colors.HexColor("#B71C1C" if sev == "CRITICAL" else "#E65100")
            t = Table([[Paragraph(text, s_alert)]], colWidths=[W])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), alert_bg),
                ("PADDING",    (0, 0), (-1, -1), 5),
            ]))
            story.append(t)
            story.append(Spacer(1, 1*mm))
        story.append(Spacer(1, 3*mm))

    # ── Workup Recommendations ────────────────────────────────────────────────
    workup = verdict.get("consolidated_workup", [])
    if workup:
        story.append(Paragraph("WORKUP RECOMMENDATIONS", s_section))
        story.append(HRFlowable(width="100%", thickness=0.3, color=GREY_LINE, spaceAfter=3*mm))

        priority_color_map = {"STAT": "#B71C1C", "URGENT": "#E65100", "ROUTINE": "#969696"}

        workup_data = [[
            Paragraph("Test",       s_th),
            Paragraph("Priority",   s_th),
            Paragraph("Ordered By", s_th),
            Paragraph("Rationale",  s_th),
        ]]
        for item in workup:
            test       = _s(item.get("test", ""))
            priority   = _s(item.get("priority", "ROUTINE"))
            ordered_by = _s(", ".join(item.get("ordered_by", [])))
            rationale  = _s(item.get("rationale", ""))
            workup_data.append([
                Paragraph(test, s_td),
                Paragraph(priority, _style("pri", size=8, bold=True, color=WHITE)),
                Paragraph(ordered_by, s_td),
                Paragraph(rationale, s_td),
            ])

        workup_table = Table(workup_data, colWidths=[55*mm, 25*mm, 45*mm, 55*mm])
        ts = [
            ("BACKGROUND", (0, 0), (-1, 0),  BLUE),
            ("VALIGN",     (0, 0), (-1, -1), "TOP"),
            ("GRID",       (0, 0), (-1, -1), 0.5, GREY_LINE),
            ("PADDING",    (0, 0), (-1, -1), 4),
        ]
        for i, item in enumerate(workup, start=1):
            pc = colors.HexColor(priority_color_map.get(_s(item.get("priority", "ROUTINE")), "#969696"))
            ts.append(("BACKGROUND", (1, i), (1, i), pc))
        workup_table.setStyle(TableStyle(ts))
        story.append(workup_table)
        story.append(Spacer(1, 4*mm))

    # ── Specialist Council Summary ─────────────────────────────────────────────
    summaries = verdict.get("specialist_summaries", [])
    if summaries:
        story.append(Paragraph("SPECIALIST COUNCIL SUMMARY", s_section))
        story.append(HRFlowable(width="100%", thickness=0.3, color=GREY_LINE, spaceAfter=3*mm))

        sum_data = [[
            Paragraph("Specialty",  s_th),
            Paragraph("Relevance",  s_th),
            Paragraph("Urgency",    s_th),
            Paragraph("Confidence", s_th),
            Paragraph("One-liner",  s_th),
        ]]
        for sp in summaries:
            is_primary = sp.get("claims_primary", False)
            s = s_td_b if is_primary else s_td
            sum_data.append([
                Paragraph(_s(sp.get("specialty", "")),       s),
                Paragraph(_s(sp.get("relevance_score", 0)),  s_td),
                Paragraph(_s(sp.get("urgency_score", 0)),    s_td),
                Paragraph(_s(sp.get("confidence", "")),      s_td),
                Paragraph(_s(sp.get("one_liner", "")),       s_td),
            ])

        sum_table = Table(sum_data, colWidths=[40*mm, 22*mm, 22*mm, 22*mm, 74*mm])
        sum_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0),  BLUE),
            ("VALIGN",     (0, 0), (-1, -1), "TOP"),
            ("GRID",       (0, 0), (-1, -1), 0.5, GREY_LINE),
            ("PADDING",    (0, 0), (-1, -1), 4),
            ("ALIGN",      (1, 1), (3, -1),  "CENTER"),
        ]))
        story.append(sum_table)
        story.append(Spacer(1, 4*mm))

    # ── Doctor's Notes ─────────────────────────────────────────────────────────
    if doctor_notes:
        story.append(Paragraph("DOCTOR'S NOTES", s_section))
        story.append(HRFlowable(width="100%", thickness=0.3, color=GREY_LINE, spaceAfter=3*mm))

        doctor_name = _s(doctor_notes.get("doctor_name", ""))
        designation = _s(doctor_notes.get("designation", ""))
        doctor_line = f"<b>Doctor:</b> {doctor_name}" + (f" &nbsp;|&nbsp; <b>Designation:</b> {designation}" if designation else "")
        story.append(Paragraph(doctor_line, s_body))
        story.append(Spacer(1, 2*mm))
        story.append(Paragraph("<b>Clinical Impression:</b>", s_body))
        story.append(Paragraph(_s(doctor_notes.get("clinical_impression", "")), s_body))
        story.append(Spacer(1, 2*mm))

        suggestions = doctor_notes.get("suggestions", "")
        if suggestions:
            story.append(Paragraph("<b>Additional Suggestions:</b>", s_body))
            story.append(Paragraph(_s(suggestions), s_body))
            story.append(Spacer(1, 2*mm))

        raw_ts = doctor_notes.get("saved_at", "")
        try:
            saved_at = datetime.fromisoformat(str(raw_ts)).strftime("%d %b %Y, %I:%M %p")
        except (ValueError, TypeError):
            saved_at = str(raw_ts)
        story.append(Paragraph(f"Notes saved: {saved_at}", s_italic))

    # ── AI Disclaimer ─────────────────────────────────────────────────────────
    story.append(Spacer(1, 6*mm))
    story.append(HRFlowable(width="100%", thickness=0.3, color=GREY_LINE))
    s_disclaimer = _style("disclaimer", size=8, font="Helvetica-Oblique",
                          color=colors.HexColor("#9E9E9E"), align=TA_CENTER)
    story.append(Paragraph(
        "AI-assisted triage. Clinical decisions remain the responsibility of the treating physician.",
        s_disclaimer,
    ))

    doc.build(story)
    return buf.getvalue()
