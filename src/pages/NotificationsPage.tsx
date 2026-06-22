import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationItem } from "@/features/notifications/NotificationItem";
import { listNotifications, markAllRead, markRead } from "@/features/notifications/api";
import type { AppNotification } from "@/types/database";

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ["notifications", "all"], queryFn: () => listNotifications(100) });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["notifications"] });
  const markAll = useMutation({ mutationFn: markAllRead, onSuccess: invalidate });

  async function handleClick(n: AppNotification) {
    if (!n.is_read) {
      await markRead(n.id).catch(() => {});
      invalidate();
    }
    if (n.link) navigate(n.link);
  }

  const notifications = query.data ?? [];
  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <div>
      <PageHeader title="Notifications" description="Invoice, project and agenda alerts.">
        {hasUnread && (
          <Button variant="outline" onClick={() => markAll.mutate()}>
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </PageHeader>

      <Card className="p-2">
        {query.isLoading ? (
          <div className="space-y-2 p-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              You'll be notified about assignments, deadlines and agenda items here.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => (
              <NotificationItem key={n.id} notification={n} onClick={handleClick} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
