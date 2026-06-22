import type { CalendarEvent, EventType } from "@/types/database";

/** A unified calendar item — either a real event or a derived project deadline. */
export interface CalendarItem {
  id: string;
  title: string;
  type: EventType;
  start: Date;
  end: Date | null;
  allDay: boolean;
  /** True for read-only items derived from a project's deadline. */
  isDeadline: boolean;
  projectId?: string;
  event?: CalendarEvent;
}

/** Convert a Date to the value expected by an <input type="datetime-local">. */
export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function toDateInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
