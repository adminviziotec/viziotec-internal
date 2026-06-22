import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { EventChip } from "./EventChip";
import { cn } from "@/lib/utils";
import type { CalendarItem } from "./types";

const WEEK_OPTS = { weekStartsOn: 1 as const };
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function MonthView({
  month,
  items,
  onSelectDate,
  onSelectItem,
}: {
  month: Date;
  items: CalendarItem[];
  onSelectDate: (date: Date) => void;
  onSelectItem: (item: CalendarItem) => void;
}) {
  const gridStart = startOfWeek(startOfMonth(month), WEEK_OPTS);
  const gridEnd = endOfWeek(endOfMonth(month), WEEK_OPTS);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = items
            .filter((it) => isSameDay(it.start, day))
            .sort((a, b) => a.start.getTime() - b.start.getTime());
          const inMonth = isSameMonth(day, month);
          return (
            <div
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={cn(
                "min-h-[104px] cursor-pointer border-b border-r p-1.5 transition-colors hover:bg-muted/40 [&:nth-child(7n)]:border-r-0",
                !inMonth && "bg-muted/30 text-muted-foreground",
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    isToday(day) && "bg-primary font-semibold text-primary-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((it) => (
                  <EventChip key={it.id} item={it} onClick={() => onSelectItem(it)} />
                ))}
                {dayItems.length > 3 && (
                  <p className="px-1 text-[11px] text-muted-foreground">+{dayItems.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
