import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, Box,
} from '@mui/material';
import PriorityBadge from '../common/PriorityBadge';
import { PRIORITY_COLORS } from '../../utils/constants';

const PRIORITY_ORDER = { STAT: 0, URGENT: 1, ROUTINE: 2 };

export default function WorkupTable({ workup = [] }) {
  if (!workup.length) return <Typography color="text.secondary">No workup items.</Typography>;

  const sorted = [...workup].sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
  let lastPriority = null;

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell><strong>Test</strong></TableCell>
            <TableCell><strong>Priority</strong></TableCell>
            <TableCell><strong>Ordered By</strong></TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><strong>Rationale</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((item, i) => {
            const showHeader = item.priority !== lastPriority;
            lastPriority = item.priority;
            return [
              showHeader && (
                <TableRow key={`h-${i}`}>
                  <TableCell
                    colSpan={4}
                    sx={{ bgcolor: PRIORITY_COLORS[item.priority] || '#EEE', color: '#fff', fontWeight: 700, py: 0.5 }}
                  >
                    {item.priority}
                  </TableCell>
                </TableRow>
              ),
              <TableRow key={i}>
                <TableCell>{item.test}</TableCell>
                <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(item.ordered_by || []).map((s) => (
                      <Chip key={s} label={s} size="small" variant="outlined" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><Typography variant="caption">{item.rationale}</Typography></TableCell>
              </TableRow>,
            ];
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
