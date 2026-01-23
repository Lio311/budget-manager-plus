'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { addIncome } from './income'
import { addDays, addMonths, addYears, isSameDay, startOfDay } from 'date-fns'

// Helper function to parse dates safely without timezone issues
// Helper function to parse dates safely
const parseDate = (dateInput: string | Date | undefined): Date | null => {
    if (!dateInput) return null;

    // If already a Date object, use it directly (respecting the time set by frontend)
    if (dateInput instanceof Date) {
        return dateInput;
    }

    const dateStr = String(dateInput);

    // Try YYYY-MM-DD format first - default to Noon to be safe if no time provided
    const dashParts = dateStr.split('-');
    if (dashParts.length === 3 && dashParts[0].length === 4 && !dateStr.includes('T')) {
        return new Date(parseInt(dashParts[0]), parseInt(dashParts[1]) - 1, parseInt(dashParts[2]), 12, 0, 0, 0);
    }

    // Handle ISO string format - Create date object directly
    if (dateStr.includes('T') || dateStr.includes('Z')) {
        return new Date(dateStr);
    }

    // Fallback
    return new Date(dateStr);
};

const emptyToUndefined = (val: unknown) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return val;
};

const ClientSchema = z.object({
    name: z.string().min(2, 'שם הלקוח חייב להכיל לפחות 2 תווים').max(100, 'שם הלקוח ארוך מדי'),
    email: z.preprocess(emptyToUndefined, z.string().email('כתובת אימייל לא תקינה').max(100).optional()),
    phone: z.preprocess(emptyToUndefined, z.string().max(30).optional()),
    taxId: z.preprocess(emptyToUndefined, z.string().regex(/^\d*$/, 'ח.פ/ע.מ חייב להכיל ספרות בלבד').max(20).optional()),
    address: z.preprocess(emptyToUndefined, z.string().max(200, 'הכתובת ארוכה מדי').optional()),
    notes: z.preprocess(emptyToUndefined, z.string().max(500, 'הערות ארוכות מדי').optional()),
    isActive: z.boolean().optional(),

    // New Fields
    city: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
    bankName: z.preprocess(emptyToUndefined, z.string().max(100).optional()),
    bankBranch: z.preprocess(emptyToUndefined, z.string().max(20).optional()),
    bankAccount: z.preprocess(emptyToUndefined, z.string().max(50).optional()),

    // SaaS Fields
    subscriptionType: z.preprocess(emptyToUndefined, z.string().optional()),
    subscriptionStart: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    subscriptionEnd: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    subscriptionPrice: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
    subscriptionStatus: z.preprocess(emptyToUndefined, z.string().optional()),
    packageName: z.preprocess(emptyToUndefined, z.string().max(100, 'שם החבילה ארוך מדי').optional()),
    subscriptionColor: z.preprocess(emptyToUndefined, z.string().optional()),
    packageId: z.preprocess(emptyToUndefined, z.string().optional()),
    eventLocation: z.preprocess(emptyToUndefined, z.string().max(200, 'המיקום ארוך מדי').optional())
})

export interface ClientFormData {
    name: string
    email?: string
    phone?: string
    taxId?: string
    address?: string
    notes?: string
    isActive?: boolean

    city?: string
    bankName?: string
    bankBranch?: string
    bankAccount?: string

    subscriptionType?: string
    subscriptionStart?: Date | string
    subscriptionEnd?: Date
    subscriptionPrice?: number | string
    subscriptionStatus?: string
    packageName?: string
    subscriptionColor?: string
    packageId?: string
    eventLocation?: string
}

