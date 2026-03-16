import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import TriagePage from './pages/TriagePage';
import ResultPage from './pages/ResultPage';
import CouncilPage from './pages/CouncilPage';
import QueuePage from './pages/QueuePage';
import AnalyticsPage from './pages/AnalyticsPage';
import QuickTriagePage from './pages/QuickTriagePage';
import LoginPage from './pages/LoginPage';
import AboutPage from './pages/AboutPage';
import useTriageStore from './state/triageStore';

function ProtectedRoute({ children }) {
  const token = useTriageStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<TriagePage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/council" element={<CouncilPage />} />
        <Route path="/queue" element={<QueuePage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/quick-triage" element={<QuickTriagePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
