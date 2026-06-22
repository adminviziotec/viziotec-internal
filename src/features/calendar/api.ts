import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/activity";
import { notifyUsers } from "@/features/notifications/api";
import type { EventFormValues } from "./schema";
import type { CalendarItem } from "./types";
import type { CalendarEvent, Project } from "@/types/database";

function eventToItem(e: CalendarEvent): CalendarItem {
  return {
    id: e.id,
    title: e.title,
    type: e.event_type,
    start: new Date(e.start_datetime),
    end: e.end_datetime ? new Date(e.end_datetime) : null,
    allDay: e.all_day,
    isDeadline: false,
    event: e,
  };
}

function deadlineToItem(p: Project): CalendarItem {
  return {
    id: `deadline-${p.id}`,
    title: `Deadline: ${p.project_name}`,
    type: "project_deadline",
    start: new Date(`${p.deadline}T00:00:00`),
    end: null,
    allDay: true,
    isDeadline: true,
    projectId: p.id,
  };
}

/** Real events + derived project deadlines that fall within [from, to]. */
export async function listCalendarItems(from: Date, to: Date): Promise<CalendarItem[]> {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const fromDate = from.toISOString().slice(0, 10);
  const toDate = to.toISOString().slice(0, 10);

  const [eventsRes, projectsRes] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*")
      .gte("start_datetime", fromIso)
      .lte("start_datetime", toIso)
      .order("start_datetime"),
    supabase
      .from("projects")
      .select("*")
      .not("deadline", "is", null)
      .gte("deadline", fromDate)
      .lte("deadline", toDate)
      .not("status", "in", "(finished,cancelled)"),
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (projectsRes.error) throw projectsRes.error;

  const events = (eventsRes.data ?? []).map((e) => eventToItem(e as CalendarEvent));
  const deadlines = (projectsRes.data ?? []).map((p) => deadlineToItem(p as Project));
  return [...events, ...deadlines];
}

function toColumns(values: EventFormValues) {
  const start = new Date(values.start_datetime);
  const end = values.end_datetime ? new Date(values.end_datetime) : null;
  return {
    title: values.title,
    description: values.description || null,
    event_type: values.event_type,
    all_day: values.all_day,
    start_datetime: start.toISOString(),
    end_datetime: end ? end.toISOString() : null,
    reminder: values.reminder ?? null,
    assigned_to: values.assigned_to ?? [],
  };
}

export async function createEvent(values: EventFormValues): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("calendar_events")
    .insert({ ...toColumns(values), created_by: userData.user?.id ?? null });
  if (error) throw error;
  void logActivity("Calendar", `scheduled "${values.title}"`, {});

  const recipients = (values.assigned_to ?? []).filter((id) => id !== userData.user?.id);
  void notifyUsers(recipients, {
    type: "agenda_reminder",
    title: `Invited: ${values.title}`,
    body: "You've been added to an event.",
    link: "/calendar",
  });
}

export async function updateEvent(id: string, values: EventFormValues): Promise<void> {
  const { error } = await supabase.from("calendar_events").update(toColumns(values)).eq("id", id);
  if (error) throw error;
  void logActivity("Calendar", `updated event "${values.title}"`, { id });
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw error;
  void logActivity("Calendar", `deleted an event`, { id });
}
