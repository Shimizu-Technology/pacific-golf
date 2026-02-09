import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  LandingPage,
  RegistrationPage,
  RegistrationSuccessPage,
  PaymentSuccessPage,
  PaymentCancelPage,
  PaymentLinkPage,
  AdminLoginPage,
  AdminDashboard,
  GroupManagementPage,
  CheckInPage,
  AdminSettingsPage,
  ReportsPage,
  TournamentManagementPage,
} from './pages';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TournamentProvider } from './contexts';

// Wrapper component for admin routes with tournament context
function AdminRouteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <TournamentProvider>
        {children}
      </TournamentProvider>
    </ProtectedRoute>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/registration/success" element={<RegistrationSuccessPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="/pay/:token" element={<PaymentLinkPage />} />
        <Route path="/pay/:token/success" element={<PaymentLinkPage />} />

        {/* Admin Login (public) */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Protected Admin Routes with Tournament Context */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRouteWrapper>
              <AdminDashboard />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/groups"
          element={
            <AdminRouteWrapper>
              <GroupManagementPage />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/checkin"
          element={
            <AdminRouteWrapper>
              <CheckInPage />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRouteWrapper>
              <AdminSettingsPage />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <AdminRouteWrapper>
              <ReportsPage />
            </AdminRouteWrapper>
          }
        />
        <Route
          path="/admin/tournaments"
          element={
            <AdminRouteWrapper>
              <TournamentManagementPage />
            </AdminRouteWrapper>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
