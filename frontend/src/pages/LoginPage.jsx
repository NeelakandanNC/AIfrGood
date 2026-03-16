import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Tabs, Tab,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';
import axios from 'axios';
import useTriageStore from '../state/triageStore';

export default function LoginPage() {
  const [tab, setTab] = useState(0); // 0=login, 1=register
  const [form, setForm] = useState({ username: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useTriageStore((s) => s.setAuth);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 1) {
        await axios.post('/api/auth/register', form);
        setTab(0);
        setForm({ ...form, name: '' });
        return;
      }
      const { data } = await axios.post('/api/auth/login', {
        username: form.username,
        password: form.password,
      });
      setAuth(data.access_token, data.doctor);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#F5F6FA',
    }}>
      <Card sx={{ width: 380, boxShadow: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <LocalHospital sx={{ color: 'primary.main', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="primary.main" lineHeight={1.1}>Ydhya</Typography>
              <Typography variant="caption" color="text.secondary">Rapid Triage System</Typography>
            </Box>
          </Box>

          <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); }} sx={{ mb: 3 }}>
            <Tab label="Login" />
            <Tab label="Register" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username" size="small" required
              value={form.username} onChange={update('username')}
            />
            <TextField
              label="Password" type="password" size="small" required
              value={form.password} onChange={update('password')}
            />
            {tab === 1 && (
              <TextField
                label="Full Name" size="small" required
                value={form.name} onChange={update('name')}
              />
            )}
            <Button type="submit" variant="contained" disabled={loading} fullWidth>
              {loading ? 'Please wait...' : tab === 0 ? 'Login' : 'Register'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
