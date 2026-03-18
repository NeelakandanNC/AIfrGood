import { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogContent, Box, Typography, Button, LinearProgress, Chip,
} from '@mui/material';
import {
  CheckCircle, ErrorOutline, AutoAwesome,
  RadioButtonUnchecked, TrackChanges, MedicalServices,
  Apartment, Gavel, TaskAlt, Cancel,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useTriageStore from '../../state/triageStore';

const EVENT_META = {
  status:         { icon: RadioButtonUnchecked, color: '#94A3B8' },
  classification: { icon: TrackChanges,         color: '#94A3B8' },
  specialist:     { icon: MedicalServices,       color: '#94A3B8' },
  other:          { icon: Apartment,             color: '#94A3B8' },
  verdict:        { icon: Gavel,                 color: '#94A3B8' },
  complete:       { icon: TaskAlt,               color: '#6EE7B7' },
  error:          { icon: Cancel,                color: '#FCA5A5' },
};

const PHASE_LABELS = {
  init:           'Initialising pipeline',
  ingest:         'Processing patient data',
  classification: 'Running risk classification',
  specialist:     'Consulting specialist council',
  cmo:            'CMO synthesising verdict',
  complete:       'Triage complete',
  error:          'Error occurred',
};

export default function SSELogPanel() {
  const { streamEvents, phase, isTriaging, setPhase } = useTriageStore();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);

  const isOpen  = !dismissed && (isTriaging || phase === 'complete' || phase === 'error');
  const isDone  = phase === 'complete';
  const isError = phase === 'error';

  const handleClose = () => {
    setDismissed(true);
  };

  useEffect(() => {
    setDismissed(false);
  }, [isTriaging]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [streamEvents]);


  return (
    <Dialog
      open={isOpen}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          bgcolor: '#0D1117',
          border: '1px solid #21262D',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
        },
      }}
    >
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #21262D', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <AutoAwesome sx={{ color: '#58A6FF', fontSize: 16 }} />
        <Typography sx={{ color: '#E6EDF3', fontWeight: 600, fontSize: 14, flex: 1, letterSpacing: 0.2 }}>
          AI Triage Pipeline
        </Typography>
        {!isDone && !isError && (
          <Chip
            label={PHASE_LABELS[phase] || 'Processing'}
            size="small"
            sx={{ bgcolor: '#161B22', color: '#8B949E', fontSize: 11, border: '1px solid #30363D', height: 22 }}
          />
        )}
        {isDone  && <CheckCircle  sx={{ color: '#3FB950', fontSize: 18 }} />}
        {isError && <ErrorOutline sx={{ color: '#F85149', fontSize: 18 }} />}
      </Box>

      {/* Progress bar */}
      {!isDone && !isError && (
        <LinearProgress
          variant="indeterminate"
          sx={{ height: 2, bgcolor: '#161B22', '& .MuiLinearProgress-bar': { bgcolor: '#58A6FF' } }}
        />
      )}

      <DialogContent sx={{ p: 0 }}>
        {/* Event log */}
        <Box
          sx={{
            maxHeight: 300,
            overflowY: 'auto',
            px: 3,
            py: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#30363D', borderRadius: 2 },
          }}
        >
          {streamEvents.length === 0 && (
            <Typography sx={{ color: '#484F58', fontSize: 13, textAlign: 'center', mt: 3, fontFamily: 'monospace' }}>
              Connecting...
            </Typography>
          )}

          {streamEvents.map((evt, i) => {
            const meta = EVENT_META[evt.type] || EVENT_META.status;
            const Icon = meta.icon;
            const isLast = i === streamEvents.length - 1;
            return (
              <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 0.4 }}>
                {isLast
                  ? <Icon sx={{ fontSize: 14, color: meta.color, mt: '3px', flexShrink: 0 }} />
                  : <CheckCircle sx={{ fontSize: 14, color: '#3FB950', mt: '3px', flexShrink: 0 }} />
                }
                <Typography
                  sx={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: 'monospace',
                    color: '#C9D1D9',
                    letterSpacing: 0.1,
                  }}
                >
                  {evt.message}
                </Typography>
              </Box>
            );
          })}
          <div ref={bottomRef} />
        </Box>

        {/* Footer */}
        {(isDone || isError) && (
          <Box sx={{ px: 3, py: 2, borderTop: '1px solid #21262D', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
            {isDone && (
              <>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleClose}
                  sx={{ color: '#8B949E', '&:hover': { color: '#C9D1D9', bgcolor: 'transparent' }, fontWeight: 600, fontSize: 13 }}
                >
                  Close
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/result')}
                  sx={{ bgcolor: '#238636', '&:hover': { bgcolor: '#2EA043' }, fontWeight: 600, fontSize: 13 }}
                >
                  View Report
                </Button>
              </>
            )}
            {isError && (
              <>
                <Button
                  variant="text"
                  size="small"
                  onClick={handleClose}
                  sx={{ color: '#8B949E', '&:hover': { color: '#C9D1D9', bgcolor: 'transparent' }, fontWeight: 600, fontSize: 13 }}
                >
                  Close
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => window.location.reload()}
                  sx={{ borderColor: '#F85149', color: '#F85149', '&:hover': { borderColor: '#FF7B72', color: '#FF7B72', bgcolor: 'transparent' } }}
                >
                  Retry
                </Button>
              </>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
