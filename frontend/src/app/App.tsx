import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

// Layouts
import { AppLayout } from '@/layouts/AppLayout';

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

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Direct Redirect to Dashboard for Local Mode */}
            <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/login" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/register" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/verify-otp" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/app/dashboard" replace />} />
            <Route path="/reset-password" element={<Navigate to="/app/dashboard" replace />} />

            {/* Main Application Workspace */}
            <Route path="/app" element={<AppLayout />}>
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

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};
