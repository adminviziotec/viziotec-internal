import { z } from "zod";

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  service_name: z.string().min(1, "Required"),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, "≥ 0"),
  unit_price: z.coerce.number().min(0, "≥ 0"),
});

export const invoiceFormSchema = z.object({
  client_name: z.string().min(1, "Client name is required"),
  client_email: z.string().email("Invalid email").optional().or(z.literal("")),
  client_phone: z.string().optional(),
  project_name: z.string().optional(),
  invoice_date: z.string().min(1, "Required"),
  due_date: z.string().optional().or(z.literal("")),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]),
  tax_percentage: z.coerce.number().min(0).max(100),
  discount: z.coerce.number().min(0),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one item"),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

export const emptyItem: InvoiceItemFormValues = {
  service_name: "",
  description: "",
  quantity: 1,
  unit_price: 0,
};

export const defaultInvoiceValues: InvoiceFormValues = {
  client_name: "",
  client_email: "",
  client_phone: "",
  project_name: "",
  invoice_date: new Date().toISOString().slice(0, 10),
  due_date: "",
  status: "draft",
  tax_percentage: 0,
  discount: 0,
  notes: "",
  items: [{ ...emptyItem }],
};
