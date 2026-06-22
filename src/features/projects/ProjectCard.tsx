import { CalendarClock, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/UserAvatar";
import { useUserMap } from "@/hooks/useUsers";
import { cn, formatDate } from "@/lib/utils";
import { PRIORITY_LABELS, PRIORITY_TONES, SERVICE_TYPE_LABELS } from "@/lib/constants";
import type { Project } from "@/types/database";

export function AssigneeAvatars({ ids, max = 3 }: { ids: string[]; max?: number }) {
  const userMap = useUserMap();
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  if (ids.length === 0) return <span className="text-xs text-muted-foreground">Unassigned</span>;
  return (
    <div className="flex -space-x-2">
      {shown.map((id) => {
        const u = userMap[id];
        return (
          <UserAvatar
            key={id}
            name={u?.full_name}
            image={u?.profile_image}
            className="h-6 w-6 text-[10px] ring-2 ring-card"
          />
        );
      })}
      {extra > 0 && (
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-card">
          +{extra}
        </span>
      )}
    </div>
  );
}

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  isDragging?: boolean;
}

export function ProjectCard({ project, onClick, dragHandleProps, isDragging }: ProjectCardProps) {
  const overdue =
    project.deadline &&
    new Date(project.deadline) < new Date(new Date().toDateString()) &&
    project.status !== "finished";

  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        isDragging && "opacity-50",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-semibold">{project.project_name}</p>
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </div>
      {project.client_name && (
        <p className="mt-0.5 text-xs text-muted-foreground">{project.client_name}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge className={PRIORITY_TONES[project.priority]}>{PRIORITY_LABELS[project.priority]}</Badge>
        <Badge className="bg-muted text-muted-foreground">{SERVICE_TYPE_LABELS[project.service_type]}</Badge>
      </div>

      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-1.5" />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <AssigneeAvatars ids={project.assigned_to} />
        {project.deadline && (
          <span className={cn("flex items-center gap-1 text-[11px]", overdue ? "text-destructive" : "text-muted-foreground")}>
            <CalendarClock className="h-3 w-3" />
            {formatDate(project.deadline, { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}
