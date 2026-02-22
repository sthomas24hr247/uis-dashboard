import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/DashboardLayout';
import SchedulePage from './pages/SchedulePage';
import PatientsPage from './pages/PatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import TodayPage from './pages/TodayPage';
import ProvidersPage from './pages/ProvidersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HomePage from './pages/HomePage';
import AIPredictionsPage from './pages/AIPredictionsPage';
import OutcomeGapPage from './pages/OutcomeGapPage';

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-uis-200 border-t-uis-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      
      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="today" element={<TodayPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:patientId" element={<PatientDetailPage />} />
        <Route path="providers" element={<ProvidersPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="ai-predictions" element={<AIPredictionsPage />} />
            <Route path="outcome-gap" element={<OutcomeGapPage />} />
        <Route path="ai-predictions" element={<AIPredictionsPage />} />
            <Route path="outcome-gap" element={<OutcomeGapPage />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
