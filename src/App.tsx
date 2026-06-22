import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupRequired } from "@/components/SetupRequired";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute, RoleRoute } from "@/routes/ProtectedRoute";
import { FullScreenLoader } from "@/components/FullScreenLoader";

// Lazily-loaded pages — each becomes its own chunk, fetched on demand.
const named = <T extends Record<string, React.ComponentType<unknown>>>(
  loader: () => Promise<T>,
  key: keyof T,
) => lazy(() => loader().then((m) => ({ default: m[key] })));

const LoginPage = named(() => import("@/pages/auth/LoginPage"), "LoginPage");
const RegisterPage = named(() => import("@/pages/auth/RegisterPage"), "RegisterPage");
const ForgotPasswordPage = named(() => import("@/pages/auth/ForgotPasswordPage"), "ForgotPasswordPage");
const ResetPasswordPage = named(() => import("@/pages/auth/ResetPasswordPage"), "ResetPasswordPage");
const DashboardPage = named(() => import("@/pages/DashboardPage"), "DashboardPage");
const TeamPage = named(() => import("@/pages/TeamPage"), "TeamPage");
const NotFoundPage = named(() => import("@/pages/NotFoundPage"), "NotFoundPage");
const InvoiceListPage = named(() => import("@/pages/invoices/InvoiceListPage"), "InvoiceListPage");
const InvoiceDetailPage = named(() => import("@/pages/invoices/InvoiceDetailPage"), "InvoiceDetailPage");
const InvoiceFormPage = named(() => import("@/pages/invoices/InvoiceFormPage"), "InvoiceFormPage");
const ProjectsPage = named(() => import("@/pages/projects/ProjectsPage"), "ProjectsPage");
const ProjectDetailPage = named(() => import("@/pages/projects/ProjectDetailPage"), "ProjectDetailPage");
const ProjectManagementPage = named(
  () => import("@/pages/projects/ProjectManagementPage"),
  "ProjectManagementPage",
);
const FinancePage = named(() => import("@/pages/finance/FinancePage"), "FinancePage");
const CalendarPage = named(() => import("@/pages/calendar/CalendarPage"), "CalendarPage");
const NotesPage = named(() => import("@/pages/notes/NotesPage"), "NotesPage");
const NotificationsPage = named(() => import("@/pages/NotificationsPage"), "NotificationsPage");
const SearchPage = named(() => import("@/pages/SearchPage"), "SearchPage");
const ActivityLogsPage = named(() => import("@/pages/ActivityLogsPage"), "ActivityLogsPage");
const ProfilePage = named(() => import("@/pages/placeholders"), "ProfilePage");
const SettingsPage = named(() => import("@/pages/placeholders"), "SettingsPage");

export function App() {
  if (!isSupabaseConfigured) return <SetupRequired />;

  return (
    <BrowserRouter>
      <Suspense fallback={<FullScreenLoader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Authenticated app */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="invoices" element={<InvoiceListPage />} />
              <Route path="invoices/:id" element={<InvoiceDetailPage />} />
              <Route element={<RoleRoute allow={["owner", "co_owner"]} />}>
                <Route path="invoices/new" element={<InvoiceFormPage />} />
                <Route path="invoices/:id/edit" element={<InvoiceFormPage />} />
              </Route>
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="project-management" element={<ProjectManagementPage />} />
              <Route element={<RoleRoute allow={["owner", "co_owner"]} />}>
                <Route path="finance" element={<FinancePage />} />
                <Route path="team" element={<TeamPage />} />
              </Route>
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="activity" element={<ActivityLogsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
