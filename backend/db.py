import sqlite3
import json
from datetime import datetime

DB_PATH = "triage.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS doctors (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                username   TEXT UNIQUE NOT NULL,
                password   TEXT NOT NULL,
                name       TEXT NOT NULL,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS patients (
                session_id     TEXT PRIMARY KEY,
                doctor_id      INTEGER NOT NULL REFERENCES doctors(id),
                patient_data   TEXT NOT NULL,
                classification TEXT,
                verdict        TEXT,
                status         TEXT DEFAULT 'active',
                timestamp      TEXT NOT NULL
            );
        """)
        try:
            conn.execute("ALTER TABLE patients ADD COLUMN doctor_notes TEXT")
            conn.commit()
        except Exception:
            pass  # column already exists


def create_doctor(username: str, hashed_pw: str, name: str) -> int:
    with get_conn() as conn:
        cur = conn.execute(
            "INSERT INTO doctors (username, password, name) VALUES (?, ?, ?)",
            (username, hashed_pw, name),
        )
        return cur.lastrowid


def get_doctor_by_username(username: str):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM doctors WHERE username = ?", (username,)
        ).fetchone()
        return dict(row) if row else None


def get_doctor_by_id(doctor_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM doctors WHERE id = ?", (doctor_id,)
        ).fetchone()
        return dict(row) if row else None


def save_patient(session_id: str, doctor_id: int, patient_data: dict,
                 classification: dict, verdict: dict, timestamp: str):
    with get_conn() as conn:
        conn.execute(
            """INSERT OR REPLACE INTO patients
               (session_id, doctor_id, patient_data, classification, verdict, timestamp)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                session_id,
                doctor_id,
                json.dumps(patient_data),
                json.dumps(classification) if classification else None,
                json.dumps(verdict) if verdict else None,
                timestamp,
            ),
        )


def get_patients_by_doctor(doctor_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM patients WHERE doctor_id = ? AND status = 'active' ORDER BY timestamp DESC",
            (doctor_id,),
        ).fetchall()
    result = []
    for row in rows:
        r = dict(row)
        r["patient_data"] = json.loads(r["patient_data"]) if r["patient_data"] else {}
        r["classification"] = json.loads(r["classification"]) if r["classification"] else None
        r["verdict"] = json.loads(r["verdict"]) if r["verdict"] else None
        r["doctor_notes"] = json.loads(r["doctor_notes"]) if r.get("doctor_notes") else None
        result.append(r)
    return result


def get_patient_by_session(session_id: str, doctor_id: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT * FROM patients WHERE session_id = ? AND doctor_id = ?",
            (session_id, doctor_id),
        ).fetchone()
    if not row:
        return None
    r = dict(row)
    r["patient_data"]   = json.loads(r["patient_data"])   if r["patient_data"]   else {}
    r["classification"] = json.loads(r["classification"]) if r["classification"] else None
    r["verdict"]        = json.loads(r["verdict"])         if r["verdict"]        else None
    r["doctor_notes"]   = json.loads(r["doctor_notes"])   if r.get("doctor_notes") else None
    return r


def save_doctor_notes(session_id: str, doctor_id: int, notes: dict) -> bool:
    with get_conn() as conn:
        cur = conn.execute(
            "UPDATE patients SET doctor_notes = ? WHERE session_id = ? AND doctor_id = ?",
            (json.dumps(notes), session_id, doctor_id),
        )
        return cur.rowcount > 0


def discharge_patient(session_id: str, doctor_id: int) -> bool:
    with get_conn() as conn:
        cur = conn.execute(
            "UPDATE patients SET status = 'discharged' WHERE session_id = ? AND doctor_id = ?",
            (session_id, doctor_id),
        )
        return cur.rowcount > 0