export async function getClients(scope: string = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const clients = await db.client.findMany({
            where: {
                userId,
                scope
            },
            include: {
                package: true,
                quotes: { select: { id: true } }, // Fetch quotes IDs to count them
                invoices: {
                    select: {
                        id: true,
                        creditNotes: { select: { id: true } } // Fetch credit notes via invoices
                    }
                },
                _count: {
                    select: {
                        incomes: {
                            where: { status: 'PAID' }
                        },
                        expenses: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })




        const clientIds = clients.map((c: any) => c.id)

        // Bulk aggregates for better performance
        const [incomeGroups, paidInvoiceGroups, allInvoiceGroups, expenseGroups] = await Promise.all([
            db.income.groupBy({
                by: ['clientId'],
                where: {
                    clientId: { in: clientIds },
                    status: 'PAID'
                },
                _sum: { amount: true, vatAmount: true }
            }),
            db.invoice.groupBy({
                by: ['clientId'],
                where: { clientId: { in: clientIds }, status: 'PAID' },
                _sum: { total: true, vatAmount: true }
            }),
            db.invoice.groupBy({
                by: ['clientId'],
                where: { clientId: { in: clientIds } },
                _count: { id: true }
            }),
            db.expense.groupBy({
                by: ['clientId'],
                where: { clientId: { in: clientIds } },
                _sum: { amount: true }
            })
        ])

        // Create lookup maps
        const incomeMap = new Map(incomeGroups.map((g: any) => [g.clientId, g._sum.amount || 0]))
        const incomeVatMap = new Map(incomeGroups.map((g: any) => [g.clientId, g._sum.vatAmount || 0]))

        const paidInvoiceMap = new Map(paidInvoiceGroups.map((g: any) => [g.clientId, g._sum.total || 0]))
        const paidInvoiceVatMap = new Map(paidInvoiceGroups.map((g: any) => [g.clientId, g._sum.vatAmount || 0]))

        const allInvoiceMap = new Map(allInvoiceGroups.map((g: any) => [g.clientId, g._count.id || 0]))
        const expenseMap = new Map(expenseGroups.map((g: any) => [g.clientId, g._sum.amount || 0]))

        const clientsWithStats = clients.map((client: any) => {
            const incomeTotal = incomeMap.get(client.id) || 0
            const incomeVat = incomeVatMap.get(client.id) || 0

            const paidInvoiceTotal = paidInvoiceMap.get(client.id) || 0
            const paidInvoiceVat = paidInvoiceVatMap.get(client.id) || 0

            const expenseTotal = expenseMap.get(client.id) || 0

            const totalRevenue = incomeTotal + paidInvoiceTotal
            const totalVat = incomeVat + paidInvoiceVat
            const netRevenue = totalRevenue - totalVat

            // Calculate document counts from the included data
            const quotesCount = client.quotes.length
            const invoicesCount = client.invoices.length
            const creditNotesCount = client.invoices.reduce((acc: number, inv: any) => acc + inv.creditNotes.length, 0)

            return {
                ...client,
                totalRevenue: totalRevenue,
                totalExpenses: expenseTotal,
                netProfit: netRevenue - expenseTotal,
                _count: {
                    ...client._count,
                    invoices: allInvoiceMap.get(client.id) || 0
                },
                quotesCount,
                invoicesCount,
                creditNotesCount
            }
        })


        return { success: true, data: clientsWithStats }
    } catch (error) {
        console.error('getClients error:', error)
        return { success: false, error: 'Failed to fetch clients' }
    }
}

export async function getClientsList() {
    try {
        const { userId } = await auth()
        if (!userId) return []

        const db = await authenticatedPrisma(userId)
        return await db.client.findMany({
            where: { userId, isActive: true },
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
    } catch (error) {
        return []
    }
}

export async function getClient(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const client = await db.client.findUnique({
            where: { id },
            include: {
                incomes: {
                    orderBy: { date: 'desc' },
                    take: 10
                },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    take: 10
                }
            }
        })

        if (!client || client.userId !== userId) {
            throw new Error('Client not found')
        }

        return { success: true, data: client }
    } catch (error) {
        console.error('getClient error:', error)
        return { success: false, error: 'Failed to fetch client' }
    }
}

export async function createClient(data: ClientFormData, scope: string = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Validate Input
        const result = ClientSchema.safeParse(data)
        if (!result.success) {
            return { success: false, error: result.error.errors[0]?.message || 'נתונים לא תקינים' }
        }
        const validData = result.data

        const client = await db.client.create({
            data: {
                userId,
                scope,
                name: validData.name,
                email: validData.email || null,
                phone: validData.phone || null,
                taxId: validData.taxId || null,
                address: validData.address || null,
                notes: validData.notes || null,
                isActive: validData.isActive ?? true,

                // New Fields
                city: validData.city || null,
                bankName: validData.bankName || null,
                bankBranch: validData.bankBranch || null,
                bankAccount: validData.bankAccount || null,

                // SaaS Fields
                subscriptionType: validData.subscriptionType || null,
                subscriptionStart: parseDate(validData.subscriptionStart),
                subscriptionEnd: parseDate(validData.subscriptionEnd),
                subscriptionPrice: validData.subscriptionPrice || null,
                subscriptionStatus: validData.subscriptionStatus || null,
                packageName: validData.packageName || null,
                subscriptionColor: validData.subscriptionColor || null,
                packageId: validData.packageId || null,
            }
        })

        revalidatePath('/dashboard')

        // Generate Incomes
        await generateSubscriptionIncomes(client, userId)

        return { success: true, data: client }
    } catch (error: any) {
        console.error('createClient error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'לקוח עם שם זה כבר קיים' }
        }
        return { success: false, error: 'Failed to create client' }
    }
}

export async function updateClient(id: string, data: ClientFormData) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Validate Input
        const result = ClientSchema.safeParse(data)
        if (!result.success) {
            return { success: false, error: result.error.errors[0]?.message || 'נתונים לא תקינים' }
        }
        const validData = result.data

        // Verify ownership
        const existing = await db.client.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Client not found')
        }

        const client = await db.client.update({
            where: { id },
            data: {
                name: validData.name,
                email: validData.email || null,
                phone: validData.phone || null,
                taxId: validData.taxId || null,
                address: validData.address || null,
                notes: validData.notes || null,
                isActive: validData.isActive,

                // New Fields
                city: validData.city || null,
                bankName: validData.bankName || null,
                bankBranch: validData.bankBranch || null,
                bankAccount: validData.bankAccount || null,

                // SaaS Fields
                subscriptionType: validData.subscriptionType || null,
                subscriptionStart: parseDate(validData.subscriptionStart),
                subscriptionEnd: parseDate(validData.subscriptionEnd),
                subscriptionPrice: validData.subscriptionPrice || null,
                subscriptionStatus: validData.subscriptionStatus || null,
                packageName: validData.packageName || null,
                subscriptionColor: validData.subscriptionColor || null,
                packageId: validData.packageId || null,
            }
        })

        revalidatePath('/dashboard')

        // Smart Update: Delete future PENDING incomes for this client to allow regeneration with new settings
        // We only touch PENDING incomes in the future. Past or PAID/OVERDUE are kept as history.
        const today = startOfDay(new Date())

        await db.income.deleteMany({
            where: {
                clientId: id,
                date: { gt: today },
                status: 'PENDING'
            }
        })

        // Generate Incomes
        await generateSubscriptionIncomes(client, userId)

        return { success: true, data: client }
    } catch (error: any) {
        console.error('updateClient error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'לקוח עם שם זה כבר קיים' }
        }
        return { success: false, error: 'Failed to update client' }
    }
}

