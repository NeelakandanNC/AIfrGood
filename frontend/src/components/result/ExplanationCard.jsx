import { Card, CardContent, Typography, Chip, Box } from '@mui/material';

export default function ExplanationCard({ explanation, keyFactors = [] }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>Clinical Explanation</Typography>
        <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.7 }}>{explanation}</Typography>
        {keyFactors.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">Key Factors</Typography>
            <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {keyFactors.map((f, i) => (
                <Chip key={i} label={f} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
