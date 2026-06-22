import { format, isSameDay } from "date-fns";
import { CalendarPlus, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_LABELS, EVENT_TYPE_TONES } from "@/lib/constants";
import type { CalendarItem } from "./types";

export function DayView({
  date,
  items,
  onSelectItem,
  onAdd,
}: {
  date: Date;
  items: CalendarItem[];
  onSelectItem: (item: CalendarItem) => void;
  onAdd: (date: Date) => void;
}) {
  const dayItems = items
    .filter((it) => isSameDay(it.start, date))
    .sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.start.getTime() - b.start.getTime());

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold">{format(date, "EEEE")}</p>
          <p className="text-sm text-muted-foreground">{format(date, "d MMMM yyyy")}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => onAdd(date)}>
          <CalendarPlus className="h-4 w-4" /> Add
        </Button>
      </div>

      {dayItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Clock className="h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nothing scheduled for this day.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {dayItems.map((it) => (
            <button
              key={it.id}
              onClick={() => onSelectItem(it)}
              className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className={cn("h-10 w-1 rounded-full", EVENT_TYPE_TONES[it.type])} />
              <div className="w-20 shrink-0 text-sm">
                {it.allDay ? (
                  <span className="text-muted-foreground">All day</span>
                ) : (
                  <span className="font-medium">{format(it.start, "HH:mm")}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{it.title}</p>
                <p className="text-xs text-muted-foreground">{EVENT_TYPE_LABELS[it.type]}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
