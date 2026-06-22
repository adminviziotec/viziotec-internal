import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, FileText, FolderKanban, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InvoiceStatusBadge } from "@/features/invoices/StatusBadge";
import { globalSearch } from "@/features/search/api";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONES } from "@/lib/constants";

export function SearchPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get("q") ?? "");
  const debounced = useDebounce(term, 300);

  // Keep the URL in sync with the active search term.
  useEffect(() => {
    setParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced, setParams]);

  const enabled = debounced.trim().length >= 2;
  const query = useQuery({
    queryKey: ["search", debounced],
    queryFn: () => globalSearch(debounced),
    enabled,
  });

  const r = query.data;
  const empty =
    r && r.invoices.length === 0 && r.projects.length === 0 && r.events.length === 0 && r.clients.length === 0;

  return (
    <div>
      <PageHeader title="Search" description="Find invoices, projects, clients and events." />

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Type at least 2 characters…"
          className="h-12 pl-11 text-base"
        />
        {query.isFetching && (
          <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {!enabled ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Start typing to search across the workspace.
        </p>
      ) : empty ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No results for “{debounced}”.
        </p>
      ) : (
        <div className="space-y-6">
          {r && r.invoices.length > 0 && (
            <Section title="Invoices" icon={FileText}>
              {r.invoices.map((i) => (
                <ResultRow key={i.id} onClick={() => navigate(`/invoices/${i.id}`)}>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{i.invoice_number}</p>
                    <p className="truncate text-xs text-muted-foreground">{i.client_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatCurrency(i.grand_total)}</span>
                    <InvoiceStatusBadge status={i.status} />
                  </div>
                </ResultRow>
              ))}
            </Section>
          )}

          {r && r.projects.length > 0 && (
            <Section title="Projects" icon={FolderKanban}>
              {r.projects.map((p) => (
                <ResultRow key={p.id} onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{p.project_name}</p>
                    {p.client_name && <p className="truncate text-xs text-muted-foreground">{p.client_name}</p>}
                  </div>
                  <Badge className={PROJECT_STATUS_TONES[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
                </ResultRow>
              ))}
            </Section>
          )}

          {r && r.clients.length > 0 && (
            <Section title="Clients" icon={Building2}>
              <div className="flex flex-wrap gap-2 p-1">
                {r.clients.map((c) => (
                  <button
                    key={c}
                    onClick={() => setTerm(c)}
                    className="rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {r && r.events.length > 0 && (
            <Section title="Calendar events" icon={CalendarDays}>
              {r.events.map((e) => (
                <ResultRow key={e.id} onClick={() => navigate("/calendar")}>
                  <p className="truncate font-medium">{e.title}</p>
                  <span className="text-xs text-muted-foreground">{formatDateTime(e.start_datetime)}</span>
                </ResultRow>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Search; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" /> {title}
      </div>
      <Card className="divide-y p-1">{children}</Card>
    </div>
  );
}

function ResultRow({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/60"
    >
      {children}
    </button>
  );
}
