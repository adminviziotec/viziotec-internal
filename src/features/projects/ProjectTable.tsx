import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/UserAvatar";
import { AssigneeAvatars } from "./ProjectCard";
import { useUserMap } from "@/hooks/useUsers";
import { cn, formatDate } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  PRIORITY_TONES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONES,
} from "@/lib/constants";
import type { Project } from "@/types/database";

export function ProjectTable({
  projects,
  onRowClick,
}: {
  projects: Project[];
  onRowClick: (id: string) => void;
}) {
  const userMap = useUserMap();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Manager</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Progress</TableHead>
          <TableHead>Deadline</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((p) => {
          const pm = p.project_manager ? userMap[p.project_manager] : undefined;
          const overdue =
            p.deadline && new Date(p.deadline) < new Date(new Date().toDateString()) && p.status !== "finished";
          return (
            <TableRow key={p.id} className="cursor-pointer" onClick={() => onRowClick(p.id)}>
              <TableCell>
                <p className="font-medium">{p.project_name}</p>
                {p.client_name && <p className="text-xs text-muted-foreground">{p.client_name}</p>}
              </TableCell>
              <TableCell>
                {pm ? (
                  <div className="flex items-center gap-2">
                    <UserAvatar name={pm.full_name} image={pm.profile_image} className="h-6 w-6 text-[10px]" />
                    <span className="text-sm">{pm.full_name || pm.email}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <AssigneeAvatars ids={p.assigned_to} />
              </TableCell>
              <TableCell>
                <Badge className={PRIORITY_TONES[p.priority]}>{PRIORITY_LABELS[p.priority]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={p.progress} className="h-1.5 w-20" />
                  <span className="text-xs text-muted-foreground">{p.progress}%</span>
                </div>
              </TableCell>
              <TableCell>
                <span className={cn("text-sm", overdue ? "text-destructive" : "text-muted-foreground")}>
                  {formatDate(p.deadline)}
                </span>
              </TableCell>
              <TableCell>
                <Badge className={PROJECT_STATUS_TONES[p.status]}>{PROJECT_STATUS_LABELS[p.status]}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
        {projects.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
              No projects match your filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
