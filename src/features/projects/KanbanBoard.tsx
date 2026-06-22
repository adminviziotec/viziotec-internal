import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProjectCard } from "./ProjectCard";
import { updateProjectStatus } from "./api";
import { toast } from "@/components/ui/toast";
import { KANBAN_COLUMNS, PROJECT_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Project, ProjectStatus } from "@/types/database";

interface KanbanBoardProps {
  projects: Project[];
  onCardClick: (id: string) => void;
  canEdit: (project: Project) => boolean;
}

function DraggableCard({
  project,
  onClick,
  draggable,
}: {
  project: Project;
  onClick: () => void;
  draggable: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: project.id,
    disabled: !draggable,
  });
  return (
    <div ref={setNodeRef}>
      <ProjectCard
        project={project}
        onClick={onClick}
        isDragging={isDragging}
        dragHandleProps={draggable ? { ...attributes, ...(listeners as object) } : undefined}
      />
    </div>
  );
}

function Column({
  status,
  projects,
  onCardClick,
  canEdit,
}: {
  status: ProjectStatus;
  projects: Project[];
  onCardClick: (id: string) => void;
  canEdit: (p: Project) => boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold">{PROJECT_STATUS_LABELS[status]}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {projects.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[120px] flex-1 flex-col gap-2 rounded-xl border border-dashed bg-muted/30 p-2 transition-colors",
          isOver && "border-primary bg-primary/5",
        )}
      >
        {projects.map((p) => (
          <DraggableCard key={p.id} project={p} onClick={() => onCardClick(p.id)} draggable={canEdit(p)} />
        ))}
        {projects.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground/60">Drop here</p>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({ projects, onCardClick, canEdit }: KanbanBoardProps) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<Project[]>(projects);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => setItems(projects), [projects]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    const map = Object.fromEntries(KANBAN_COLUMNS.map((s) => [s, [] as Project[]])) as Record<
      ProjectStatus,
      Project[]
    >;
    for (const p of items) {
      if (map[p.status]) map[p.status].push(p);
    }
    return map;
  }, [items]);

  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProjectStatus }) => updateProjectStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e) => {
      toast.error("Could not move project", e instanceof Error ? e.message : undefined);
      setItems(projects); // revert
    },
  });

  function handleStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleEnd(e: DragEndEvent) {
    setActiveId(null);
    const id = String(e.active.id);
    const target = e.over?.id as ProjectStatus | undefined;
    if (!target) return;
    const project = items.find((p) => p.id === id);
    if (!project || project.status === target) return;
    if (!KANBAN_COLUMNS.includes(target)) return;

    // Optimistic move.
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status: target } : p)));
    mutation.mutate({ id, status: target });
  }

  const activeProject = items.find((p) => p.id === activeId) ?? null;

  return (
    <DndContext sensors={sensors} onDragStart={handleStart} onDragEnd={handleEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => (
          <Column
            key={status}
            status={status}
            projects={grouped[status]}
            onCardClick={onCardClick}
            canEdit={canEdit}
          />
        ))}
      </div>
      <DragOverlay>
        {activeProject ? (
          <div className="w-72">
            <ProjectCard project={activeProject} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
