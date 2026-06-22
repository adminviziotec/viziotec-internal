import {
  LayoutDashboard,
  FileText,
  KanbanSquare,
  ClipboardList,
  Wallet,
  CalendarDays,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/database";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** When set, only these roles see the item. Otherwise everyone does. */
  roles?: UserRole[];
  /** Module grouping for the sidebar. */
  section: "main" | "workspace";
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/", icon: LayoutDashboard, section: "main" },
  { label: "Invoices", to: "/invoices", icon: FileText, section: "workspace" },
  { label: "Leads & CRM", to: "/projects", icon: KanbanSquare, section: "workspace" },
  { label: "Project Management", to: "/project-management", icon: ClipboardList, section: "workspace" },
  {
    label: "Finance",
    to: "/finance",
    icon: Wallet,
    section: "workspace",
    roles: ["owner", "co_owner"],
  },
  { label: "Calendar", to: "/calendar", icon: CalendarDays, section: "workspace" },
  { label: "Sticky Notes", to: "/notes", icon: StickyNote, section: "workspace" },
];

export function visibleNavItems(role: UserRole | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role)));
}
