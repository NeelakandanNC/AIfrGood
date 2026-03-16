import { useState } from 'react';
import {
  Box, TextField, Button, Grid, RadioGroup, FormControlLabel, Radio,
  FormLabel, Autocomplete, Chip, Typography, Paper, CircularProgress,
  LinearProgress, Alert,
} from '@mui/material';
import { Bolt, LocalHospital } from '@mui/icons-material';
import { quickTriage } from '../api/quickTriageApi';

// Model-compatible symptom/condition keys (snake_case = what XGBoost was trained on)
const SYMPTOM_OPTIONS = [
  { label: 'Chest Pain',          value: 'chest_pain' },
  { label: 'Breathlessness',      value: 'breathlessness' },
  { label: 'Headache',            value: 'headache' },
  { label: 'Fever',               value: 'fever' },
  { label: 'Cough',               value: 'cough' },
  { label: 'Abdominal Pain',      value: 'abdominal_pain' },
  { label: 'Nausea',              value: 'nausea' },
  { label: 'Vomiting',            value: 'vomiting' },
  { label: 'Dizziness',           value: 'dizziness' },
  { label: 'Fatigue',             value: 'fatigue' },
  { label: 'Palpitations',        value: 'palpitations' },
  { label: 'Back Pain',           value: 'back_pain' },
  { label: 'Joint Pain',          value: 'joint_pain' },
  { label: 'Diarrhea',            value: 'diarrhea' },
  { label: 'Sore Throat',         value: 'sore_throat' },
  { label: 'Body Ache',           value: 'body_ache' },
  { label: 'Weakness',            value: 'weakness' },
  { label: 'Blurred Vision',      value: 'blurred_vision' },
  { label: 'Numbness',            value: 'numbness' },
  { label: 'Confusion',           value: 'confusion' },
  { label: 'Seizures',            value: 'seizures' },
  { label: 'Blood in Stool',      value: 'blood_in_stool' },
  { label: 'Weight Loss',         value: 'weight_loss' },
  { label: 'Sweating',            value: 'sweating' },
  { label: 'Swelling',            value: 'swelling' },
  { label: 'Burning Urination',   value: 'burning_urination' },
  { label: 'Rash',                value: 'rash' },
  { label: 'Cold',                value: 'cold' },
  { label: 'Wheezing',            value: 'wheezing' },
  { label: 'Loss of Appetite',    value: 'loss_of_appetite' },
];

const CONDITION_OPTIONS = [
  { label: 'Diabetes',          value: 'diabetes' },
  { label: 'Hypertension',      value: 'hypertension' },
  { label: 'Asthma',            value: 'asthma' },
  { label: 'COPD',              value: 'copd' },
  { label: 'Heart Disease',     value: 'heart_disease' },
  { label: 'Kidney Disease',    value: 'kidney_disease' },
  { label: 'Liver Disease',     value: 'liver_disease' },
  { label: 'Thyroid',           value: 'thyroid' },
  { label: 'Tuberculosis',      value: 'tuberculosis' },
  { label: 'Cancer',            value: 'cancer' },
  { label: 'HIV',               value: 'hiv' },
  { label: 'Anemia',            value: 'anemia' },
  { label: 'Obesity',           value: 'obesity' },
];

const RISK_COLORS = { High: '#D32F2F', Medium: '#F57C00', Low: '#388E3C' };
const RISK_BG     = { High: '#FFEBEE', Medium: '#FFF3E0', Low: '#E8F5E9' };

function ConfidenceBar({ label, value, color }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
        <Typography variant="caption">{label}</Typography>
        <Typography variant="caption" fontWeight={600}>{value}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 8, borderRadius: 4,
          bgcolor: '#E0E0E0',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
        }}
      />
    </Box>
  );
}

function QuickResultCard({ result }) {
  const risk   = result.risk_level;
  const color  = RISK_COLORS[risk] ?? '#616161';
  const bg     = RISK_BG[risk]    ?? '#F5F5F5';
  const cb     = result.confidence_breakdown ?? {};

  return (
    <Box sx={{ mt: 3 }}>
      {/* Risk banner */}
      <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: bg, borderLeft: `6px solid ${color}`, mb: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ color }}>
          {risk} Risk
        </Typography>
        <Typography variant="subtitle1" fontWeight={500} sx={{ color, mt: 0.5 }}>
          {result.action}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Confidence: {result.confidence}%
        </Typography>
      </Paper>

      {/* Summary */}
      <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Summary</Typography>
        <Typography variant="body2" color="text.secondary">{result.summary}</Typography>
      </Paper>

      <Grid container spacing={2}>
        {/* Vital Flags */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>Vital Flags</Typography>
            {result.vital_flags.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, mt: 0.7, flexShrink: 0 }} />
                <Typography variant="body2">{f}</Typography>
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Contributing Factors */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <Typography variant="subtitle2" gutterBottom>Contributing Factors</Typography>
            {result.contributing_factors.length ? result.contributing_factors.map((f, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.75 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#757575', mt: 0.7, flexShrink: 0 }} />
                <Typography variant="body2">{f}</Typography>
              </Box>
            )) : <Typography variant="body2" color="text.secondary">None identified.</Typography>}
          </Paper>
        </Grid>
      </Grid>

      {/* Confidence breakdown */}
      <Paper sx={{ p: 2, borderRadius: 2, mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Confidence Breakdown</Typography>
        <ConfidenceBar label="High"   value={cb.High   ?? 0} color={RISK_COLORS.High}   />
        <ConfidenceBar label="Medium" value={cb.Medium ?? 0} color={RISK_COLORS.Medium} />
        <ConfidenceBar label="Low"    value={cb.Low    ?? 0} color={RISK_COLORS.Low}    />
      </Paper>
    </Box>
  );
}

