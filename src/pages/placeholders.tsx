import {
  FileText,
  KanbanSquare,
  ClipboardList,
  Wallet,
  CalendarDays,
  StickyNote,
  Bell,
  Search,
  User,
  Settings,
} from "lucide-react";
import { PlaceholderPage } from "./PlaceholderPage";

export const InvoicesPage = () => (
  <PlaceholderPage title="Invoices" description="Create, search and export professional invoices." icon={FileText} phase="Phase 2 — Invoice Management." />
);

export const ProjectsPage = () => (
  <PlaceholderPage title="Leads & CRM" description="Kanban pipeline from lead to finished project." icon={KanbanSquare} phase="Phase 3 — Project CRM." />
);

export const ProjectManagementPage = () => (
  <PlaceholderPage title="Project Management" description="Track ongoing, almost-finished and finished projects by manager and type." icon={ClipboardList} phase="Phase 7 — Project Management." />
);

export const FinancePage = () => (
  <PlaceholderPage title="Finance" description="Income, expenses, company cash and reports." icon={Wallet} phase="Phase 4 — Finance Module." />
);

export const CalendarPage = () => (
  <PlaceholderPage title="Calendar" description="Team agenda with month, week and day views." icon={CalendarDays} phase="Phase 5 — Calendar." />
);

export const NotesPage = () => (
  <PlaceholderPage title="Sticky Notes" description="Your private, colorful notes board." icon={StickyNote} phase="Phase 6 — Sticky Notes." />
);

export const NotificationsPage = () => (
  <PlaceholderPage title="Notifications" description="Invoice, project and agenda alerts." icon={Bell} phase="Phase 7 — Notifications." />
);

export const SearchPage = () => (
  <PlaceholderPage title="Search" description="Search invoices, projects, clients and events." icon={Search} phase="Phase 7 — Global Search." />
);

export const ProfilePage = () => (
  <PlaceholderPage title="Profile" description="Manage your account details." icon={User} />
);

export const SettingsPage = () => (
  <PlaceholderPage title="Settings" description="Workspace and user management." icon={Settings} />
);
