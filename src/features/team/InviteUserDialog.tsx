import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteUser } from "./api";
import { toast } from "@/components/ui/toast";
import { ROLE_LABELS } from "@/lib/constants";
import { useAuth } from "@/features/auth/useAuth";
import type { UserRole } from "@/types/database";

const schema = z.object({
  full_name: z.string().min(2, "Enter a name"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["owner", "co_owner", "team_member"]),
  position: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  const { isOwner } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "team_member" },
  });

  const mutation = useMutation({
    mutationFn: inviteUser,
    onSuccess: (_d, vars) => {
      toast.success("Invitation sent", `${vars.email} will receive an email to set their password.`);
      queryClient.invalidateQueries({ queryKey: ["team", "users"] });
      reset({ role: "team_member" });
      setOpen(false);
    },
    onError: (err) => toast.error("Could not send invite", err instanceof Error ? err.message : undefined),
  });

  // Co-owners may not create owners.
  const roleOptions: UserRole[] = isOwner
    ? ["team_member", "co_owner", "owner"]
    : ["team_member", "co_owner"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" /> Invite user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>
            They'll receive an email invitation to set their password and join VIMS.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" placeholder="Jane Doe" {...register("full_name")} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="jane@viziotec.com" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={watch("role")} onValueChange={(v) => setValue("role", v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Position</Label>
              <Input id="position" placeholder="Designer" {...register("position")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
