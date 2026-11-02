import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Layouts
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

// Auth & Public Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { OtpPage } from '@/pages/OtpPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

// Protected App Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { ApplicationsPage } from '@/pages/ApplicationsPage';
import { ApplicationDetailsPage } from '@/pages/ApplicationDetailsPage';
import { KanbanPage } from '@/pages/KanbanPage';
import { CompaniesPage } from '@/pages/CompaniesPage';
import { InterviewsPage } from '@/pages/InterviewsPage';
import { CalendarPage } from '@/pages/CalendarPage';
import { DocumentsPage } from '@/pages/DocumentsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { RemindersPage } from '@/pages/RemindersPage';
import { ProfilePage } from '@/pages/ProfilePage';

// 404
import { NotFoundPage } from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3, // 3 minutes
    },
  },
});

const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Initializing JobPilot...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

const PublicOnlyRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing */}
            <Route path="/" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route element={<PublicOnlyRoute><AuthLayout /></PublicOnlyRoute>}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/verify-otp" element={<OtpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
            </Route>

            {/* Protected Workspace Routes */}
            <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="applications/:id" element={<ApplicationDetailsPage />} />
              <Route path="kanban" element={<KanbanPage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="interviews" element={<InterviewsPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