export async function deleteClient(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.client.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Client not found')
        }

        // Check if client has associated incomes or invoices
        // For now, we allow deletion even with history as per user preference (or we can restore the check if needed)
        // But since we are reverting soft delete due to DB mismatch, we go back to hard delete.

        await db.client.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteClient error:', error)
        return { success: false, error: 'Failed to delete client' }
    }
}

export async function getClientStats(clientId: string, year: number) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const client = await db.client.findUnique({ where: { id: clientId } })
        if (!client || client.userId !== userId) {
            throw new Error('Client not found')
        }

        // Get monthly revenue for the year
        const monthlyRevenue = await Promise.all(
            Array.from({ length: 12 }, async (_, i) => {
                const month = i + 1
                const result = await db.income.aggregate({
                    where: {
                        clientId,
                        status: 'PAID',
                        date: {
                            gte: new Date(year, month - 1, 1),
                            lt: new Date(year, month, 1)
                        }
                    },
                    _sum: {
                        amount: true
                    }
                })
                return {
                    month,
                    revenue: result._sum.amount || 0
                }
            })
        )

        // Get total stats
        const totalRevenue = await db.income.aggregate({
            where: { clientId, status: 'PAID' },
            _sum: { amount: true },
            _count: true
        })

        const totalExpenses = await db.expense.aggregate({
            where: { clientId },
            _sum: { amount: true },
            _count: true
        })

        const openInvoices = await db.invoice.count({
            where: {
                clientId,
                status: { in: ['SENT', 'OVERDUE'] }
            }
        })

        return {
            success: true,
            data: {
                monthlyRevenue,
                totalRevenue: totalRevenue._sum.amount || 0,
                totalExpenses: totalExpenses._sum.amount || 0,
                netProfit: (totalRevenue._sum.amount || 0) - (totalExpenses._sum.amount || 0),
                totalTransactions: totalRevenue._count,
                totalExpenseTransactions: totalExpenses._count,
                openInvoices
            }
        }
    } catch (error) {
        console.error('getClientStats error:', error)
        return { success: false, error: 'Failed to fetch client stats' }
    }
}

