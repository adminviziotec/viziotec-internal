import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { KanbanSquare, Plus, Search, Table2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KanbanBoard } from "@/features/projects/KanbanBoard";
import { ProjectTable } from "@/features/projects/ProjectTable";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { listProjects } from "@/features/projects/api";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/features/auth/useAuth";
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";
import type { Project, ProjectPriority, ProjectStatus, ServiceType } from "@/types/database";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { canManageProjects, canEditProject } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [priority, setPriority] = useState<ProjectPriority | "all">("all");
  const [serviceType, setServiceType] = useState<ServiceType | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebounce(search);

  const filters = { search: debouncedSearch, status, priority, service_type: serviceType };
  const query = useQuery({
    queryKey: ["projects", filters],
    queryFn: () => listProjects(filters),
  });

  const projects = query.data ?? [];

  return (
    <div>
      <PageHeader title="Leads & Projects" description="Your sales pipeline and active work, Kanban or table.">
        {canManageProjects && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> New project
          </Button>
        )}
      </PageHeader>

      <Tabs defaultValue="kanban">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <TabsList>
            <TabsTrigger value="kanban">
              <KanbanSquare className="mr-1.5 h-4 w-4" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="table">
              <Table2 className="mr-1.5 h-4 w-4" /> Table
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-9"
              />
            </div>
            <FilterSelect value={status} onChange={(v) => setStatus(v as ProjectStatus | "all")} placeholder="Status" options={PROJECT_STATUS_LABELS} />
            <FilterSelect value={priority} onChange={(v) => setPriority(v as ProjectPriority | "all")} placeholder="Priority" options={PRIORITY_LABELS} />
            <FilterSelect value={serviceType} onChange={(v) => setServiceType(v as ServiceType | "all")} placeholder="Type" options={SERVICE_TYPE_LABELS} />
          </div>
        </div>

        {query.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="kanban">
              <KanbanBoard
                projects={projects}
                onCardClick={(id) => navigate(`/projects/${id}`)}
                canEdit={(p: Project) => canEditProject(p)}
              />
            </TabsContent>
            <TabsContent value="table">
              <Card className="overflow-hidden">
                <ProjectTable projects={projects} onRowClick={(id) => navigate(`/projects/${id}`)} />
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={(id) => navigate(`/projects/${id}`)}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: Record<string, string>;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-36">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {placeholder.toLowerCase()}</SelectItem>
        {Object.entries(options).map(([k, label]) => (
          <SelectItem key={k} value={k}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
