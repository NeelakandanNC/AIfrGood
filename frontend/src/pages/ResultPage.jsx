import { useState, useEffect } from 'react';
import {
  Box, Tabs, Tab, Typography, Paper, TextField, Button, Stack,
  Divider, Snackbar, Alert, CircularProgress,
} from '@mui/material';
import { Download, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useTriageStore from '../state/triageStore';
import VerdictHeader from '../components/result/VerdictHeader';
import SafetyAlerts from '../components/result/SafetyAlerts';
import ExplanationCard from '../components/result/ExplanationCard';
import DepartmentRouting from '../components/result/DepartmentRouting';
import WorkupTable from '../components/result/WorkupTable';
import CouncilSummary from '../components/result/CouncilSummary';
import OtherDepartments from '../components/result/OtherDepartments';
import { saveDoctorNotes, downloadReport, getDoctorNotes } from '../api/triageApi';

function TabPanel({ children, value, index }) {
  return value === index ? <Box sx={{ pt: 2 }}>{children}</Box> : null;
}

export default function ResultPage() {
  const [tab, setTab] = useState(0);
  const { verdict, sessionId, doctor } = useTriageStore();
  const navigate = useNavigate();

  const [doctorName, setDoctorName] = useState(doctor?.name || '');
  const [impression, setImpression] = useState('');
  const [suggestions, setSuggestions] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  useEffect(() => {
    if (!sessionId) return;
    getDoctorNotes(sessionId)
      .then((notes) => {
        if (notes && notes.doctor_name !== undefined) {
          setDoctorName(notes.doctor_name || '');
          setImpression(notes.clinical_impression || '');
          setSuggestions(notes.suggestions || '');
        }
      })
      .catch(() => {});
  }, [sessionId]);

  const handleSaveNotes = async () => {
    if (!sessionId) {
      showSnack('No active session — cannot save notes.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveDoctorNotes(sessionId, {
        doctor_name: doctorName,
        clinical_impression: impression,
        suggestions,
      });
      showSnack('Notes saved successfully.');
    } catch {
      showSnack('Failed to save notes.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!sessionId) {
      showSnack('No active session — cannot generate PDF.', 'error');
      return;
    }
    setDownloading(true);
    try {
      const blob = await downloadReport(sessionId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `triage_report_${sessionId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showSnack('Failed to generate PDF.', 'error');
    } finally {
      setDownloading(false);
    }
  };

  if (!verdict) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h6" color="text.secondary">No triage result yet.</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Start a triage from the intake form to see results here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <VerdictHeader verdict={verdict} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          variant="contained"
          startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
          onClick={handleDownload}
          disabled={downloading}
          size="small"
        >
          {downloading ? 'Generating PDF...' : 'Download Report PDF'}
        </Button>
      </Box>

      <SafetyAlerts alerts={verdict.safety_alerts} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Verdict" />
        <Tab label="Workup Plan" />
        <Tab label="Council Summary" />
        <Tab label="Other Departments" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <ExplanationCard explanation={verdict.explanation} keyFactors={verdict.key_factors} />
        <DepartmentRouting verdict={verdict} />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <WorkupTable workup={verdict.consolidated_workup} />
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <CouncilSummary verdict={verdict} />
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <OtherDepartments departments={verdict.other_departments_flagged} />
      </TabPanel>

      <Divider sx={{ my: 3 }} />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Doctor's Notes</Typography>

        <Stack spacing={2}>
          <TextField
            label="Doctor Name"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            size="small"
            fullWidth
          />
          <TextField
            label="Clinical Impression"
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            multiline
            rows={4}
            fullWidth
            placeholder="Your clinical assessment of this patient..."
          />
          <TextField
            label="Additional Suggestions"
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            multiline
            rows={3}
            fullWidth
            placeholder="Any additional recommendations or follow-up actions..."
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              onClick={handleSaveNotes}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
