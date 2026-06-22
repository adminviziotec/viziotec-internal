// Hand-written types mirroring supabase/migrations. Kept deliberately simple;
// regenerate with `supabase gen types typescript` once the project is linked.

export type UserRole = "owner" | "co_owner" | "team_member";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type ProjectStatus =
  | "lead"
  | "proposal_sent"
  | "negotiation"
  | "ongoing"
  | "existing"
  | "finished"
  | "cancelled";
export type ProjectPriority = "low" | "medium" | "high" | "urgent";
export type ServiceType =
  | "website_design"
  | "application_development"
  | "branding"
  | "digital_marketing"
  | "seo"
  | "social_media_management"
  | "advertising"
  | "other";
export type TransactionType = "income" | "expense";
export type EventType =
  | "meeting"
  | "project_deadline"
  | "internal_agenda"
  | "personal_reminder";
export type NoteColor = "yellow" | "blue" | "pink" | "green" | "purple";
export type NotificationType =
  | "invoice_due"
  | "project_deadline"
  | "agenda_reminder"
  | "project_assigned"
  | "project_update";

export type UserProfile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  profile_image: string | null;
  position: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type Invoice = {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  project_id: string | null;
  project_name: string | null;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  tax_percentage: number;
  tax_amount: number;
  discount: number;
  grand_total: number;
  status: InvoiceStatus;
  notes: string | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  service_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  sort_order: number;
}

export type Project = {
  id: string;
  project_name: string;
  client_name: string | null;
  description: string | null;
  service_type: ServiceType;
  project_manager: string | null;
  assigned_to: string[];
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  start_date: string | null;
  deadline: string | null;
  budget: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectActivity = {
  id: string;
  project_id: string;
  user_id: string | null;
  activity: string;
  created_at: string;
}

export type FinanceTransaction = {
  id: string;
  type: TransactionType;
  category: string;
  title: string;
  description: string | null;
  amount: number;
  transaction_date: string;
  receipt_url: string | null;
  project_id: string | null;
  created_by: string | null;
  created_at: string;
}

export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_datetime: string;
  end_datetime: string | null;
  all_day: boolean;
  created_by: string | null;
  assigned_to: string[];
  reminder: number | null;
  created_at: string;
}

export type Note = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  color: NoteColor;
  position_x: number;
  position_y: number;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export type AppNotification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export type ActivityLog = {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type CompanyCash = {
  total_income: number;
  total_expense: number;
  current_money: number;
}

// Minimal Database shape for the typed Supabase client. The `Relationships: []`
// key is required by supabase-js for table types to satisfy its `GenericTable`
// constraint — without it, mutation payloads resolve to `never`.
type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };
export type Database = {
  public: {
    Tables: {
      users: Row<UserProfile>;
      invoices: Row<Invoice>;
      invoice_items: Row<InvoiceItem>;
      projects: Row<Project>;
      project_activity: Row<ProjectActivity>;
      finance_transactions: Row<FinanceTransaction>;
      calendar_events: Row<CalendarEvent>;
      notes: Row<Note>;
      notifications: Row<AppNotification>;
      activity_logs: Row<ActivityLog>;
    };
    Views: { company_cash: { Row: CompanyCash; Relationships: [] } };
    Functions: { next_invoice_number: { Args: Record<string, never>; Returns: string } };
  };
}
