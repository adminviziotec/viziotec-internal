import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { env } from "@/lib/env";
import { useAuth } from "@/features/auth/useAuth";
import { visibleNavItems } from "@/config/navigation";

function NavSection({ items, onNavigate }: { items: ReturnType<typeof visibleNavItems>; onNavigate?: () => void }) {
  return (
    <div className="space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground hover:bg-white/5 hover:text-white",
            )
          }
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role } = useAuth();
  const items = visibleNavItems(role);
  const main = items.filter((i) => i.section === "main");
  const workspace = items.filter((i) => i.section === "workspace");

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center gap-2 px-5 text-white">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold">V</div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">{env.company.name}</p>
          <p className="text-[11px] text-sidebar-foreground/60">Internal System</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <NavSection items={main} onNavigate={onNavigate} />
        <div>
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            Workspace
          </p>
          <NavSection items={workspace} onNavigate={onNavigate} />
        </div>
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-[11px] text-sidebar-foreground/50">
        VIMS v0.1 · {new Date().getFullYear()}
      </div>
    </div>
  );
}

/** Desktop fixed sidebar + mobile slide-over. */
export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border lg:block">
        <div className="fixed inset-y-0 left-0 w-64">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", stiffness: 350, damping: 32 }}
            className="absolute inset-y-0 left-0 w-64"
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-4 z-10 text-sidebar-foreground/70 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={onClose} />
          </motion.div>
        </div>
      )}
    </>
  );
}
