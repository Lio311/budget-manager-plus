'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface ClientFormData {
    name: string
    email?: string
    phone?: string
    taxId?: string
    address?: string
    notes?: string
    isActive?: boolean
}

export async function getClients(scope: string = 'BUSINESS') {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const clients = await prisma.client.findMany({
            where: {
                userId: user.id,
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

        // Calculate total revenue per client
        const clientsWithStats = await Promise.all(
            clients.map(async (client) => {
                // Sum from incomes
                const incomeTotal = await prisma.income.aggregate({
                    where: {
                        clientId: client.id
                    },
                    _sum: {
                        amount: true
                    }
                })

                // Sum from paid invoices
                const invoiceTotal = await prisma.invoice.aggregate({
                    where: {
                        clientId: client.id,
                        status: 'PAID'
                    },
                    _sum: {
                        total: true
                    }
                })

                const totalRevenue = (incomeTotal._sum.amount || 0) + (invoiceTotal._sum.total || 0)
                const totalTransactions = client._count.incomes + (await prisma.invoice.count({
                    where: { clientId: client.id, status: 'PAID' }
                }))

                return {
                    ...client,
                    totalRevenue,
                    _count: {
                        ...client._count,
                        incomes: totalTransactions
                    }
                }
            })
        )

        return { success: true, data: clientsWithStats }
    } catch (error) {
        console.error('getClients error:', error)
        return { success: false, error: 'Failed to fetch clients' }
    }
}

export async function getClient(id: string) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const client = await prisma.client.findUnique({
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

        if (!client || client.userId !== user.id) {
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
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const client = await prisma.client.create({
            data: {
                userId: user.id,
                scope,
                name: data.name,
                email: data.email,
                phone: data.phone,
                taxId: data.taxId,
                address: data.address,
                notes: data.notes,
                isActive: data.isActive ?? true
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
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.client.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Client not found')
        }

        const client = await prisma.client.update({
            where: { id },
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                taxId: data.taxId,
                address: data.address,
                notes: data.notes,
                isActive: data.isActive
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
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.client.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Client not found')
        }

        // Check if client has associated incomes or invoices
        const hasIncomes = await prisma.income.count({ where: { clientId: id } })
        const hasInvoices = await prisma.invoice.count({ where: { clientId: id } })

        if (hasIncomes > 0 || hasInvoices > 0) {
            return {
                success: false,
                error: 'לא ניתן למחוק לקוח עם הכנסות או חשבוניות קיימות. אפשר לסמן כלא פעיל במקום.'
            }
        }

        await prisma.client.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteClient error:', error)
        return { success: false, error: 'Failed to delete client' }
    }
}

export async function getClientStats(clientId: string, year: number) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const client = await prisma.client.findUnique({ where: { id: clientId } })
        if (!client || client.userId !== user.id) {
            throw new Error('Client not found')
        }

        // Get monthly revenue for the year
        const monthlyRevenue = await Promise.all(
            Array.from({ length: 12 }, async (_, i) => {
                const month = i + 1
                const result = await prisma.income.aggregate({
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
        const totalRevenue = await prisma.income.aggregate({
            where: { clientId },
            _sum: { amount: true },
            _count: true
        })

        const openInvoices = await prisma.invoice.count({
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
