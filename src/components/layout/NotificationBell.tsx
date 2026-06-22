import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { getUnreadCount, listNotifications, markAllRead, markRead } from "@/features/notifications/api";
import type { AppNotification } from "@/types/database";

export function NotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const unread = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
  });

  const list = useQuery({
    queryKey: ["notifications", "recent"],
    queryFn: () => listNotifications(8),
    enabled: open,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markAll = useMutation({ mutationFn: markAllRead, onSuccess: invalidate });

  async function handleClick(n: AppNotification) {
    if (!n.is_read) {
      await markRead(n.id).catch(() => {});
      invalidate();
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  const count = unread.data ?? 0;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {count > 0 && (
            <button
              onClick={() => markAll.mutate()}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto p-1">
          {list.isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : (list.data ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">You're all caught up 🎉</p>
          ) : (
            list.data!.map((n) => <NotificationItem key={n.id} notification={n} onClick={handleClick} />)
          )}
        </div>
        <div className="border-t p-1">
          <button
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            className="w-full rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-muted/60"
          >
            See all notifications
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
