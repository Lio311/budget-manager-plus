'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createHash } from 'crypto'

export interface InvoiceLineItemData {
    id?: string
    description: string
    quantity: number
    price: number
    total: number
}

export interface InvoiceFormData {
    clientId?: string
    guestClientName?: string
    isGuestClient?: boolean
    incomeId?: string // Optional: Link to specific income
    invoiceType: string // NEW
    invoiceNumber: string
    issueDate: Date
    dueDate?: Date
    subtotal: number
    vatRate?: number
    vatAmount?: number
    total?: number
    paymentMethod?: string
    notes?: string
    createIncomeFromInvoice?: boolean
    lineItems: InvoiceLineItemData[]
}

const InvoiceSchema = z.object({
    clientId: z.string().optional(),
    guestClientName: z.string().optional(),
    isGuestClient: z.boolean().optional(),
    incomeId: z.string().optional(),
    invoiceType: z.string().default('INVOICE'),
    invoiceNumber: z.string().min(1, 'חובה להזין מספר חשבונית'),
    issueDate: z.date(),
    dueDate: z.date().optional().nullable(),
    subtotal: z.number().min(0, 'סכום לא יכול להיות שלילי'),
    vatRate: z.number().min(0).max(1).optional().default(0.18),
    paymentMethod: z.string().optional().nullable(),
    notes: z.string().max(1000, 'הערות ארוכות מדי').optional().nullable(),
    createIncomeFromInvoice: z.boolean().optional(), // New Flag
    lineItems: z.array(z.object({
        description: z.string().min(1, 'תיאור פריט חובה'),
        quantity: z.number().min(0.01, 'כמות חייבת להיות חיובית'),
        price: z.number().min(0, 'מחיר חייב להיות חיובי'),
        total: z.number()
    })).min(1, 'חובה להוסיף לפחות שורה אחת')
}).refine((data) => data.isGuestClient ? !!data.guestClientName : !!data.clientId, {
    message: 'חובה לבחור לקוח או להזין שם לקוח אורח',
    path: ['clientId']
})

export async function getInvoices(scope: string = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const invoices = await db.invoice.findMany({
            where: {
                userId,
                scope
            },
            include: {
                client: true
            },
            orderBy: {
                issueDate: 'desc'
            }
        })

        return { success: true, data: invoices }
    } catch (error) {
        console.error('getInvoices error:', error)
        return { success: false, error: 'Failed to fetch invoices' }
    }
}

export async function getInvoice(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const invoice = await db.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                incomes: true,
                lineItems: true
            }
        })

        if (!invoice || invoice.userId !== userId) {
            throw new Error('Invoice not found')
        }

        return { success: true, data: invoice }
    } catch (error) {
        console.error('getInvoice error:', error)
        return { success: false, error: 'Failed to fetch invoice' }
    }
}

import { getCurrentBudget } from './budget' // Import this
import { convertToILS } from '@/lib/currency' // Might need this if we do currency conversion, but for now assuming ILS or same currency
// Actually, invoice usually implies ILS in this system context, or we take currency from input?
// The invoice has no currency field in standard form yet? 
// Checking Schema... Invoice model usually has currency or assumes base. 
// Looking at Income creation: requires amount, currency.
// Invoice model seems to rely on base currency. Let's assume '₪'.

export async function createInvoice(data: InvoiceFormData, scope: string = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Validate Input
        const result = InvoiceSchema.safeParse(data)
        if (!result.success) {
            return { success: false, error: result.error.errors[0]?.message || 'נתונים לא תקינים' }
        }
        const validData = result.data

        const vatRate = validData.vatRate ?? 0.18
        const vatAmount = validData.subtotal * vatRate
        const total = validData.subtotal + vatAmount

        const invoice = await db.invoice.create({
            data: {
                userId,
                clientId: validData.isGuestClient ? null : validData.clientId,
                guestClientName: validData.isGuestClient ? (validData.guestClientName || null) : null,
                scope,
                invoiceType: validData.invoiceType,
                invoiceNumber: validData.invoiceNumber,
                issueDate: validData.issueDate,
                dueDate: validData.dueDate || null,
                subtotal: validData.subtotal,
                vatRate,
                vatAmount,
                total,

                notes: validData.notes || null,
                paymentMethod: validData.paymentMethod || null,
                status: 'DRAFT'
            },
            include: {
                client: true,
                lineItems: true
            }
        })

        // Create Line Items
        if (validData.lineItems && validData.lineItems.length > 0) {
            await db.invoiceLineItem.createMany({
                data: validData.lineItems.map(item => ({
                    invoiceId: invoice.id,
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                }))
            })
        }

        // Logic 1: Link Existing Income if provided
        if (validData.incomeId && validData.incomeId !== 'none') {
            await db.income.update({
                where: { id: validData.incomeId },
                data: { invoiceId: invoice.id }
            })
        }
        // Logic 2: Create New Income from Invoice if requested
        else if (validData.createIncomeFromInvoice) {
            const invoiceDate = validData.issueDate
            const budget = await getCurrentBudget(
                invoiceDate.getMonth() + 1,
                invoiceDate.getFullYear(),
                '₪',
                'BUSINESS'
            )

            // Description: "Invoice #1001: Web Design..."
            const mainDescription = validData.lineItems[0]?.description || 'שירות'
            const incomeSource = `חשבונית ${validData.invoiceNumber}: ${mainDescription}`

            await db.income.create({
                data: {
                    budgetId: budget.id,
                    source: incomeSource,
                    category: 'הכנסות מעסק', // Default category
                    amount: total, // Income is usually Gross
                    currency: '₪',
                    date: invoiceDate,

                    // Business fields
                    clientId: validData.isGuestClient ? null : validData.clientId,
                    invoiceId: invoice.id,
                    amountBeforeVat: validData.subtotal,
                    vatRate: vatRate,
                    vatAmount: vatAmount,
                    invoiceDate: invoiceDate,
                    paymentMethod: validData.paymentMethod,
                    isRecurring: false
                }
            })
        }

        revalidatePath('/dashboard')
        return { success: true, data: invoice }
    } catch (error: any) {
        console.error('createInvoice error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'חשבונית עם מספר זה כבר קיימת' }
        }
        return { success: false, error: 'Failed to create invoice' }
    }
}

