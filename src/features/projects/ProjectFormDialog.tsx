import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserMultiSelect } from "@/components/UserMultiSelect";
import { toast } from "@/components/ui/toast";
import { useUsers } from "@/hooks/useUsers";
import { createProject, updateProject } from "./api";
import { projectFormSchema, defaultProjectValues, type ProjectFormValues } from "./schema";
import {
  PROJECT_STATUS_LABELS,
  PRIORITY_LABELS,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";
import type { Project, ProjectPriority, ProjectStatus, ServiceType } from "@/types/database";

const PROGRESS_STEPS = [0, 25, 50, 75, 100];

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Project | null;
  onSaved?: (id: string) => void;
}

export function ProjectFormDialog({ open, onOpenChange, project, onSaved }: ProjectFormDialogProps) {
  const isEdit = Boolean(project);
  const queryClient = useQueryClient();
  const { data: users = [] } = useUsers();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: defaultProjectValues,
  });

  useEffect(() => {
    if (open) {
      reset(
        project
          ? {
              project_name: project.project_name,
              client_name: project.client_name ?? "",
              description: project.description ?? "",
              service_type: project.service_type,
              project_manager: project.project_manager ?? "",
              assigned_to: project.assigned_to ?? [],
              status: project.status,
              priority: project.priority,
              progress: project.progress,
              start_date: project.start_date ?? "",
              deadline: project.deadline ?? "",
              budget: project.budget ?? undefined,
              notes: project.notes ?? "",
            }
          : defaultProjectValues,
      );
    }
  }, [open, project, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      isEdit ? updateProject(project!.id, values).then(() => project!.id) : createProject(values).then((p) => p.id),
    onSuccess: (id) => {
      toast.success(isEdit ? "Project updated" : "Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      onOpenChange(false);
      onSaved?.(id);
    },
    onError: (e) => toast.error("Could not save project", e instanceof Error ? e.message : undefined),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the project details." : "Add a lead or project to the pipeline."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Project name</Label>
              <Input {...register("project_name")} placeholder="Acme website redesign" />
              {errors.project_name && <p className="text-xs text-destructive">{errors.project_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Client</Label>
              <Input {...register("client_name")} placeholder="Acme Corp" />
            </div>
            <div className="space-y-1.5">
              <Label>Service type</Label>
              <Controller
                control={control}
                name="service_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(SERVICE_TYPE_LABELS) as ServiceType[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {SERVICE_TYPE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} placeholder="Short summary of the work…" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {PROJECT_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PRIORITY_LABELS) as ProjectPriority[]).map((p) => (
                        <SelectItem key={p} value={p}>
                          {PRIORITY_LABELS[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Project manager</Label>
              <Controller
                control={control}
                name="project_manager"
                render={({ field }) => (
                  <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.full_name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Progress</Label>
              <Controller
                control={control}
                name="progress"
                render={({ field }) => (
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRESS_STEPS.map((p) => (
                        <SelectItem key={p} value={String(p)}>
                          {p}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned team members</Label>
            <Controller
              control={control}
              name="assigned_to"
              render={({ field }) => <UserMultiSelect value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Start date</Label>
              <Input type="date" {...register("start_date")} />
            </div>
            <div className="space-y-1.5">
              <Label>Deadline</Label>
              <Input type="date" {...register("deadline")} />
            </div>
            <div className="space-y-1.5">
              <Label>Budget</Label>
              <Input type="number" step="any" min="0" {...register("budget")} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
