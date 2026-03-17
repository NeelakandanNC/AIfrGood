import { useState } from 'react';
import {
  Card, CardContent, Typography, Box, LinearProgress, Chip, Collapse,
  IconButton, Stack, Table, TableBody, TableCell, TableRow, TableHead,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import FlagChip from '../common/FlagChip';
import PriorityBadge from '../common/PriorityBadge';
import { SPECIALIST_ICONS } from '../../utils/constants';

function ScoreBar({ label, value, max = 10 }) {
  const pct = (value / max) * 100;
  const color = pct >= 70 ? '#D32F2F' : pct >= 40 ? '#F57C00' : '#388E3C';
  return (
    <Box sx={{ mb: 1 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption">{label}</Typography>
        <Typography variant="caption" fontWeight={600}>{value}/{max}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate" value={pct}
        sx={{ height: 6, borderRadius: 3, bgcolor: '#EEE', '& .MuiLinearProgress-bar': { bgcolor: color } }}
      />
    </Box>
  );
}

export default function SpecialistCard({ specialist, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const d = specialist.data || specialist;
  const icon = SPECIALIST_ICONS[d.specialty] || '\uD83E\uDE7A';

  return (
    <Card
      className="fade-in"
      sx={{ borderRadius: 3, animation: `fade-in 0.4s ease-out ${delay}ms both` }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            {icon} {d.specialty}
          </Typography>
          <Chip label={d.confidence} size="small" variant="outlined" />
        </Stack>

        <ScoreBar label="Relevance" value={d.relevance_score} />
        <ScoreBar label="Urgency" value={d.urgency_score} />

        <Typography variant="body2" fontWeight={600} sx={{ my: 1 }}>{d.one_liner}</Typography>

        <Box sx={{ mb: 1 }}>
          {(d.flags || []).map((f, i) => (
            <FlagChip key={i} severity={f.severity} label={f.label} pattern={f.pattern} />
          ))}
        </Box>

        {d.claims_primary && <Chip label="Claims Primary" size="small" color="primary" sx={{ mb: 1 }} />}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.primary" display="block" sx={{ mb: 1 }}>
              {d.assessment}
            </Typography>

            {d.differentials?.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" fontWeight={600}>Differentials</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Diagnosis</TableCell>
                        <TableCell>Likelihood</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {d.differentials.map((diff, i) => (
                        <TableRow key={i}>
                          <TableCell>{diff.diagnosis || diff.condition}</TableCell>
                          <TableCell>{diff.likelihood || diff.probability}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}

            {d.recommended_workup?.length > 0 && (
              <Box>
                <Typography variant="caption" fontWeight={600}>Recommended Workup</Typography>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableBody>
                      {d.recommended_workup.map((w, i) => (
                        <TableRow key={i}>
                          <TableCell>{w.test}</TableCell>
                          <TableCell><PriorityBadge priority={w.priority} /></TableCell>
                          <TableCell><Typography variant="body2">{w.rationale}</Typography></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
}
