import { cn, relativeTime } from "@/lib/utils";
import { NOTIF_META } from "./meta";
import type { AppNotification } from "@/types/database";

export function NotificationItem({
  notification,
  onClick,
}: {
  notification: AppNotification;
  onClick: (n: AppNotification) => void;
}) {
  const meta = NOTIF_META[notification.type];
  const Icon = meta.icon;
  return (
    <button
      onClick={() => onClick(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-muted/60",
        !notification.is_read && "bg-primary/[0.04]",
      )}
    >
      <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.tone)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm", !notification.is_read && "font-semibold")}>
          {notification.title}
        </p>
        {notification.body && (
          <p className="truncate text-xs text-muted-foreground">{notification.body}</p>
        )}
        <p className="mt-0.5 text-[11px] text-muted-foreground">{relativeTime(notification.created_at)}</p>
      </div>
      {!notification.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
    </button>
  );
}
