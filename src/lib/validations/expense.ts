import { z } from "zod"

const flexibleDate = z.union([
    z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
    z.date()
])

export const expenseSchema = z.object({
    category: z.string().min(1, "Category is required"),
    description: z.string().min(1, "Description is required"),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    currency: z.enum(["ILS", "USD", "EUR", "GBP"]), // Add other currencies if needed
    date: flexibleDate,
    isRecurring: z.boolean().optional(),
    recurringStartDate: flexibleDate.optional(),
    recurringEndDate: flexibleDate.optional().nullable(),
    // Business Fields
    supplierId: z.string().optional().nullable(),
    clientId: z.string().optional().nullable(),
    projectId: z.string().optional().nullable(),
    projectStageId: z.string().optional().nullable(),
    amountBeforeVat: z.number().optional(),
    vatRate: z.number().optional(),
    vatAmount: z.number().optional(),
    vatType: z.any().optional(),
    isDeductible: z.boolean().optional(),
    deductibleRate: z.number().optional(),
    expenseType: z.any().optional(),
    invoiceDate: flexibleDate.optional().nullable(),
    paymentDate: flexibleDate.optional().nullable(),
    paymentMethod: z.any().optional(),
    paymentTerms: z.number().optional(),
    responsibles: z.array(z.string()).optional(),
    paidBy: z.string().optional().nullable(),
    attachmentUrl: z.string().optional().nullable(),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>
