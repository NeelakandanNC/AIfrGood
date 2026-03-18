import { Box, Typography, Chip, Stack, useMediaQuery, useTheme, Tooltip, Paper } from '@mui/material';
import RiskBadge from '../common/RiskBadge';
import PriorityCircle from '../common/PriorityCircle';
import ActionChip from '../common/ActionChip';
import { RISK_COLORS } from '../../utils/constants';

const BREAKDOWN_LABELS = {
  cmo_action:        { label: 'CMO Action',         max: 35 },
  red_flags:         { label: 'RED FLAGS',           max: 25 },
  referral_urgency:  { label: 'Referral Urgency',    max: 20 },
  ml_risk:           { label: 'ML Risk + Adjustment',max: 12 },
  council_consensus: { label: 'Council Consensus',   max: 5  },
  yellow_flags:      { label: 'YELLOW FLAGS',        max: 3  },
};

function ScoreBreakdown({ breakdown }) {
  if (!breakdown) return null;
  const keys = Object.keys(BREAKDOWN_LABELS);
  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 1, minWidth: 260 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" sx={{ mb: 1 }}>
        Priority Score Breakdown
      </Typography>
      {keys.map((k) => {
        const meta = BREAKDOWN_LABELS[k];
        const item = breakdown[k] || {};
        const pts = item.points ?? 0;
        const pct = (pts / meta.max) * 100;
        return (
          <Box key={k} sx={{ mb: 0.75 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">{meta.label}</Typography>
              <Typography variant="caption" fontWeight={700}>{pts}/{meta.max}</Typography>
            </Stack>
            <Box sx={{ height: 4, bgcolor: '#E0E0E0', borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: pts === meta.max ? '#B71C1C' : pts > meta.max * 0.5 ? '#E65100' : '#388E3C', borderRadius: 2, transition: 'width 0.6s ease' }} />
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
}

export default function VerdictHeader({ verdict }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  if (!verdict) return null;
  const riskColor = RISK_COLORS[verdict.final_risk_level] || '#9E9E9E';
  const visualLevel = verdict.dashboard?.visual_priority_level;
  const breakdown = verdict.priority_breakdown;
  const priorityLabel = breakdown?.label || '';

  return (
    <Box>
      <Box sx={{ bgcolor: riskColor, color: '#fff', p: 2, borderRadius: 2, mb: 2 }}>
        <Typography variant="h5">
          Risk Level: {verdict.final_risk_level}
          {visualLevel && visualLevel !== verdict.final_risk_level && (
            <Chip label={`Visual: ${visualLevel}`} size="small" sx={{ ml: 1, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
          )}
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start" sx={{ mb: 2 }}>
        <Box sx={{ textAlign: 'center', flexShrink: 0 }}>
          <PriorityCircle score={verdict.priority_score || 0} size={isXs ? 72 : 120} />
          {priorityLabel && (
            <Typography variant="caption" fontWeight={700} display="block" sx={{ mt: 0.5, color: 'text.secondary' }}>
              {priorityLabel}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
            <RiskBadge level={verdict.final_risk_level} size="large" />
            <ActionChip action={verdict.recommended_action} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Confidence: {Math.round((verdict.confidence || verdict.explainability?.confidence_score || 0) * 100)}%
          </Typography>
          {verdict.risk_adjusted && (
            <Chip label={`Risk escalated by CMO`} size="small" sx={{ mt: 0.5, bgcolor: '#FFF3E0', color: '#E65100' }} />
          )}
          <ScoreBreakdown breakdown={breakdown} />
        </Box>
      </Stack>
    </Box>
  );
}