function generateId() {
  const yr  = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
  return `PT-${yr}-${num}`;
}

const INITIAL = {
  patient_id: generateId(),
  name: '', age: '', gender: 'Male',
  bp_systolic: '', bp_diastolic: '',
  heart_rate: '', temperature: '', spo2: '',
  symptoms: [], conditions: [],
};

export default function QuickTriagePage() {
  const [form, setForm]     = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');

  const set = (field) => (e, val) => {
    if (val !== undefined) setForm((f) => ({ ...f, [field]: val }));
    else setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const payload = {
        name:         form.name,
        age:          Number(form.age),
        gender:       form.gender,
        bp_systolic:  Number(form.bp_systolic),
        bp_diastolic: Number(form.bp_diastolic),
        heart_rate:   Number(form.heart_rate),
        temperature:  Number(form.temperature),   // °C
        spo2:         Number(form.spo2),
        symptoms:     form.symptoms.map((s) => s.value ?? s),
        conditions:   form.conditions.map((c) => c.value ?? c),
      };
      const data = await quickTriage(payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Quick triage failed. Is the offline server running on port 8001?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Bolt color="warning" /> Quick Triage
        <Chip label="Offline ML" size="small" color="success" variant="outlined" sx={{ ml: 1 }} />
      </Typography>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Instant risk classification — no internet required.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            {/* Demographics */}
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
                <FormControlLabel value="Male"   control={<Radio />} label="Male" />
                <FormControlLabel value="Female" control={<Radio />} label="Female" />
                <FormControlLabel value="Other"  control={<Radio />} label="Other" />
              </RadioGroup>
            </Grid>

            {/* Vitals */}
            <Grid size={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>Vitals</Typography>
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField label="BP Systolic (mmHg)"  type="number" value={form.bp_systolic}  onChange={set('bp_systolic')}  fullWidth />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField label="BP Diastolic (mmHg)" type="number" value={form.bp_diastolic} onChange={set('bp_diastolic')} fullWidth />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField label="Heart Rate (bpm)"    type="number" value={form.heart_rate}   onChange={set('heart_rate')}   fullWidth />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField label="Temperature (°C)"    type="number" value={form.temperature}  onChange={set('temperature')}  fullWidth inputProps={{ step: 0.1 }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField label="SpO2 (%)"            type="number" value={form.spo2}         onChange={set('spo2')}         fullWidth />
            </Grid>

            {/* Symptoms */}
            <Grid size={12}>
              <Autocomplete
                multiple
                options={SYMPTOM_OPTIONS}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(o, v) => o.value === v.value}
                value={form.symptoms}
                onChange={set('symptoms')}
                renderTags={(val, getTagProps) => val.map((v, i) => {
                  const { key, ...tagProps } = getTagProps({ index: i });
                  return <Chip key={key} label={v.label} size="small" {...tagProps} />;
                })}
                renderInput={(params) => <TextField {...params} label="Symptoms" placeholder="Select symptoms" />}
              />
            </Grid>

            {/* Conditions */}
            <Grid size={12}>
              <Autocomplete
                multiple
                options={CONDITION_OPTIONS}
                getOptionLabel={(o) => o.label}
                isOptionEqualToValue={(o, v) => o.value === v.value}
                value={form.conditions}
                onChange={set('conditions')}
                renderTags={(val, getTagProps) => val.map((v, i) => {
                  const { key, ...tagProps } = getTagProps({ index: i });
                  return <Chip key={key} label={v.label} size="small" {...tagProps} />;
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
                color="warning"
                disabled={loading || !form.name || !form.age}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Bolt />}
                sx={{ mt: 1 }}
              >
                {loading ? 'Classifying…' : 'Run Quick Triage'}
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {result && <QuickResultCard result={result} />}
    </Box>
  );
}
