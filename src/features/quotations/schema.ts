import { z } from "zod";
import { invoiceItemSchema, emptyItem } from "@/features/invoices/schema";

export { emptyItem };

export const quotationFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  project_name: z.string().optional(),
  quotation_date: z.string().min(1, "Required"),
  valid_until: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
  tax_percentage: z.coerce.number().min(0).max(100),
  discount: z.coerce.number().min(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
});

export type QuotationFormValues = z.infer<typeof quotationFormSchema>;

export const defaultQuotationValues: QuotationFormValues = {
  client_name: "",
  client_email: "",
  client_phone: "",
  project_name: "",
  quotation_date: new Date().toISOString().slice(0, 10),
  valid_until: "",
  status: "draft",
  tax_percentage: 0,
  discount: 0,
  notes: "",
  items: [{ ...emptyItem }],
};