export async function generateSubscriptionIncomes(client: any, userId: string, minDate?: Date) {
    // Only proceed if we have necessary fields. We allow any status (PAID, INSTALLMENTS, etc) to generate incomes.
    if (!client.subscriptionStatus || !client.subscriptionPrice || !client.subscriptionStart || !client.subscriptionEnd || !client.subscriptionType) {
        return
    }

    try {
        const db = await authenticatedPrisma(userId)

        // Fetch existing incomes to avoid duplicates
        // We match by ClientId and Source for the specific date. Amount ignored to prevent duplicates on price change.
        const existingIncomes = await db.income.findMany({
            where: {
                clientId: client.id,
                source: { startsWith: 'מנוי -' }
            },
            select: { date: true }
        })

        const existingDates = new Set(existingIncomes.map((inc: any) => {
            const d = new Date(inc.date)
            return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0).getTime()
        }))


        // Fix: Use parseDate which now respects exact time if provided
        console.log('[DEBUG] client.subscriptionStart:', client.subscriptionStart, 'type:', typeof client.subscriptionStart)
        console.log('[DEBUG] client.subscriptionEnd:', client.subscriptionEnd, 'type:', typeof client.subscriptionEnd)

        const startDate = parseDate(client.subscriptionStart as any)!
        let currentDate = new Date(startDate) // Copy date with time

        const endDateInput = parseDate(client.subscriptionEnd as any)!
        const endDate = new Date(endDateInput) // Copy date with time

        console.log('[DEBUG] Parsed startDate:', startDate)
        console.log('[DEBUG] Parsed endDate:', endDateInput)
        console.log('[DEBUG] currentDate:', currentDate)


        const amount = client.subscriptionPrice
        const currency = '₪' // Default currency
        const budgetType = 'BUSINESS' // Clients are always business scope as per user request

        console.log(`Generating incomes for client ${client.name} (${client.id}) Scope: ${maskScope(client.scope)} BudgetType: ${budgetType}`)
        if (minDate) console.log(`With minDate: ${minDate.toISOString()}`)

        // Loop through dates
        while (currentDate < endDate && !isSameDay(currentDate, endDate)) {
            // Check if income exists for this date - normalize to Noon for comparison only
            const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 12, 0, 0, 0)
            if (existingDates.has(checkDate.getTime())) {
                console.log(`Skipping date ${checkDate.toISOString()} - exists`)
            } else {
                const status = currentDate > new Date() ? 'PENDING' : 'PAID'

                const vatRate = 0.18
                const totalAmount = amount // Subscription price is the Total (Inclusive)
                const amountBeforeVat = totalAmount / (1 + vatRate) // Extract Net
                const vatAmount = totalAmount - amountBeforeVat

                console.log(`Creating income for date: ${currentDate.toISOString()} Status: ${status} Total: ${totalAmount} (Net: ${amountBeforeVat.toFixed(2)} + VAT: ${vatAmount.toFixed(2)})`)

                // Create Income - Pass Date object directly to avoid timezone issues
                await addIncome(
                    currentDate.getMonth() + 1,
                    currentDate.getFullYear(),
                    {
                        source: `מנוי - ${client.name}`,
                        category: 'כללי', // Default category matches schema default
                        amount: totalAmount,
                        currency: currency,
                        date: currentDate.toISOString().split('T')[0], // Pass YYYY-MM-DD format only
                        isRecurring: false, // We generate individual records
                        clientId: client.id,
                        paymentMethod: 'CREDIT_CARD', // Default assumption or add to form?
                        amountBeforeVat: amountBeforeVat,
                        vatRate: vatRate,
                        vatAmount: vatAmount,
                        paymentDate: status === 'PAID' ? currentDate.toISOString().split('T')[0] : undefined, // Only set paid date if paid
                        status: status
                    } as any,
                    budgetType
                )
            }

            // Advance Date
            switch (client.subscriptionType) {
                case 'WEEKLY':
                    currentDate = addDays(currentDate, 7)
                    break
                case 'MONTHLY':
                    currentDate = addMonths(currentDate, 1)
                    break
                case 'YEARLY':
                    currentDate = addYears(currentDate, 1)
                    break
                case 'PROJECT':
                    // Project is one-time, but if start != end maybe we want to split? 
                    // Usually project is one-time. If "Subscription" is "PROJECT", maybe just one at start?
                    // Or if they set start and end, maybe they mean spread?
                    // For now, let's assume PROJECT is one-time at start.
                    if (currentDate.getTime() === startOfDay(new Date(client.subscriptionStart)).getTime()) {
                        // It's the first execution, so we let it happen.
                        // But for loop, we must break or advance past end
                        currentDate = addDays(endDate, 1) // Force break
                    } else {
                        currentDate = addDays(endDate, 1) // Force break
                    }
                    break
                default:
                    currentDate = addDays(endDate, 1) // Force break
            }
        }

    } catch (error) {
        console.error('Error generating subscription incomes:', error)
    }
}


