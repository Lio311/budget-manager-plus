'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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
    packageName: z.string().max(100, 'שם החבילה ארוך מדי').optional().or(z.literal(''))
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
    subscriptionEnd?: Date | string
    subscriptionPrice?: number | string
    subscriptionStatus?: string
    packageName?: string
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

        const clientIds = clients.map(c => c.id)

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
        const incomeMap = new Map(incomeGroups.map(g => [g.clientId, g._sum.amount || 0]))
        const paidInvoiceMap = new Map(paidInvoiceGroups.map(g => [g.clientId, g._sum.total || 0]))
        const allInvoiceMap = new Map(allInvoiceGroups.map(g => [g.clientId, g._count.id || 0]))

        const clientsWithStats = clients.map((client) => {
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
