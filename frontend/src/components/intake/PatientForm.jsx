import { useState } from 'react';
import {
  Box, TextField, Button, Grid, RadioGroup, FormControlLabel, Radio,
  FormLabel, Autocomplete, Chip, Typography, Paper,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import { SYMPTOM_LIST, CONDITION_LIST } from '../../utils/constants';
import useTriageStore from '../../state/triageStore';
import { startTriage, connectSSE } from '../../api/triageApi';

function generateId() {
  const yr = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `PT-${yr}-${num}`;
}

export default function PatientForm() {
  const { isTriaging, setIsTriaging, setSessionId, setPatientData, setClassification, addSpecialist, setOtherSpecialty, setVerdict, addStreamEvent, setPhase, reset } = useTriageStore();

  const [form, setForm] = useState({
    patient_id: generateId(),
    name: '',
    age: '',
    gender: 'Male',
    bp_systolic: '',
    bp_diastolic: '',
    heart_rate: '',
    temperature: '',
    spo2: '',
    symptoms: [],
    conditions: [],
  });

  const set = (field) => (e, val) => {
    if (val !== undefined) setForm((f) => ({ ...f, [field]: val }));
    else setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    reset();
    setIsTriaging(true);
    setPhase('init');
    setPatientData(form);

    const payload = {
      ...form,
      age: Number(form.age),
      bp_systolic: Number(form.bp_systolic),
      bp_diastolic: Number(form.bp_diastolic),
      heart_rate: Number(form.heart_rate),
      temperature: Number(form.temperature),
      spo2: Number(form.spo2),
    };

    try {
      const { session_id } = await startTriage(payload);
      setSessionId(session_id);
      addStreamEvent({ type: 'status', message: 'Pipeline started' });

      connectSSE(session_id, {
        status: (data) => {
          setPhase(data.phase || 'processing');
          addStreamEvent({ type: 'status', message: data.message, phase: data.phase });
        },
        classification_result: (data) => {
          setClassification(data);
          addStreamEvent({ type: 'classification', message: `Classification: ${data.prediction?.risk_level} (${data.prediction?.max_confidence}% confidence)` });
        },
        specialist_opinion: (data) => {
          addSpecialist(data);
          addStreamEvent({ type: 'specialist', message: `${data.specialty}: ${data.data?.one_liner}` });
        },
        other_specialty_scores: (data) => {
          setOtherSpecialty(data);
          addStreamEvent({ type: 'other', message: `Other specialties evaluated: ${data.departments?.length || 0} departments` });
        },
        cmo_verdict: (data) => {
          setVerdict(data);
          addStreamEvent({ type: 'verdict', message: `Verdict: ${data.final_risk_level} — ${data.recommended_action}` });
        },
        complete: () => {
          setPhase('complete');
          setIsTriaging(false);
          addStreamEvent({ type: 'complete', message: 'Triage complete' });
        },
        error: (data) => {
          setPhase('error');
          setIsTriaging(false);
          addStreamEvent({ type: 'error', message: data.message || 'An error occurred' });
        },
      });
    } catch (err) {
      setIsTriaging(false);
      setPhase('error');
      addStreamEvent({ type: 'error', message: err.message || 'Failed to start triage' });
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LocalHospital color="primary" /> Patient Intake
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Patient Name" value={form.name} onChange={set('name')} fullWidth required />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Patient ID" value={form.patient_id} onChange={set('patient_id')} fullWidth />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <TextField label="Age" type="number" value={form.age} onChange={set('age')} fullWidth required inputProps={{ min: 0, max: 120 }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 9 }}>
            <FormLabel>Gender</FormLabel>
            <RadioGroup row value={form.gender} onChange={set('gender')}>
              <FormControlLabel value="Male" control={<Radio />} label="Male" />
              <FormControlLabel value="Female" control={<Radio />} label="Female" />
              <FormControlLabel value="Other" control={<Radio />} label="Other" />
            </RadioGroup>
          </Grid>

          <Grid size={12}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>Vitals</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField label="BP Systolic" type="number" value={form.bp_systolic} onChange={set('bp_systolic')} fullWidth />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField label="BP Diastolic" type="number" value={form.bp_diastolic} onChange={set('bp_diastolic')} fullWidth />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField label="Heart Rate" type="number" value={form.heart_rate} onChange={set('heart_rate')} fullWidth />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField label="Temperature (°F)" type="number" value={form.temperature} onChange={set('temperature')} fullWidth inputProps={{ step: 0.1 }} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField label="SpO2 (%)" type="number" value={form.spo2} onChange={set('spo2')} fullWidth />
          </Grid>

          <Grid size={12}>
            <Autocomplete
              multiple
              options={SYMPTOM_LIST}
              value={form.symptoms}
              onChange={set('symptoms')}
              renderTags={(val, getTagProps) => val.map((v, i) => {
                const { key, ...tagProps } = getTagProps({ index: i });
                return <Chip key={key} label={v} size="small" {...tagProps} />;
              })}
              renderInput={(params) => <TextField {...params} label="Symptoms" placeholder="Select symptoms" />}
            />
          </Grid>
          <Grid size={12}>
            <Autocomplete
              multiple
              options={CONDITION_LIST}
              value={form.conditions}
              onChange={set('conditions')}
              renderTags={(val, getTagProps) => val.map((v, i) => {
                const { key, ...tagProps } = getTagProps({ index: i });
                return <Chip key={key} label={v} size="small" {...tagProps} />;
              })}
              renderInput={(params) => <TextField {...params} label="Pre-existing Conditions" placeholder="Select conditions" />}
            />
          </Grid>

          <Grid size={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isTriaging || !form.name || !form.age}
              sx={{ mt: 1 }}
            >
              {isTriaging ? 'Triage in Progress...' : 'Begin Triage'}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
