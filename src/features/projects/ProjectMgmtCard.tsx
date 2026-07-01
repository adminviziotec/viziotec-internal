import { CalendarClock, UserCog } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/UserAvatar";
import { AssigneeAvatars } from "./ProjectCard";
import { useUserMap } from "@/hooks/useUsers";
import { cn, formatDate } from "@/lib/utils";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
  SERVICE_TYPE_LABELS,
} from "@/lib/constants";
import type { Project } from "@/types/database";

export function ProjectMgmtCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const userMap = useUserMap();
  const pm = project.project_manager ? userMap[project.project_manager] : undefined;
  const overdue =
    project.deadline &&
    new Date(project.deadline) < new Date(new Date().toDateString()) &&
    project.status !== "finished";

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onClick}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-semibold">{project.project_name}</p>
            {project.client_name && (
              <p className="truncate text-xs text-muted-foreground">{project.client_name}</p>
            )}
          </div>
          <Badge className={cn("shrink-0", PROJECT_STATUS_TONES[project.status])}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>

        <Badge className="bg-muted text-muted-foreground">
          {SERVICE_TYPE_LABELS[project.service_type]}
        </Badge>

        {/* Project manager — surfaced prominently */}
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
          <UserCog className="h-4 w-4 shrink-0 text-muted-foreground" />
          {pm ? (
            <div className="flex min-w-0 items-center gap-2">
              <UserAvatar name={pm.full_name} image={pm.profile_image} className="h-6 w-6 shrink-0 text-[10px]" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight">{pm.full_name || pm.email}</p>
                <p className="text-[11px] text-muted-foreground">Project manager</p>
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">No manager assigned</span>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Progress</span>
            <span>{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <AssigneeAvatars ids={project.assigned_to} />
          {project.deadline && (
            <span className={cn("flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px]", overdue ? "text-destructive" : "text-muted-foreground")}>
              <CalendarClock className="h-3 w-3 shrink-0" />
              {formatDate(project.deadline, { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
