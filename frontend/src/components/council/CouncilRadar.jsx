import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Paper, Typography, useTheme, useMediaQuery } from '@mui/material';

export default function CouncilRadar({ specialists = [] }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  if (!specialists.length) return null;

  const data = specialists.map((s) => ({
    specialty: s.specialty || s.data?.specialty,
    relevance: s.data?.relevance_score ?? s.relevance_score ?? 0,
    urgency: s.data?.urgency_score ?? s.urgency_score ?? 0,
  }));

  return (
    <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom>Specialist Assessment Radar</Typography>
      <ResponsiveContainer width="100%" height={isXs ? 200 : 300}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="specialty" tick={{ fontSize: isXs ? 10 : 12 }} />
          <PolarRadiusAxis domain={[0, 10]} />
          <Radar name="Relevance" dataKey="relevance" stroke="#D32F2F" fill="#D32F2F" fillOpacity={0.2} />
          <Radar name="Urgency" dataKey="urgency" stroke="#1565C0" fill="#1565C0" fillOpacity={0.2} />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </Paper>
  );
}
