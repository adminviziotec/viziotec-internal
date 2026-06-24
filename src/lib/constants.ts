import type {
  EventType,
  InvoiceStatus,
  NoteColor,
  ProjectPriority,
  ProjectStatus,
  QuotationStatus,
  ServiceType,
  TransactionType,
  UserRole,
} from "@/types/database";

type LabelMap<T extends string> = Record<T, string>;
/** Tailwind classes for a soft badge per status/value. */
type ToneMap<T extends string> = Record<T, string>;

export const ROLE_LABELS: LabelMap<UserRole> = {
  owner: "Owner",
  co_owner: "Co-Owner",
  team_member: "Team Member",
};

export const INVOICE_STATUS_LABELS: LabelMap<InvoiceStatus> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const INVOICE_STATUS_TONES: ToneMap<InvoiceStatus> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  paid: "bg-success/15 text-success",
  overdue: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground line-through",
};

export const QUOTATION_STATUS_LABELS: LabelMap<QuotationStatus> = {
  draft: "Draft",
  sent: "Sent",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
};

export const QUOTATION_STATUS_TONES: ToneMap<QuotationStatus> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  accepted: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  expired: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
};

export const PROJECT_STATUS_LABELS: LabelMap<ProjectStatus> = {
  lead: "Lead",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  ongoing: "Ongoing",
  existing: "Existing",
  finished: "Finished",
  cancelled: "Cancelled",
};

export const PROJECT_STATUS_TONES: ToneMap<ProjectStatus> = {
  lead: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  proposal_sent: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  negotiation: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  ongoing: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  existing: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  finished: "bg-success/15 text-success",
  cancelled: "bg-destructive/15 text-destructive",
};

/** Order of columns on the CRM Kanban board (Module 3). */
export const KANBAN_COLUMNS: ProjectStatus[] = [
  "lead",
  "proposal_sent",
  "negotiation",
  "ongoing",
  "existing",
  "finished",
];

export const PRIORITY_LABELS: LabelMap<ProjectPriority> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_TONES: ToneMap<ProjectPriority> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  high: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  urgent: "bg-destructive/15 text-destructive",
};

export const SERVICE_TYPE_LABELS: LabelMap<ServiceType> = {
  website_design: "Website Design",
  application_development: "Application Development",
  branding: "Branding",
  digital_marketing: "Digital Marketing",
  seo: "SEO",
  social_media_management: "Social Media Management",
  advertising: "Advertising",
  other: "Other",
};

export const EVENT_TYPE_LABELS: LabelMap<EventType> = {
  meeting: "Meeting",
  project_deadline: "Project Deadline",
  internal_agenda: "Internal Agenda",
  personal_reminder: "Personal Reminder",
};

export const EVENT_TYPE_TONES: ToneMap<EventType> = {
  meeting: "bg-blue-500 text-white",
  project_deadline: "bg-destructive text-white",
  internal_agenda: "bg-primary text-primary-foreground",
  personal_reminder: "bg-amber-500 text-white",
};

export const EXPENSE_CATEGORIES = [
  "Salary",
  "Hosting",
  "Software Subscription",
  "Advertising",
  "Office Supplies",
  "Transportation",
  "Operational",
  "Miscellaneous",
] as const;

export const INCOME_CATEGORIES = [
  "Website Project",
  "Branding Project",
  "Marketing Service",
  "Maintenance Fee",
  "Other",
] as const;

export const TRANSACTION_TYPE_LABELS: LabelMap<TransactionType> = {
  income: "Income",
  expense: "Expense",
};

export const REMINDER_OPTIONS = [
  { value: 15, label: "15 minutes before" },
  { value: 30, label: "30 minutes before" },
  { value: 60, label: "1 hour before" },
  { value: 1440, label: "1 day before" },
] as const;

/** Sticky-note palette (Module 6). */
export const NOTE_COLORS: Record<NoteColor, { bg: string; ring: string; dot: string }> = {
  yellow: { bg: "bg-amber-100 text-amber-950", ring: "ring-amber-300", dot: "bg-amber-400" },
  blue: { bg: "bg-sky-100 text-sky-950", ring: "ring-sky-300", dot: "bg-sky-400" },
  pink: { bg: "bg-pink-100 text-pink-950", ring: "ring-pink-300", dot: "bg-pink-400" },
  green: { bg: "bg-emerald-100 text-emerald-950", ring: "ring-emerald-300", dot: "bg-emerald-400" },
  purple: { bg: "bg-violet-100 text-violet-950", ring: "ring-violet-300", dot: "bg-violet-400" },
};
