const BASE = import.meta.env.VITE_QUICK_TRIAGE_URL || 'http://localhost:8001';

export async function quickTriage(payload) {
  const res = await fetch(`${BASE}/api/quick-triage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}
