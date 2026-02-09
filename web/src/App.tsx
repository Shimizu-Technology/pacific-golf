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
import { OrganizationProvider } from './components/OrganizationProvider';
import { 
  OrganizationLandingPage, 
  OrgRegistrationPage,
  OrgTournamentPage,
  OrgRegistrationSuccessPage,
} from './pages';
import { OrgAdminDashboard } from './pages/OrgAdminDashboard';
import { OrgTournamentAdmin } from './pages/OrgTournamentAdmin';
import { OrgCheckInPage } from './pages/OrgCheckInPage';
import { CreateTournamentPage } from './pages/CreateTournamentPage';
import { LeaderboardPage, ScorecardPage } from './pages';

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

// Wrapper for organization-scoped public routes
function OrgRouteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* ===========================================
            ORGANIZATION-SCOPED PUBLIC ROUTES (Multi-tenant)
            =========================================== */}
        
        {/* Organization landing page - shows all tournaments */}
        <Route
          path="/:orgSlug"
          element={
            <OrgRouteWrapper>
              <OrganizationLandingPage />
            </OrgRouteWrapper>
          }
        />

        {/* Tournament-specific pages */}
        <Route
          path="/:orgSlug/tournaments/:tournamentSlug"
          element={
            <OrgRouteWrapper>
              <OrgTournamentPage />
            </OrgRouteWrapper>
          }
        />
        <Route
          path="/:orgSlug/tournaments/:tournamentSlug/register"
          element={
            <OrgRouteWrapper>
              <OrgRegistrationPage />
            </OrgRouteWrapper>
          }
        />
        <Route
          path="/:orgSlug/tournaments/:tournamentSlug/success"
          element={
            <OrgRouteWrapper>
              <OrgRegistrationSuccessPage />
            </OrgRouteWrapper>
          }
        />

        {/* Live Leaderboard (Public) */}
        <Route
          path="/:orgSlug/tournaments/:tournamentSlug/leaderboard"
          element={
            <OrgRouteWrapper>
              <LeaderboardPage />
            </OrgRouteWrapper>
          }
        />

        {/* ===========================================
            ORG-SCOPED ADMIN ROUTES (Multi-tenant)
            =========================================== */}
        
        {/* Organization Admin Dashboard */}
        <Route
          path="/:orgSlug/admin"
          element={
            <ProtectedRoute>
              <OrganizationProvider>
                <OrgAdminDashboard />
              </OrganizationProvider>
            </ProtectedRoute>
          }
        />

        {/* Create New Tournament */}
        <Route
          path="/:orgSlug/admin/tournaments/new"
          element={
            <ProtectedRoute>
              <OrganizationProvider>
                <CreateTournamentPage />
              </OrganizationProvider>
            </ProtectedRoute>
          }
        />

        {/* Tournament Admin Dashboard */}
        <Route
          path="/:orgSlug/admin/tournaments/:tournamentSlug"
          element={
            <ProtectedRoute>
              <OrganizationProvider>
                <OrgTournamentAdmin />
              </OrganizationProvider>
            </ProtectedRoute>
          }
        />

        {/* Tournament Check-In */}
        <Route
          path="/:orgSlug/admin/tournaments/:tournamentSlug/checkin"
          element={
            <ProtectedRoute>
              <OrganizationProvider>
                <OrgCheckInPage />
              </OrganizationProvider>
            </ProtectedRoute>
          }
        />

        {/* Scorecard Entry (Admin) */}
        <Route
          path="/:orgSlug/admin/tournaments/:tournamentSlug/scorecard"
          element={
            <ProtectedRoute>
              <OrganizationProvider>
                <ScorecardPage />
              </OrganizationProvider>
            </ProtectedRoute>
          }
        />

        {/* ===========================================
            LEGACY PUBLIC ROUTES (Backwards compatibility)
            =========================================== */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/registration/success" element={<RegistrationSuccessPage />} />
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/cancel" element={<PaymentCancelPage />} />
        <Route path="/pay/:token" element={<PaymentLinkPage />} />
        <Route path="/pay/:token/success" element={<PaymentLinkPage />} />

        {/* ===========================================
            ADMIN ROUTES
            =========================================== */}
        
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

        {/* Catch-all redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
