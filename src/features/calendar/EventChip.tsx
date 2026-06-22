import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EVENT_TYPE_TONES } from "@/lib/constants";
import type { CalendarItem } from "./types";

export function EventChip({
  item,
  onClick,
  showTime = true,
}: {
  item: CalendarItem;
  onClick?: () => void;
  showTime?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium",
        EVENT_TYPE_TONES[item.type],
      )}
      title={item.title}
    >
      {showTime && !item.allDay && <span className="opacity-90">{format(item.start, "HH:mm")}</span>}
      <span className="truncate">{item.title}</span>
    </button>
  );
}
