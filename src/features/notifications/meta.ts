import {
  CalendarClock,
  CalendarDays,
  FileText,
  RefreshCw,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { NotificationType } from "@/types/database";

export const NOTIF_META: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  invoice_due: { icon: FileText, tone: "bg-warning/15 text-warning" },
  project_deadline: { icon: CalendarClock, tone: "bg-destructive/15 text-destructive" },
  agenda_reminder: { icon: CalendarDays, tone: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  project_assigned: { icon: UserPlus, tone: "bg-primary/15 text-primary" },
  project_update: { icon: RefreshCw, tone: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
};
