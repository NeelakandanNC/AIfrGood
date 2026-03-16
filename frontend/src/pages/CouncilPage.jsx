import { Box, Typography, Chip, Stack, Card, CardContent, LinearProgress } from '@mui/material';
import useTriageStore from '../state/triageStore';
import RiskBadge from '../components/common/RiskBadge';
import CouncilRadar from '../components/council/CouncilRadar';
import SpecialistCard from '../components/council/SpecialistCard';
import ConsensusBar from '../components/council/ConsensusBar';

export default function CouncilPage() {
  const { specialists, verdict, classification, patientData, otherSpecialty } = useTriageStore();

  if (!specialists.length && !verdict) {
    return (
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h6" color="text.secondary">No council data yet.</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Complete a triage to see the specialist council results.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Patient context bar */}
      {patientData && (
        <Card sx={{ mb: 3, bgcolor: '#F5F6FA' }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Typography variant="subtitle1" fontWeight={700}>{patientData.name}</Typography>
              <Typography variant="body2">{patientData.age}y / {patientData.gender}</Typography>
              {classification && <RiskBadge level={classification.prediction?.risk_level} size="small" />}
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {(patientData.symptoms || []).slice(0, 5).map((s) => (
                  <Chip key={s} label={s} size="small" variant="outlined" />
                ))}
                {(patientData.symptoms?.length || 0) > 5 && (
                  <Chip label={`+${patientData.symptoms.length - 5}`} size="small" />
                )}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {verdict && (
        <ConsensusBar consensus={verdict.council_consensus} dissenting={verdict.dissenting_opinions} />
      )}

      <CouncilRadar specialists={specialists} />

      {/* Specialist Grid */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {specialists.map((s, i) => (
          <SpecialistCard key={s.specialty || i} specialist={s} delay={i * 100} />
        ))}
      </Box>

      {/* Other Departments */}
      {otherSpecialty?.departments?.length > 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Other Department Scores</Typography>
            {[...otherSpecialty.departments]
              .filter((d) => d.relevance >= 3)
              .sort((a, b) => b.relevance - a.relevance)
              .map((d) => (
                <Box key={d.department} sx={{ mb: 1 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2">{d.department}</Typography>
                    <Typography variant="caption">{d.relevance}/10</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate" value={d.relevance * 10}
                    sx={{
                      height: 6, borderRadius: 3, bgcolor: '#EEE',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: d.relevance >= 7 ? '#D32F2F' : d.relevance >= 4 ? '#F57C00' : '#388E3C',
                      },
                    }}
                  />
                </Box>
              ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
