'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { addIncome } from './income'
import { addDays, addMonths, addYears, isSameDay, startOfDay } from 'date-fns'

const ClientSchema = z.object({
    name: z.string().min(2, 'שם הלקוח חייב להכיל לפחות 2 תווים').max(100, 'שם הלקוח ארוך מדי'),
    email: z.string().email('כתובת אימייל לא תקינה').max(100).optional().or(z.literal('')),
    phone: z.string().regex(/^[\d-]*$/, 'מספר טלפון לא תקין').max(20).optional().or(z.literal('')),
    taxId: z.string().regex(/^\d*$/, 'ח.פ/ע.מ חייב להכיל ספרות בלבד').max(20).optional().or(z.literal('')),
    address: z.string().max(200, 'הכתובת ארוכה מדי').optional().or(z.literal('')),
    notes: z.string().max(500, 'הערות ארוכות מדי').optional().or(z.literal('')),
    isActive: z.boolean().optional(),

    // SaaS Fields
    subscriptionType: z.string().optional().or(z.literal('')),
    subscriptionStart: z.union([z.date(), z.string().transform((val) => val === '' ? undefined : new Date(val))]).optional(),
    subscriptionEnd: z.union([z.date(), z.string().transform((val) => val === '' ? undefined : new Date(val))]).optional(),
    subscriptionPrice: z.union([z.number(), z.string().transform((val) => val === '' ? undefined : parseFloat(val))]).optional(),
    subscriptionStatus: z.string().optional().or(z.literal('')),
    packageName: z.string().max(100, 'שם החבילה ארוך מדי').optional().or(z.literal('')),
    eventLocation: z.string().max(200, 'המיקום ארוך מדי').optional().or(z.literal(''))
})

export interface ClientFormData {
    name: string
    email?: string
    phone?: string
    taxId?: string
    address?: string
    notes?: string
    isActive?: boolean

    subscriptionType?: string
    subscriptionStart?: Date | string
    subscriptionEnd?: Date
    subscriptionPrice?: number | string
    subscriptionStatus?: string
    packageName?: string
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
                _count: {
                    select: {
                        incomes: true,
                        invoices: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const clientIds = clients.map((c: any) => c.id)

        // Bulk aggregates for better performance
        const [incomeGroups, paidInvoiceGroups, allInvoiceGroups] = await Promise.all([
            db.income.groupBy({
                by: ['clientId'],
                where: { clientId: { in: clientIds } },
                _sum: { amount: true }
            }),
            db.invoice.groupBy({
                by: ['clientId'],
                where: { clientId: { in: clientIds }, status: 'PAID' },
                _sum: { total: true }
            }),
            db.invoice.groupBy({
                by: ['clientId'],
                where: { clientId: { in: clientIds } },
                _count: { id: true }
            })
        ])

        // Create lookup maps
        const incomeMap = new Map(incomeGroups.map((g: any) => [g.clientId, g._sum.amount || 0]))
        const paidInvoiceMap = new Map(paidInvoiceGroups.map((g: any) => [g.clientId, g._sum.total || 0]))
        const allInvoiceMap = new Map(allInvoiceGroups.map((g: any) => [g.clientId, g._count.id || 0]))

        const clientsWithStats = clients.map((client: any) => {
            const incomeTotal = incomeMap.get(client.id) || 0
            const paidInvoiceTotal = paidInvoiceMap.get(client.id) || 0
            const allInvoicesCount = allInvoiceMap.get(client.id) || 0

            const totalRevenue = incomeTotal + paidInvoiceTotal
            const totalTransactions = client._count.incomes + allInvoicesCount

            return {
                ...client,
                totalRevenue,
                _count: {
                    ...client._count,
                    incomes: totalTransactions
                }
            }
        })

        return { success: true, data: clientsWithStats }
    } catch (error) {
        console.error('getClients error:', error)
        return { success: false, error: 'Failed to fetch clients' }
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

                // SaaS Fields
                subscriptionType: validData.subscriptionType || null,
                subscriptionStart: validData.subscriptionStart ? new Date(validData.subscriptionStart) : null,
                subscriptionEnd: validData.subscriptionEnd ? new Date(validData.subscriptionEnd) : null,
                subscriptionPrice: validData.subscriptionPrice || null,
                subscriptionStatus: validData.subscriptionStatus || null,
                packageName: validData.packageName || null
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

                // SaaS Fields
                subscriptionType: validData.subscriptionType || null,
                subscriptionStart: validData.subscriptionStart ? new Date(validData.subscriptionStart) : null,
                subscriptionEnd: validData.subscriptionEnd ? new Date(validData.subscriptionEnd) : null,
                subscriptionPrice: validData.subscriptionPrice || null,
                subscriptionStatus: validData.subscriptionStatus || null,
                packageName: validData.packageName || null
            }
        })

        revalidatePath('/dashboard')

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
        const hasIncomes = await db.income.count({ where: { clientId: id } })
        const hasInvoices = await db.invoice.count({ where: { clientId: id } })

        if (hasIncomes > 0 || hasInvoices > 0) {
            return {
                success: false,
                error: 'לא ניתן למחוק לקוח עם הכנסות או חשבוניות קיימות. אפשר לסמן כלא פעיל במקום.'
            }
        }

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
                totalTransactions: totalRevenue._count,
                openInvoices
            }
        }
    } catch (error) {
        console.error('getClientStats error:', error)
        return { success: false, error: 'Failed to fetch client stats' }
    }
}

export async function generateSubscriptionIncomes(client: any, userId: string) {
    // Only proceed if status is PAID and we have necessary fields
    if (client.subscriptionStatus !== 'PAID' || !client.subscriptionPrice || !client.subscriptionStart || !client.subscriptionEnd || !client.subscriptionType) {
        return
    }

    try {
        const db = await authenticatedPrisma(userId)

        // Fetch existing incomes to avoid duplicates
        // We match by ClientId and Amount. Date will be checked in loop.
        const existingIncomes = await db.income.findMany({
            where: {
                clientId: client.id,
                amount: client.subscriptionPrice
            },
            select: { date: true }
        })

        const existingDates = new Set(existingIncomes.map((inc: any) => startOfDay(inc.date).getTime()))

        let currentDate = startOfDay(new Date(client.subscriptionStart))
        const endDate = startOfDay(new Date(client.subscriptionEnd))
        const amount = client.subscriptionPrice
        const currency = '₪' // Default currency
        const budgetType = 'BUSINESS' // Clients are always business scope as per user request

        console.log(`Generating incomes for client ${client.name} (${client.id}) Scope: ${maskScope(client.scope)} BudgetType: ${budgetType}`)

        // Loop through dates
        while (currentDate <= endDate) {
            // Check if income exists for this date
            if (!existingDates.has(currentDate.getTime())) {
                console.log(`Creating income for date: ${currentDate.toISOString()}`)
                // Create Income
                await addIncome(
                    currentDate.getMonth() + 1,
                    currentDate.getFullYear(),
                    {
                        source: `מנוי - ${client.name}`,
                        category: 'הכנסות', // Default category
                        amount: amount,
                        currency: currency,
                        date: currentDate.toISOString(),
                        isRecurring: false, // We generate individual records
                        clientId: client.id,
                        paymentMethod: 'CREDIT_CARD', // Default assumption or add to form?
                        subscriptionType: client.subscriptionType, // Logic tracking
                        paymentDate: new Date().toISOString() // Marked as paid now? Or on the date? Use transaction date.
                    } as any,
                    budgetType
                )
            } else {
                console.log(`Skipping date ${currentDate.toISOString()} - exists`)
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
