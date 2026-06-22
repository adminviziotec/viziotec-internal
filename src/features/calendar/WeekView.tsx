import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { EventChip } from "./EventChip";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "./types";

const WEEK_OPTS = { weekStartsOn: 1 as const };

export function WeekView({
  date,
  items,
  onSelectDate,
  onSelectItem,
}: {
  date: Date;
  items: CalendarItem[];
  onSelectDate: (date: Date) => void;
  onSelectItem: (item: CalendarItem) => void;
}) {
  const start = startOfWeek(date, WEEK_OPTS);
  const days = eachDayOfInterval({ start, end: endOfWeek(date, WEEK_OPTS) });

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-7">
      {days.map((day) => {
        const dayItems = items
          .filter((it) => isSameDay(it.start, day))
          .sort((a, b) => a.start.getTime() - b.start.getTime());
        return (
          <div key={day.toISOString()} className="flex flex-col rounded-xl border bg-card">
            <button
              onClick={() => onSelectDate(day)}
              className="border-b px-2 py-2 text-center transition-colors hover:bg-muted/40"
            >
              <p className="text-[11px] uppercase text-muted-foreground">{format(day, "EEE")}</p>
              <p
                className={cn(
                  "mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  isToday(day) && "bg-primary text-primary-foreground",
                )}
              >
                {format(day, "d")}
              </p>
            </button>
            <div className="flex-1 space-y-1 p-1.5">
              {dayItems.length === 0 ? (
                <button
                  onClick={() => onSelectDate(day)}
                  className="h-full min-h-[60px] w-full rounded text-[11px] text-muted-foreground/50 hover:bg-muted/40"
                >
                  +
                </button>
              ) : (
                dayItems.map((it) => <EventChip key={it.id} item={it} onClick={() => onSelectItem(it)} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
