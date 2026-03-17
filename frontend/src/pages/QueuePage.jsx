import { useEffect, useState } from 'react';
import {
  Box, Typography, Chip, Stack, ToggleButtonGroup, ToggleButton,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Card, CardContent, CardActionArea,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ExitToApp } from '@mui/icons-material';
import { getPatients, dischargePatient } from '../api/triageApi';
import RiskBadge from '../components/common/RiskBadge';
import ActionChip from '../components/common/ActionChip';
import PriorityCircle from '../components/common/PriorityCircle';
import { useNavigate } from 'react-router-dom';
import useTriageStore from '../state/triageStore';

export default function QueuePage() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState([]);
  const [deptFilter, setDeptFilter] = useState('');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [confirmId, setConfirmId] = useState(null);
  const navigate = useNavigate();
  const { setVerdict, setClassification, setPatientData, setSpecialists, setOtherSpecialty, setSessionId } = useTriageStore();

  useEffect(() => {
    getPatients()
      .then((data) => setPatients(data || []))
      .catch(() => setPatients([]))
      .finally(() => setLoading(false));
  }, []);

  const departments = [...new Set(patients.map((p) => p.verdict?.primary_department).filter(Boolean))];

  const filtered = patients.filter((p) => {
    const risk = p.verdict?.final_risk_level || p.classification?.prediction?.risk_level;
    if (riskFilter.length && !riskFilter.includes(risk)) return false;
    if (deptFilter && p.verdict?.primary_department !== deptFilter) return false;
    if (alertsOnly && !(p.verdict?.safety_alerts?.length > 0)) return false;
    return true;
  });

  const rows = filtered.map((p, i) => ({
    id: p.session_id || i,
    priority_score: p.verdict?.priority_score || 0,
    name: p.patient_data?.name || 'Unknown',
    age_gender: `${p.patient_data?.age || '?'}/${p.patient_data?.gender?.[0] || '?'}`,
    risk_level: p.verdict?.final_risk_level || p.classification?.prediction?.risk_level || 'Unknown',
    action: p.verdict?.recommended_action || '-',
    department: p.verdict?.primary_department || '-',
    alerts: p.verdict?.safety_alerts?.length || 0,
    timestamp: p.timestamp ? new Date(p.timestamp).toLocaleTimeString() : '-',
    _raw: p,
  }));

  const handleDischarge = async (sessionId) => {
    try {
      await dischargePatient(sessionId);
      setPatients((prev) => prev.filter((p) => p.session_id !== sessionId));
    } catch {
      // ignore
    } finally {
      setConfirmId(null);
    }
  };

  const columns = [
    {
      field: 'priority_score', headerName: 'Priority', width: 90,
      renderCell: (params) => <PriorityCircle score={params.value} size={48} />,
    },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 120 },
    { field: 'age_gender', headerName: 'Age/Gender', width: 100 },
    {
      field: 'risk_level', headerName: 'Risk', width: 100,
      renderCell: (params) => <RiskBadge level={params.value} size="small" />,
    },
    {
      field: 'action', headerName: 'Action', width: 120,
      renderCell: (params) => <ActionChip action={params.value} />,
    },
    { field: 'department', headerName: 'Department', width: 140 },
    {
      field: 'alerts', headerName: 'Alerts', width: 80,
      renderCell: (params) => params.value > 0
        ? <Chip label={params.value} size="small" color="error" />
        : <Typography variant="caption" color="text.secondary">0</Typography>,
    },
    { field: 'timestamp', headerName: 'Time', width: 100 },
    {
      field: 'discharge', headerName: '', width: 60, sortable: false,
      renderCell: (params) => (
        <Tooltip title="Discharge patient">
          <IconButton
            size="small"
            color="warning"
            onClick={(e) => { e.stopPropagation(); setConfirmId(params.row.id); }}
          >
            <ExitToApp fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const handleRowClick = (params) => {
    if (params.field === 'discharge') return;
    const raw = params.row._raw;
    if (raw.verdict) setVerdict(raw.verdict);
    if (raw.classification) setClassification(raw.classification);
    if (raw.patient_data) setPatientData(raw.patient_data);
    // Restore council data so CouncilPage works after re-login
    setSpecialists(raw.verdict?.full_specialist_opinions || []);
    setOtherSpecialty(raw.verdict?.other_specialty_raw || null);
    setSessionId(raw.session_id);
    navigate('/result');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Patient Priority Queue</Typography>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }} alignItems="center">
        <ToggleButtonGroup size="small" value={riskFilter} onChange={(_, v) => setRiskFilter(v)} sx={{ flexWrap: 'wrap' }}>
          {['Low', 'Medium', 'High', 'Critical'].map((r) => (
            <ToggleButton key={r} value={r}>{r}</ToggleButton>
          ))}
        </ToggleButtonGroup>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Department</InputLabel>
          <Select value={deptFilter} label="Department" onChange={(e) => setDeptFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControlLabel
          control={<Switch checked={alertsOnly} onChange={(e) => setAlertsOnly(e.target.checked)} />}
          label="Alerts Only"
        />
      </Stack>

      {rows.length === 0 && !loading ? (
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography color="text.secondary">No patients triaged yet.</Typography>
        </Box>
      ) : (
        <>
          {/* Mobile card list */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={1.5}>
              {rows.map((row) => (
                <Card key={row.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardActionArea onClick={() => handleRowClick({ row, field: '' })}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700}>{row.name}</Typography>
                        <RiskBadge level={row.risk_level} size="small" />
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary">{row.department}</Typography>
                        <Typography variant="caption" color="text.secondary">·</Typography>
                        <Typography variant="caption" color="text.secondary">{row.age_gender}</Typography>
                        <Typography variant="caption" color="text.secondary">·</Typography>
                        <Typography variant="caption" color="text.secondary">{row.timestamp}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                        <ActionChip action={row.action} />
                        {row.alerts > 0 && <Chip label={`${row.alerts} alerts`} size="small" color="error" />}
                        <Box sx={{ ml: 'auto' }}>
                          <Tooltip title="Discharge patient">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={(e) => { e.stopPropagation(); setConfirmId(row.id); }}
                            >
                              <ExitToApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>

          {/* Desktop DataGrid */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              autoHeight
              initialState={{
                sorting: { sortModel: [{ field: 'priority_score', sort: 'desc' }] },
              }}
              pageSizeOptions={[10, 25, 50]}
              onRowClick={handleRowClick}
              sx={{
                '& .MuiDataGrid-row': { cursor: 'pointer' },
                '& .MuiDataGrid-row:hover': { bgcolor: '#F5F6FA' },
              }}
              disableRowSelectionOnClick
            />
          </Box>
        </>
      )}

      <Dialog open={!!confirmId} onClose={() => setConfirmId(null)}>
        <DialogTitle>Discharge Patient?</DialogTitle>
        <DialogContent>
          <Typography>This will remove the patient from the active queue.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmId(null)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => handleDischarge(confirmId)}>
            Discharge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
