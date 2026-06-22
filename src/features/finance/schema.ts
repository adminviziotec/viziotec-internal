import { z } from "zod";

export const transactionFormSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Select a category"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  transaction_date: z.string().min(1, "Date is required"),
  project_id: z.string().optional(), // "" => none
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export function defaultTransactionValues(type: "income" | "expense"): TransactionFormValues {
  return {
    type,
    category: "",
    title: "",
    description: "",
    amount: 0,
    transaction_date: new Date().toISOString().slice(0, 10),
    project_id: "",
  };
}
