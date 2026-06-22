import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import { notifyUsers } from "@/features/notifications/api";
import type { ProjectFormValues } from "./schema";
import type {
  FinanceTransaction,
  Project,
  ProjectActivity,
  ProjectPriority,
  ProjectStatus,
  ServiceType,
} from "@/types/database";

export interface ProjectFilters {
  search?: string;
  status?: ProjectStatus | "all";
  priority?: ProjectPriority | "all";
  service_type?: ServiceType | "all";
  assignedToMe?: string; // user id when filtering "my projects"
}

export async function listProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  let query = supabase.from("projects").select("*").order("updated_at", { ascending: false });

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.priority && filters.priority !== "all") query = query.eq("priority", filters.priority);
  if (filters.service_type && filters.service_type !== "all")
    query = query.eq("service_type", filters.service_type);
  if (filters.assignedToMe) query = query.contains("assigned_to", [filters.assignedToMe]);
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`project_name.ilike.${term},client_name.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Project[];
}

export interface ProjectDetail extends Project {
  activity: ProjectActivity[];
  finance: FinanceTransaction[];
}

export async function getProject(id: string, includeFinance: boolean): Promise<ProjectDetail> {
  const [projectRes, activityRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase
      .from("project_activity")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (projectRes.error) throw projectRes.error;
  if (activityRes.error) throw activityRes.error;

  let finance: FinanceTransaction[] = [];
  if (includeFinance) {
    const { data } = await supabase
      .from("finance_transactions")
      .select("*")
      .eq("project_id", id)
      .order("transaction_date", { ascending: false });
    finance = (data ?? []) as FinanceTransaction[];
  }

  return {
    ...(projectRes.data as Project),
    activity: (activityRes.data ?? []) as ProjectActivity[],
    finance,
  };
}

function toColumns(values: ProjectFormValues) {
  return {
    project_name: values.project_name,
    client_name: values.client_name || null,
    description: values.description || null,
    service_type: values.service_type,
    project_manager: values.project_manager || null,
    assigned_to: values.assigned_to ?? [],
    status: values.status,
    priority: values.priority,
    progress: values.progress,
    start_date: values.start_date || null,
    deadline: values.deadline || null,
    budget: values.budget ?? null,
    notes: values.notes || null,
  };
}

export async function createProject(values: ProjectFormValues): Promise<Project> {
  const { data: userData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("projects")
    .insert({ ...toColumns(values), created_by: userData.user?.id ?? null })
    .select()
    .single();
  if (error) throw error;
  const project = data as Project;
  await addActivity(project.id, `created this project`);
  void logActivity("Projects", `created project ${project.project_name}`, { project_id: project.id });

  const actorId = userData.user?.id;
  const recipients = [...(values.assigned_to ?? []), values.project_manager ?? ""].filter(
    (id) => id && id !== actorId,
  );
  void notifyUsers(recipients, {
    type: "project_assigned",
    title: `Assigned to "${project.project_name}"`,
    body: "You were added to a project.",
    link: `/projects/${project.id}`,
  });
  return project;
}

export async function updateProject(id: string, values: ProjectFormValues): Promise<void> {
  const { error } = await supabase.from("projects").update(toColumns(values)).eq("id", id);
  if (error) throw error;
  void logActivity("Projects", `updated project`, { project_id: id });
}

export async function updateProjectStatus(id: string, status: ProjectStatus): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) throw error;
  await addActivity(id, `moved project to ${status.replace(/_/g, " ")}`);
  void logActivity("Projects", `changed status to ${status}`, { project_id: id, status });

  const { data: p } = await supabase
    .from("projects")
    .select("project_name, assigned_to, project_manager")
    .eq("id", id)
    .single();
  if (p) {
    const recipients = [...(p.assigned_to ?? []), p.project_manager ?? ""].filter(
      (u) => u && u !== userData.user?.id,
    );
    void notifyUsers(recipients, {
      type: "project_update",
      title: `"${p.project_name}" is now ${status.replace(/_/g, " ")}`,
      link: `/projects/${id}`,
    });
  }
}

export async function updateProjectProgress(id: string, progress: number): Promise<void> {
  const { error } = await supabase.from("projects").update({ progress }).eq("id", id);
  if (error) throw error;
  await addActivity(id, `updated progress to ${progress}%`);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
  void logActivity("Projects", `deleted project`, { project_id: id });
}

export async function addActivity(projectId: string, activity: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  await supabase.from("project_activity").insert({
    project_id: projectId,
    user_id: userData.user?.id ?? null,
    activity,
  });
}
