import { create } from 'zustand';

const useTriageStore = create((set) => ({
  classification: null,
  specialists: [],
  otherSpecialty: null,
  verdict: null,
  streamEvents: [],
  phase: 'idle',
  isTriaging: false,
  sessionId: null,
  patientData: null,

  // Auth state
  token: localStorage.getItem('token') || null,
  doctor: JSON.parse(localStorage.getItem('doctor') || 'null'),
  facilityLevel: JSON.parse(localStorage.getItem('doctor') || 'null')?.facility_level || 'District Hospital',

  setClassification: (c) => set({ classification: c }),
  addSpecialist: (s) =>
    set((st) => ({ specialists: [...st.specialists, s] })),
  setSpecialists: (arr) => set({ specialists: arr }),
  setOtherSpecialty: (o) => set({ otherSpecialty: o }),
  setVerdict: (v) => set({ verdict: v }),
  addStreamEvent: (e) =>
    set((st) => ({ streamEvents: [...st.streamEvents, { ...e, ts: Date.now() }] })),
  setPhase: (p) => set({ phase: p }),
  setIsTriaging: (b) => set({ isTriaging: b }),
  setSessionId: (id) => set({ sessionId: id }),
  setPatientData: (d) => set({ patientData: d }),

  setAuth: (token, doctor) => {
    localStorage.setItem('token', token);
    localStorage.setItem('doctor', JSON.stringify(doctor));
    set({ token, doctor, facilityLevel: doctor?.facility_level || 'District Hospital' });
  },

  setFacilityLevel: (level) => set({ facilityLevel: level }),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('doctor');
    set({ token: null, doctor: null });
  },

  reset: () =>
    set({
      classification: null,
      specialists: [],
      otherSpecialty: null,
      verdict: null,
      streamEvents: [],
      phase: 'idle',
      isTriaging: false,
      sessionId: null,
      patientData: null,
    }),
}));

export default useTriageStore;