export async function syncClientIncomes(clientId: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)
        const client = await db.client.findUnique({ where: { id: clientId } })

        if (!client) return { success: false, error: 'Client not found' }

        await generateSubscriptionIncomes(client, userId)
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('syncClientIncomes error:', error)
        return { success: false, error: 'Failed' }
    }
}

function maskScope(scope: string) {
    return scope
}

export async function getClientSubscriptionIncomes(clientId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const incomes = await db.income.findMany({
            where: {
                clientId,
                source: { startsWith: 'מנוי -' } // Filter for subscription generated incomes
            },
            orderBy: { date: 'desc' },
            select: {
                id: true,
                date: true,
                amount: true,
                status: true,
                currency: true
            }
        })

        return { success: true, data: incomes }
    } catch (error) {
        console.error('getClientSubscriptionIncomes error:', error)
        return { success: false, error: 'Failed to fetch subscription incomes' }
    }
}

export async function updateIncomeStatus(incomeId: string, status: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        await db.income.update({
            where: { id: incomeId },
            data: { status: status as any }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('updateIncomeStatus error:', error)
        return { success: false, error: 'Failed to update status' }
    }
}

export async function deleteSubscriptionIncome(incomeId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        await db.income.delete({
            where: { id: incomeId }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteSubscriptionIncome error:', error)
        return { success: false, error: 'Failed to delete income' }
    }
}


export async function updateSubscriptionIncome(incomeId: string, data: { date: Date, amount: number }) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        await db.income.update({
            where: { id: incomeId },
            data: {
                date: data.date,
                amount: data.amount
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('updateSubscriptionIncome error:', error)
        return { success: false, error: 'Failed to update income' }
    }
}

export async function renewSubscription(
    clientId: string,
    start: Date,
    end: Date | undefined,
    data: {
        subscriptionType: string
        packageName?: string
        subscriptionPrice: number
        packageId?: string
        subscriptionStatus?: string
    }
) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const client = await db.client.findUnique({ where: { id: clientId } })
        if (!client || client.userId !== userId) {
            throw new Error('Client not found')
        }

        // Update Client
        const updatedClient = await db.client.update({
            where: { id: clientId },
            data: {
                subscriptionStart: start,
                subscriptionEnd: end,
                subscriptionType: data.subscriptionType,
                packageName: data.packageName,
                subscriptionPrice: data.subscriptionPrice,
                packageId: data.packageId,
                subscriptionStatus: data.subscriptionStatus
            }
        })

        // Generate Incomes for the new period
        await generateSubscriptionIncomes(updatedClient, userId, start)

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('renewSubscription error:', error)
        return { success: false, error: 'Failed to renew subscription' }
    }
}
