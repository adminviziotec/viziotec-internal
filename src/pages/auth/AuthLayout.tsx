import { motion } from "framer-motion";
import { env } from "@/lib/env";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-2 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold">
            V
          </div>
          <span className="text-lg font-semibold">{env.company.name} · VIMS</span>
        </div>
        <div className="relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-3xl font-bold leading-tight text-white"
          >
            One internal portal for invoices, projects, finance &amp; team agenda.
          </motion.h2>
          <p className="mt-4 max-w-md text-sidebar-foreground/80">
            Replace scattered spreadsheets with a single, fast, modern workspace built for
            {" "}
            {env.company.name}.
          </p>
        </div>
        <p className="relative z-10 text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} {env.company.name}. Internal use only.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
              V
            </div>
            <span className="text-lg font-semibold">VIMS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
