import { Card, CardContent, Typography, Chip, Stack, Alert } from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

export default function DepartmentRouting({ verdict }) {
  if (!verdict) return null;

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>Department Routing</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 1 }}>
          <Chip icon={<LocalHospital />} label={`Primary: ${verdict.primary_department}`} color="primary" />
          {verdict.secondary_department && (
            <Chip label={`Secondary: ${verdict.secondary_department}`} variant="outlined" />
          )}
        </Stack>
        {verdict.referral_needed && (
          <Alert severity="info" sx={{ mt: 1 }}>
            <strong>Referral Required:</strong> {verdict.referral_details}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
