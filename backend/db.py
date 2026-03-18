import os
import json
import psycopg2
import psycopg2.extras


def get_conn():
    url = os.getenv("DATABASE_URL", "").strip('"').strip("'")
    if not url:
        raise RuntimeError("DATABASE_URL is not set")
    return psycopg2.connect(url)


def init_db():
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS doctors (
                id             SERIAL PRIMARY KEY,
                username       TEXT UNIQUE NOT NULL,
                password       TEXT NOT NULL,
                name           TEXT NOT NULL,
                facility_level TEXT DEFAULT 'District Hospital',
                created_at     TIMESTAMP DEFAULT NOW()
            )
        """)
        # Add facility_level to existing tables (safe migration)
        cur.execute("""
            ALTER TABLE doctors ADD COLUMN IF NOT EXISTS facility_level TEXT DEFAULT 'District Hospital'
        """)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                session_id    TEXT PRIMARY KEY,
                doctor_id     INTEGER NOT NULL REFERENCES doctors(id),
                patient_data  TEXT NOT NULL,
                classification TEXT,
                verdict       TEXT,
                status        TEXT DEFAULT 'active',
                timestamp     TEXT NOT NULL,
                doctor_notes  TEXT,
                in_time       TEXT
            )
        """)
        cur.execute("""
            ALTER TABLE patients ADD COLUMN IF NOT EXISTS in_time TEXT
        """)
        conn.commit()
    finally:
        conn.close()


def create_doctor(username: str, hashed_pw: str, name: str, facility_level: str = "District Hospital") -> int:
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO doctors (username, password, name, facility_level) VALUES (%s, %s, %s, %s) RETURNING id",
            (username, hashed_pw, name, facility_level),
        )
        doctor_id = cur.fetchone()[0]
        conn.commit()
        return doctor_id
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def update_facility_level(doctor_id: int, facility_level: str) -> bool:
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE doctors SET facility_level = %s WHERE id = %s",
            (facility_level, doctor_id),
        )
        updated = cur.rowcount > 0
        conn.commit()
        return updated
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_doctor_by_username(username: str) -> dict | None:
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM doctors WHERE username = %s", (username,))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_doctor_by_id(doctor_id: int) -> dict | None:
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM doctors WHERE id = %s", (doctor_id,))
        row = cur.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def save_patient(session_id: str, doctor_id: int, patient_data: dict,
                 classification: dict, verdict: dict, timestamp: str, in_time: str = None):
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO patients (session_id, doctor_id, patient_data, classification, verdict, timestamp, in_time)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (session_id) DO UPDATE SET
                classification = EXCLUDED.classification,
                verdict        = EXCLUDED.verdict,
                timestamp      = EXCLUDED.timestamp,
                in_time        = EXCLUDED.in_time
        """, (
            session_id,
            doctor_id,
            json.dumps(patient_data),
            json.dumps(classification) if classification else None,
            json.dumps(verdict) if verdict else None,
            timestamp,
            in_time,
        ))
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def get_patients_by_doctor(doctor_id: int) -> list[dict]:
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT * FROM patients WHERE doctor_id = %s AND status = 'active' ORDER BY timestamp DESC",
            (doctor_id,),
        )
        rows = cur.fetchall()
        result = []
        for row in rows:
            r = dict(row)
            r["patient_data"] = json.loads(r["patient_data"]) if r["patient_data"] else {}
            r["classification"] = json.loads(r["classification"]) if r["classification"] else {}
            r["verdict"] = json.loads(r["verdict"]) if r["verdict"] else {}
            r["doctor_notes"] = json.loads(r["doctor_notes"]) if r["doctor_notes"] else None
            result.append(r)
        return result
    finally:
        conn.close()


def get_patient_by_session(session_id: str, doctor_id: int) -> dict | None:
    conn = get_conn()
    try:
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT * FROM patients WHERE session_id = %s AND doctor_id = %s",
            (session_id, doctor_id),
        )
        row = cur.fetchone()
        if not row:
            return None
        r = dict(row)
        r["patient_data"] = json.loads(r["patient_data"]) if r["patient_data"] else {}
        r["classification"] = json.loads(r["classification"]) if r["classification"] else {}
        r["verdict"] = json.loads(r["verdict"]) if r["verdict"] else {}
        r["doctor_notes"] = json.loads(r["doctor_notes"]) if r["doctor_notes"] else None
        return r
    finally:
        conn.close()


def save_doctor_notes(session_id: str, doctor_id: int, notes: dict) -> bool:
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE patients SET doctor_notes = %s WHERE session_id = %s AND doctor_id = %s",
            (json.dumps(notes), session_id, doctor_id),
        )
        updated = cur.rowcount > 0
        conn.commit()
        return updated
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def discharge_patient(session_id: str, doctor_id: int) -> bool:
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute(
            "UPDATE patients SET status = 'discharged' WHERE session_id = %s AND doctor_id = %s AND status = 'active'",
            (session_id, doctor_id),
        )
        updated = cur.rowcount > 0
        conn.commit()
        return updated
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
