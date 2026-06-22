import { z } from "zod";

export const projectFormSchema = z.object({
  project_name: z.string().min(1, "Project name is required"),
  client_name: z.string().optional(),
  description: z.string().optional(),
  service_type: z.enum([
    "website_design",
    "application_development",
    "branding",
    "digital_marketing",
    "seo",
    "social_media_management",
    "advertising",
    "other",
  ]),
  project_manager: z.string().optional(), // "" => none
  assigned_to: z.array(z.string()).default([]),
  status: z.enum([
    "lead",
    "proposal_sent",
    "negotiation",
    "ongoing",
    "existing",
    "finished",
    "cancelled",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  progress: z.coerce.number().min(0).max(100),
  start_date: z.string().optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).optional(),
  notes: z.string().optional(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const defaultProjectValues: ProjectFormValues = {
  project_name: "",
  client_name: "",
  description: "",
  service_type: "website_design",
  project_manager: "",
  assigned_to: [],
  status: "lead",
  priority: "medium",
  progress: 0,
  start_date: "",
  deadline: "",
  budget: undefined,
  notes: "",
};
