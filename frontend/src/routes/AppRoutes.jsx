import { Routes, Route } from 'react-router-dom';
import DoctorDashboard from '../pages/DoctorDashboard';
import HMSDashboard from '../pages/HMSDashboard';
import LandingPage from '../pages/LandingPage';
import DoctorLogin from '../pages/DoctorLogin';
import PatientLogin from '../pages/PatientLogin';
import ReceptionistLogin from '../pages/ReceptionistLogin';
import AdminLogin from '../pages/AdminLogin';
import { Navigate } from 'react-router-dom';

// Placeholder components for future implementation
const PatientDashboard = () => (
  <div className="container my-4">
    <h1>Patient Dashboard</h1>
    <p>This feature will be implemented in the next phase.</p>
    <a href="/" className="btn btn-primary">Back to Home</a>
  </div>
);

const ReceptionistDashboard = () => (
  <div className="container my-4">
    <h1>Receptionist Dashboard</h1>
    <p>This feature will be implemented in the next phase.</p>
    <a href="/" className="btn btn-primary">Back to Home</a>
  </div>
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Main Landing Page */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Login Routes */}
      <Route path="/login/doctor" element={<DoctorLogin />} />
      <Route path="/login/patient" element={<PatientLogin />} />
      <Route path="/login/receptionist" element={<ReceptionistLogin />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      
      {/* Dashboard Routes */}
      <Route path="/doctor" element={<DoctorDashboard />} />
      <Route path="/hms" element={<HMSDashboard />} />
      <Route path="/patient" element={<PatientDashboard />} />
      <Route path="/receptionist" element={<ReceptionistDashboard />} />
      
      {/* Redirect any unknown routes to the landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
} 