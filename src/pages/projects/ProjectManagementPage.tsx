import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Plus, Table2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProjectMgmtCard } from "@/features/projects/ProjectMgmtCard";
import { ProjectTable } from "@/features/projects/ProjectTable";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { listProjects } from "@/features/projects/api";
import { useAuth } from "@/features/auth/useAuth";
import { SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { Project, ServiceType } from "@/types/database";

type Bucket = "ongoing" | "almost" | "finished";

function categorize(p: Project): Bucket | null {
  const finished = p.status === "finished" || p.progress === 100;
  if (finished) return "finished";
  if (p.status === "cancelled") return null;
  if (p.progress >= 75) return "almost";
  if (p.status === "ongoing" || p.status === "existing") return "ongoing";
  return null; // leads / proposals belong to the CRM, not here
}

const BUCKET_LABELS: Record<Bucket, string> = {
  ongoing: "Ongoing",
  almost: "Almost Finished",
  finished: "Finished",
};

export function ProjectManagementPage() {
  const navigate = useNavigate();
  const { canManageProjects } = useAuth();
  const [bucket, setBucket] = useState<Bucket>("ongoing");
  const [serviceType, setServiceType] = useState<ServiceType | "all">("all");
  const [grid, setGrid] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const query = useQuery({ queryKey: ["projects", {}], queryFn: () => listProjects() });
  const all = query.data ?? [];

  const byBucket = useMemo(() => {
    const map: Record<Bucket, Project[]> = { ongoing: [], almost: [], finished: [] };
    for (const p of all) {
      const b = categorize(p);
      if (b) map[b].push(p);
    }
    return map;
  }, [all]);

  const visible = byBucket[bucket].filter(
    (p) => serviceType === "all" || p.service_type === serviceType,
  );

  return (
    <div>
      <PageHeader title="Project Management" description="Track what's ongoing, almost done and finished — and who owns it.">
        {canManageProjects && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        )}
      </PageHeader>

      <Tabs value={bucket} onValueChange={(v) => setBucket(v as Bucket)}>
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            {(Object.keys(BUCKET_LABELS) as Bucket[]).map((b) => (
              <TabsTrigger key={b} value={b}>
                {BUCKET_LABELS[b]}
                <span className="ml-1.5 rounded-full bg-background/60 px-1.5 text-xs">
                  {byBucket[b].length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <Select value={serviceType} onValueChange={(v) => setServiceType(v as ServiceType | "all")}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SERVICE_TYPE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-md border p-0.5">
              <button
                onClick={() => setGrid(true)}
                className={`rounded p-1.5 ${grid ? "bg-muted" : ""}`}
                title="Grid"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setGrid(false)}
                className={`rounded p-1.5 ${!grid ? "bg-muted" : ""}`}
                title="Table"
              >
                <Table2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {query.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Card className="py-20 text-center text-muted-foreground">
            No {BUCKET_LABELS[bucket].toLowerCase()} projects
            {serviceType !== "all" ? ` for ${SERVICE_TYPE_LABELS[serviceType]}` : ""}.
          </Card>
        ) : grid ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((p) => (
              <ProjectMgmtCard key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <ProjectTable projects={visible} onRowClick={(id) => navigate(`/projects/${id}`)} />
          </Card>
        )}
      </Tabs>

      <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={(id) => navigate(`/projects/${id}`)} />
    </div>
  );
}
