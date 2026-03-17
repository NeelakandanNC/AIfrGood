import { Box, Typography, Chip, Stack, useMediaQuery, useTheme } from '@mui/material';
import RiskBadge from '../common/RiskBadge';
import PriorityCircle from '../common/PriorityCircle';
import ActionChip from '../common/ActionChip';
import { RISK_COLORS } from '../../utils/constants';

export default function VerdictHeader({ verdict }) {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));
  if (!verdict) return null;
  const riskColor = RISK_COLORS[verdict.final_risk_level] || '#9E9E9E';
  const visualLevel = verdict.dashboard?.visual_priority_level;

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

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center" sx={{ mb: 2 }}>
        <PriorityCircle score={verdict.priority_score || 0} size={isXs ? 72 : 120} />
        <Box>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <RiskBadge level={verdict.final_risk_level} size="large" />
            <ActionChip action={verdict.recommended_action} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Confidence: {Math.round((verdict.confidence || verdict.explainability?.confidence_score || 0) * 100)}%
          </Typography>
          {verdict.risk_adjusted && (
            <Chip label={`Adjusted: ${verdict.adjustment_reason || 'Risk escalated'}`} size="small" sx={{ mt: 0.5, bgcolor: '#FFF3E0', color: '#E65100' }} />
          )}
        </Box>
      </Stack>
    </Box>
  );
}
