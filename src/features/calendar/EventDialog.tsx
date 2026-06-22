import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserMultiSelect } from "@/components/UserMultiSelect";
import { toast } from "@/components/ui/toast";
import { createEvent, deleteEvent, updateEvent } from "./api";
import { eventFormSchema, type EventFormValues } from "./schema";
import { toDateInput, toLocalInput } from "./types";
import { EVENT_TYPE_LABELS, REMINDER_OPTIONS } from "@/lib/constants";
import type { CalendarEvent, EventType } from "@/types/database";

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: CalendarEvent | null;
  initialDate?: Date | null;
  canDelete?: boolean;
}

const NO_REMINDER = "none";

export function EventDialog({ open, onOpenChange, event, initialDate, canDelete }: EventDialogProps) {
  const isEdit = Boolean(event);
  const queryClient = useQueryClient();

  const { register, handleSubmit, control, reset, watch, setValue, formState } =
    useForm<EventFormValues>({
      resolver: zodResolver(eventFormSchema),
    });

  const allDay = watch("all_day");
  const startVal = watch("start_datetime");
  const endVal = watch("end_datetime");

  useEffect(() => {
    if (!open) return;
    if (event) {
      const start = new Date(event.start_datetime);
      reset({
        title: event.title,
        description: event.description ?? "",
        event_type: event.event_type,
        all_day: event.all_day,
        start_datetime: event.all_day ? toDateInput(start) : toLocalInput(start),
        end_datetime: event.end_datetime
          ? event.all_day
            ? toDateInput(new Date(event.end_datetime))
            : toLocalInput(new Date(event.end_datetime))
          : "",
        reminder: event.reminder ?? null,
        assigned_to: event.assigned_to ?? [],
      });
    } else {
      const base = initialDate ?? new Date();
      const start = new Date(base);
      if (!initialDate) start.setHours(start.getHours() + 1, 0, 0, 0);
      reset({
        title: "",
        description: "",
        event_type: "meeting",
        all_day: false,
        start_datetime: toLocalInput(start),
        end_datetime: "",
        reminder: null,
        assigned_to: [],
      });
    }
  }, [open, event, initialDate, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: EventFormValues) =>
      isEdit ? updateEvent(event!.id, values) : createEvent(values),
    onSuccess: () => {
      toast.success(isEdit ? "Event updated" : "Event created");
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error("Could not save event", e instanceof Error ? e.message : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(event!.id),
    onSuccess: () => {
      toast.success("Event deleted");
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error("Could not delete", e instanceof Error ? e.message : undefined),
  });

  // When toggling all-day, convert the bound values between date and datetime.
  function toggleAllDay(next: boolean) {
    setValue("all_day", next);
    if (startVal) {
      const d = new Date(startVal);
      setValue("start_datetime", next ? toDateInput(d) : toLocalInput(d));
    }
    if (endVal) {
      const d = new Date(endVal);
      setValue("end_datetime", next ? toDateInput(d) : toLocalInput(d));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "New event"}</DialogTitle>
          <DialogDescription>Schedule a meeting, agenda or personal reminder.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input {...register("title")} placeholder="e.g. Client kickoff meeting" />
            {formState.errors.title && <p className="text-xs text-destructive">{formState.errors.title.message}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Controller
                control={control}
                name="event_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(EVENT_TYPE_LABELS) as EventType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {EVENT_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reminder</Label>
              <Controller
                control={control}
                name="reminder"
                render={({ field }) => (
                  <Select
                    value={field.value == null ? NO_REMINDER : String(field.value)}
                    onValueChange={(v) => field.onChange(v === NO_REMINDER ? null : Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_REMINDER}>No reminder</SelectItem>
                      {REMINDER_OPTIONS.map((r) => (
                        <SelectItem key={r.value} value={String(r.value)}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              checked={allDay ?? false}
              onChange={(e) => toggleAllDay(e.target.checked)}
            />
            All day
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type={allDay ? "date" : "datetime-local"} {...register("start_datetime")} />
              {formState.errors.start_datetime && (
                <p className="text-xs text-destructive">{formState.errors.start_datetime.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>End <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Input type={allDay ? "date" : "datetime-local"} {...register("end_datetime")} />
              {formState.errors.end_datetime && (
                <p className="text-xs text-destructive">{formState.errors.end_datetime.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Invite members</Label>
            <Controller
              control={control}
              name="assigned_to"
              render={({ field }) => <UserMultiSelect value={field.value} onChange={field.onChange} />}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea {...register("description")} rows={2} />
          </div>

          <DialogFooter className="sm:justify-between">
            {isEdit && canDelete ? (
              <Button
                type="button"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm("Delete this event?")) deleteMutation.mutate();
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEdit ? "Save" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
