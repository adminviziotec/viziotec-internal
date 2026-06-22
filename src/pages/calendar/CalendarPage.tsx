import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthView } from "@/features/calendar/MonthView";
import { WeekView } from "@/features/calendar/WeekView";
import { DayView } from "@/features/calendar/DayView";
import { EventDialog } from "@/features/calendar/EventDialog";
import { listCalendarItems } from "@/features/calendar/api";
import type { CalendarItem } from "@/features/calendar/types";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "@/components/ui/toast";
import { EVENT_TYPE_LABELS, EVENT_TYPE_TONES } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/utils";
import type { CalendarEvent, EventType } from "@/types/database";

type View = "month" | "week" | "day";
const WEEK_OPTS = { weekStartsOn: 1 as const };

export function CalendarPage() {
  const navigate = useNavigate();
  const { userId, can } = useAuth();
  const isManager = can("owner", "co_owner");

  const [view, setView] = useState<View>("month");
  const [cursor, setCursor] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [initialDate, setInitialDate] = useState<Date | null>(null);

  const [from, to] = useMemo<[Date, Date]>(() => {
    if (view === "month")
      return [startOfWeek(startOfMonth(cursor), WEEK_OPTS), endOfWeek(endOfMonth(cursor), WEEK_OPTS)];
    if (view === "week") return [startOfWeek(cursor, WEEK_OPTS), endOfWeek(cursor, WEEK_OPTS)];
    return [startOfDay(cursor), endOfDay(cursor)];
  }, [view, cursor]);

  const query = useQuery({
    queryKey: ["calendar", view, from.toISOString()],
    queryFn: () => listCalendarItems(from, to),
  });
  const items = query.data ?? [];

  const title = useMemo(() => {
    if (view === "month") return format(cursor, "MMMM yyyy");
    if (view === "week")
      return `${format(startOfWeek(cursor, WEEK_OPTS), "d MMM")} – ${format(endOfWeek(cursor, WEEK_OPTS), "d MMM yyyy")}`;
    return format(cursor, "d MMMM yyyy");
  }, [view, cursor]);

  function shift(dir: 1 | -1) {
    setCursor((c) => (view === "month" ? addMonths(c, dir) : view === "week" ? addWeeks(c, dir) : addDays(c, dir)));
  }

  function openNew(date?: Date | null) {
    setEditingEvent(null);
    setInitialDate(date ?? null);
    setDialogOpen(true);
  }

  function selectDate(date: Date) {
    const d = new Date(date);
    d.setHours(9, 0, 0, 0);
    openNew(d);
  }

  function selectItem(item: CalendarItem) {
    if (item.isDeadline && item.projectId) {
      navigate(`/projects/${item.projectId}`);
      return;
    }
    const ev = item.event!;
    const editable = isManager || ev.created_by === userId;
    if (editable) {
      setEditingEvent(ev);
      setInitialDate(null);
      setDialogOpen(true);
    } else {
      toast.info(item.title, `${EVENT_TYPE_LABELS[item.type]} · ${formatDateTime(item.start)}`);
    }
  }

  return (
    <div>
      <PageHeader title="Calendar" description="Team agenda, meetings and project deadlines.">
        <Button onClick={() => openNew(null)}>
          <Plus className="h-4 w-4" /> New event
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-1 text-lg font-semibold">{title}</h2>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="day">Day</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3">
        {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
          <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("h-2.5 w-2.5 rounded-full", EVENT_TYPE_TONES[t])} />
            {EVENT_TYPE_LABELS[t]}
          </span>
        ))}
      </div>

      {query.isLoading ? (
        <Skeleton className="h-[560px] w-full" />
      ) : view === "month" ? (
        <MonthView month={cursor} items={items} onSelectDate={selectDate} onSelectItem={selectItem} />
      ) : view === "week" ? (
        <WeekView date={cursor} items={items} onSelectDate={selectDate} onSelectItem={selectItem} />
      ) : (
        <DayView date={cursor} items={items} onSelectItem={selectItem} onAdd={selectDate} />
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editingEvent}
        initialDate={initialDate}
        canDelete={editingEvent ? isManager || editingEvent.created_by === userId : false}
      />
    </div>
  );
}
