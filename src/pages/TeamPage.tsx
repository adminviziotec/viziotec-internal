import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, ShieldCheck, Trash2, UserCog, UserX, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteUserDialog } from "@/features/team/InviteUserDialog";
import { listUsers, updateUserRole, setUserActive, deleteUserProfile } from "@/features/team/api";
import { useAuth } from "@/features/auth/useAuth";
import { toast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { UserProfile, UserRole } from "@/types/database";

const ROLE_TONE: Record<UserRole, string> = {
  owner: "bg-primary/15 text-primary",
  co_owner: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  team_member: "bg-muted text-muted-foreground",
};

export function TeamPage() {
  const { profile: me, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const users = useQuery({ queryKey: ["team", "users"], queryFn: listUsers });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["team", "users"] });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, role),
    onSuccess: () => {
      toast.success("Role updated");
      invalidate();
    },
    onError: (e) => toast.error("Failed to update role", e instanceof Error ? e.message : undefined),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setUserActive(id, active),
    onSuccess: () => {
      toast.success("Status updated");
      invalidate();
    },
    onError: (e) => toast.error("Failed", e instanceof Error ? e.message : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUserProfile(id),
    onSuccess: () => {
      toast.success("User removed");
      invalidate();
    },
    onError: (e) => toast.error("Failed to remove", e instanceof Error ? e.message : undefined),
  });

  function canActOn(u: UserProfile) {
    if (u.id === me?.id) return false; // never act on yourself here
    if (u.role === "owner") return false; // owner account is protected
    return true;
  }

  return (
    <div>
      <PageHeader title="Team" description="Manage members, roles and access to VIMS.">
        <InviteUserDialog />
      </PageHeader>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {users.data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.full_name} image={u.profile_image} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {u.full_name || "—"}
                        {u.id === me?.id && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{u.position || "—"}</TableCell>
                <TableCell>
                  {u.is_active ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" /> Inactive
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(u.created_at)}</TableCell>
                <TableCell className="text-right">
                  {canActOn(u) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Change role</DropdownMenuLabel>
                        {(["team_member", "co_owner", ...(isOwner ? (["owner"] as const) : [])] as UserRole[])
                          .filter((r) => r !== u.role)
                          .map((r) => (
                            <DropdownMenuItem key={r} onClick={() => roleMutation.mutate({ id: u.id, role: r })}>
                              {r === "owner" ? <ShieldCheck className="h-4 w-4" /> : <UserCog className="h-4 w-4" />}
                              Make {ROLE_LABELS[r]}
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => activeMutation.mutate({ id: u.id, active: !u.is_active })}>
                          {u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          {u.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm(`Remove ${u.full_name || u.email}? This deletes their profile.`)) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {users.data && users.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No team members yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
