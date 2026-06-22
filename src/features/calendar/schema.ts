import { z } from "zod";

export const eventFormSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    event_type: z.enum(["meeting", "project_deadline", "internal_agenda", "personal_reminder"]),
    all_day: z.boolean(),
    start_datetime: z.string().min(1, "Start is required"),
    end_datetime: z.string().optional().or(z.literal("")),
    reminder: z.coerce.number().nullable().optional(),
    assigned_to: z.array(z.string()).default([]),
  })
  .refine(
    (v) => !v.end_datetime || new Date(v.end_datetime) >= new Date(v.start_datetime),
    { message: "End must be after start", path: ["end_datetime"] },
  );

export type EventFormValues = z.infer<typeof eventFormSchema>;
