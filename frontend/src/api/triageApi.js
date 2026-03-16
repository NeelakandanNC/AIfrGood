import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const api = axios.create({ baseURL: API_BASE });

// Attach token from store on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, clear auth and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('doctor');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

function fahrenheitToCelsius(f) {
  return ((f - 32) * 5) / 9;
}

export async function startTriage(patientData) {
  const payload = {
    ...patientData,
    temperature: fahrenheitToCelsius(patientData.temperature),
  };
  const { data } = await api.post('/triage', payload);
  return data;
}

export function connectSSE(sessionId, handlers) {
  const token = localStorage.getItem('token');
  // EventSource doesn't support custom headers — pass token as query param
  const url = `${API_BASE}/triage/stream/${sessionId}?token=${encodeURIComponent(token || '')}`;
  const es = new EventSource(url);

  const events = [
    'status',
    'classification_result',
    'specialist_opinion',
    'other_specialty_scores',
    'cmo_verdict',
    'complete',
    'error',
  ];

  events.forEach((evt) => {
    es.addEventListener(evt, (e) => {
      try {
        const data = JSON.parse(e.data);
        handlers[evt]?.(data);
      } catch {
        handlers[evt]?.(e.data);
      }
    });
  });

  es.onerror = () => {
    handlers.error?.({ message: 'SSE connection lost' });
    es.close();
  };

  return es;
}

export async function getPatients() {
  const { data } = await api.get('/dashboard/patients');
  return data;
}

export async function getStats() {
  const { data } = await api.get('/dashboard/stats');
  return data;
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/upload/document', form);
  return data;
}

export async function dischargePatient(sessionId) {
  const { data } = await api.delete(`/patients/${sessionId}`);
  return data;
}

export async function getDoctorNotes(sessionId) {
  const { data } = await api.get(`/patients/${sessionId}/notes`);
  return data;
}

export async function saveDoctorNotes(sessionId, notes) {
  const { data } = await api.post(`/patients/${sessionId}/notes`, notes);
  return data;
}

export async function downloadReport(sessionId) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE}/patients/${sessionId}/report.pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`PDF download failed: ${res.status}`);
  return res.blob();
}
