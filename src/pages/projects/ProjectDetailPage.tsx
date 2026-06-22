import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Activity as ActivityIcon,
  CalendarClock,
  CalendarRange,
  Pencil,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { FullScreenLoader } from "@/components/FullScreenLoader";
import { UserAvatar } from "@/components/UserAvatar";
import { AssigneeAvatars } from "@/features/projects/ProjectCard";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { deleteProject, getProject, updateProjectProgress } from "@/features/projects/api";
import { useAuth } from "@/features/auth/useAuth";
import { useUserMap } from "@/hooks/useUsers";
import { toast } from "@/components/ui/toast";
import { cn, formatCurrency, formatDate, relativeTime } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  PRIORITY_TONES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";

const PROGRESS_STEPS = [0, 25, 50, 75, 100];

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { canManageFinance, canManageProjects, canEditProject } = useAuth();
  const userMap = useUserMap();
  const [editOpen, setEditOpen] = useState(false);

  const query = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id!, canManageFinance),
    enabled: !!id,
  });

  const progressMutation = useMutation({
    mutationFn: (progress: number) => updateProjectProgress(id!, progress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) => toast.error("Failed to update", e instanceof Error ? e.message : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(id!),
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
    onError: (e) => toast.error("Failed to delete", e instanceof Error ? e.message : undefined),
  });

  if (query.isLoading) return <FullScreenLoader label="Loading project…" />;
  if (query.isError || !query.data) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Project not found.</p>
        <Button className="mt-4" onClick={() => navigate("/projects")}>
          Back to projects
        </Button>
      </div>
    );
  }

  const p = query.data;
  const pm = p.project_manager ? userMap[p.project_manager] : undefined;
  const editable = canEditProject(p);
  const income = p.finance.filter((f) => f.type === "income").reduce((s, f) => s + Number(f.amount), 0);
  const expense = p.finance.filter((f) => f.type === "expense").reduce((s, f) => s + Number(f.amount), 0);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          {editable && (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          )}
          {canManageProjects && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm(`Delete "${p.project_name}"? This cannot be undone.`)) deleteMutation.mutate();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{p.project_name}</h1>
            <Badge className={PROJECT_STATUS_TONES[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
            <Badge className={PRIORITY_TONES[p.priority]}>{PRIORITY_LABELS[p.priority]}</Badge>
          </div>
          {p.client_name && <p className="mt-1 text-muted-foreground">{p.client_name}</p>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Info label="Service type" value={SERVICE_TYPE_LABELS[p.service_type]} />
                <Info label="Budget" value={p.budget != null ? formatCurrency(p.budget) : "—"} />
                <Info
                  label="Start date"
                  value={formatDate(p.start_date)}
                  icon={<CalendarRange className="h-4 w-4 text-muted-foreground" />}
                />
                <Info
                  label="Deadline"
                  value={formatDate(p.deadline)}
                  icon={<CalendarClock className="h-4 w-4 text-muted-foreground" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Progress value={p.progress} className="h-2.5 flex-1" />
                <span className="w-10 text-right text-sm font-semibold">{p.progress}%</span>
              </div>
              {editable && (
                <div className="flex flex-wrap gap-2">
                  {PROGRESS_STEPS.map((step) => (
                    <Button
                      key={step}
                      size="sm"
                      variant={p.progress === step ? "default" : "outline"}
                      onClick={() => progressMutation.mutate(step)}
                      disabled={progressMutation.isPending}
                    >
                      {step}%
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial info — managers only */}
          {canManageFinance && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" /> Financial information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                  <Stat label="Income" value={formatCurrency(income)} tone="text-success" />
                  <Stat label="Expense" value={formatCurrency(expense)} tone="text-destructive" />
                  <Stat label="Net" value={formatCurrency(income - expense)} tone="text-primary" />
                </div>
                {p.finance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions linked to this project yet.</p>
                ) : (
                  <div className="space-y-2">
                    {p.finance.map((f) => (
                      <div key={f.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
                        <div>
                          <p className="font-medium">{f.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {f.category} · {formatDate(f.transaction_date)}
                          </p>
                        </div>
                        <span className={cn("font-semibold", f.type === "income" ? "text-success" : "text-destructive")}>
                          {f.type === "income" ? "+" : "−"}
                          {formatCurrency(f.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {p.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{p.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Project manager
                </p>
                {pm ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar name={pm.full_name} image={pm.profile_image} className="h-8 w-8 text-xs" />
                    <div>
                      <p className="text-sm font-medium">{pm.full_name || pm.email}</p>
                      {pm.position && <p className="text-xs text-muted-foreground">{pm.position}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Assigned team
                </p>
                <AssigneeAvatars ids={p.assigned_to} max={6} />
              </div>
            </CardContent>
          </Card>

          {/* Activity timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="h-5 w-5 text-primary" /> Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {p.activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ol className="relative space-y-4 border-l pl-5">
                  {p.activity.map((a) => {
                    const actor = a.user_id ? userMap[a.user_id] : undefined;
                    return (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
                        <p className="text-sm">
                          <span className="font-medium">{actor?.full_name?.split(" ")[0] ?? "Someone"}</span>{" "}
                          {a.activity}
                        </p>
                        <p className="text-xs text-muted-foreground">{relativeTime(a.created_at)}</p>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ProjectFormDialog open={editOpen} onOpenChange={setEditOpen} project={p} />
    </div>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {value}
      </p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-sm font-bold", tone)}>{value}</p>
    </div>
  );
}
