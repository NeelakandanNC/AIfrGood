import {
  Card, CardContent, Typography, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Stack, Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function CouncilSummary({ verdict }) {
  const navigate = useNavigate();
  if (!verdict) return null;

  const { council_consensus, specialist_summaries = [], dissenting_opinions = [] } = verdict;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Council Consensus:</Typography>
          <Chip
            label={council_consensus}
            color={council_consensus === 'Unanimous' ? 'success' : council_consensus === 'Split' ? 'error' : 'warning'}
            size="small"
          />
        </Stack>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Specialty</TableCell>
                <TableCell>Relevance</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Urgency</TableCell>
                <TableCell>Confidence</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Summary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {specialist_summaries.map((s) => (
                <TableRow key={s.specialty}>
                  <TableCell>
                    <strong>{s.specialty}</strong>
                    {s.claims_primary && <Chip label="Primary" size="small" color="primary" sx={{ ml: 0.5 }} />}
                  </TableCell>
                  <TableCell>{s.relevance_score}/10</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{s.urgency_score}/10</TableCell>
                  <TableCell>{s.confidence}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'normal' }}>
                    <Typography variant="caption">{s.one_liner}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {dissenting_opinions.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="error">Dissenting Opinions:</Typography>
            {dissenting_opinions.map((d, i) => (
              <Typography key={i} variant="body2" sx={{ ml: 1 }}>
                {d.specialty} recommends {d.recommended} (relevance: {d.relevance_score})
              </Typography>
            ))}
          </Box>
        )}

        <Button variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => navigate('/council')}>
          View Full Council &rarr;
        </Button>
      </CardContent>
    </Card>
  );
}