export async function generateInvoiceLink(invoiceId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
        if (!invoice || invoice.userId !== userId) throw new Error('Invoice not found')

        if (invoice.token) {
            return { success: true, token: invoice.token }
        }

        const token = crypto.randomUUID()
        await db.invoice.update({
            where: { id: invoiceId },
            data: { token }
        })

        return { success: true, token }
    } catch (error) {
        console.error('generateInvoiceLink error:', error)
        return { success: false, error: 'Failed to generate link' }
    }
}

export async function getInvoiceByToken(token: string) {
    try {
        // No auth check needed for public access, but we verify token existence
        // We use the global prisma instance for public read access if needed, 
        // or we need to bypass row-level security or use a system context.
        // Since `authenticatedPrisma` requires a userId, we'll use the raw `prisma` client for this public/token lookup.

        const invoice = await prisma.invoice.findUnique({
            where: { token },
            include: {
                client: true,
                lineItems: true,
                user: {
                    include: {
                        businessProfile: true
                    }
                }
            }
        })

        if (!invoice) {
            return { success: false, error: 'Invoice not found or expired' }
        }

        return { success: true, data: invoice }
    } catch (error) {
        console.error('getInvoiceByToken error:', error)
        return { success: false, error: 'Failed to fetch invoice' }
    }
}



export async function signInvoice(token: string, signatureBase64: string) {
    try {
        // Validation: Verify invoice exists first
        const invoice = await prisma.invoice.findUnique({
            where: { token },
            include: { client: true, lineItems: true } // Include data for hash
        })
        if (!invoice) throw new Error('Invoice not found')

        // Generate Hash
        const hashData = JSON.stringify({
            invoiceNumber: invoice.invoiceNumber,
            date: invoice.issueDate.toISOString(),
            total: invoice.total,
            clientId: invoice.clientId,
            items: invoice.lineItems.map(item => ({
                desc: item.description,
                total: item.total
            }))
        })

        const documentHash = createHash('sha256').update(hashData).digest('hex')

        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                signature: signatureBase64,
                documentHash,
                signedAt: new Date(),
                isSigned: true,
                status: 'SIGNED'
            }
        })

        // Revalidate dashboard paths so the business owner sees the update
        revalidatePath('/dashboard')
        revalidatePath('/dashboard/invoices')

        return { success: true }
    } catch (error) {
        console.error('signInvoice error:', error)
        return { success: false, error: 'Failed to sign invoice' }
    }
}

export async function updateInvoice(id: string, data: Partial<InvoiceFormData>) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.invoice.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Invoice not found')
        }

        const updateData: any = {}

        if (data.invoiceNumber) updateData.invoiceNumber = data.invoiceNumber
        if (data.issueDate) updateData.issueDate = data.issueDate
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate

        if (data.notes !== undefined) updateData.notes = data.notes
        if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod

        if (data.subtotal !== undefined) {
            const vatRate = data.vatRate ?? existing.vatRate
            const vatAmount = data.subtotal * vatRate
            const total = data.subtotal + vatAmount

            updateData.subtotal = data.subtotal
            updateData.vatRate = vatRate
            updateData.vatAmount = vatAmount
            updateData.total = total
        }

        const invoice = await db.invoice.update({
            where: { id },
            data: updateData,
            include: {
                client: true
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: invoice }
    } catch (error: any) {
        console.error('updateInvoice error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'חשבונית עם מספר זה כבר קיימת' }
        }
        return { success: false, error: 'Failed to update invoice' }
    }
}

export async function updateInvoiceStatus(id: string, status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED', paidDate?: Date, paidAmount?: number) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.invoice.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Invoice not found')
        }

        const invoice = await db.invoice.update({
            where: { id },
            data: {
                status,
                paidDate: status === 'PAID' ? (paidDate || new Date()) : null,
                paidAmount: status === 'PAID' ? (paidAmount || existing.total) : null
            },
            include: {
                client: true
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: invoice }
    } catch (error) {
        console.error('updateInvoiceStatus error:', error)
        return { success: false, error: 'Failed to update invoice status' }
    }
}

export async function deleteInvoice(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.invoice.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Invoice not found')
        }

        // Check if invoice has associated incomes
        const hasIncomes = await db.income.count({ where: { invoiceId: id } })

        if (hasIncomes > 0) {
            return {
                success: false,
                error: 'לא ניתן למחוק חשבונית עם הכנסות משויכות. אפשר לבטל את החשבונית במקום.'
            }
        }

        await db.invoice.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteInvoice error:', error)
        return { success: false, error: 'Failed to delete invoice' }
    }
}

export async function getNextInvoiceNumber() {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const lastInvoice = await db.invoice.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { invoiceNumber: true }
        })

        if (!lastInvoice) {
            return { success: true, data: '1001' }
        }

        // Try to extract number from invoice number
        const match = lastInvoice.invoiceNumber.match(/\d+/)
        if (match) {
            const nextNumber = (parseInt(match[0]) + 1).toString()
            return { success: true, data: nextNumber }
        }

        return { success: true, data: '1001' }
    } catch (error) {
        console.error('getNextInvoiceNumber error:', error)
        return { success: false, error: 'Failed to get next invoice number' }
    }
}
