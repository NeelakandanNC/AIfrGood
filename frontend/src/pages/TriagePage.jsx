import { Box } from '@mui/material';
import PatientForm from '../components/intake/PatientForm';
import DocumentUpload from '../components/intake/DocumentUpload';
import SSELogPanel from '../components/stream/SSELogPanel';

export default function TriagePage() {
  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <PatientForm />
      <DocumentUpload />
      <SSELogPanel />
    </Box>
  );
}
