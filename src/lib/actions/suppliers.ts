'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface SupplierFormData {
    name: string
    email?: string
    phone?: string
    taxId?: string
    address?: string
    notes?: string
    isActive?: boolean
}

export async function getSuppliers(scope: string = 'BUSINESS') {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const suppliers = await prisma.supplier.findMany({
            where: {
                userId: user.id,
                scope
            },
            include: {
                _count: {
                    select: {
                        expenses: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Calculate total expenses per supplier
        const suppliersWithStats = await Promise.all(
            suppliers.map(async (supplier) => {
                const totalExpenses = await prisma.expense.aggregate({
                    where: {
                        supplierId: supplier.id
                    },
                    _sum: {
                        amount: true
                    }
                })

                return {
                    ...supplier,
                    totalExpenses: totalExpenses._sum.amount || 0
                }
            })
        )

        return { success: true, data: suppliersWithStats }
    } catch (error) {
        console.error('getSuppliers error:', error)
        return { success: false, error: 'Failed to fetch suppliers' }
    }
}

export async function getSupplier(id: string) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const supplier = await prisma.supplier.findUnique({
            where: { id },
            include: {
                expenses: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        })

        if (!supplier || supplier.userId !== user.id) {
            throw new Error('Supplier not found')
        }

        return { success: true, data: supplier }
    } catch (error) {
        console.error('getSupplier error:', error)
        return { success: false, error: 'Failed to fetch supplier' }
    }
}

export async function createSupplier(data: SupplierFormData, scope: string = 'BUSINESS') {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const supplier = await prisma.supplier.create({
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
        return { success: true, data: supplier }
    } catch (error: any) {
        console.error('createSupplier error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'ספק עם שם זה כבר קיים' }
        }
        return { success: false, error: 'Failed to create supplier' }
    }
}

export async function updateSupplier(id: string, data: SupplierFormData) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.supplier.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Supplier not found')
        }

        const supplier = await prisma.supplier.update({
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
        return { success: true, data: supplier }
    } catch (error: any) {
        console.error('updateSupplier error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'ספק עם שם זה כבר קיים' }
        }
        return { success: false, error: 'Failed to update supplier' }
    }
}

export async function deleteSupplier(id: string) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.supplier.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Supplier not found')
        }

        // Check if supplier has associated expenses
        const hasExpenses = await prisma.expense.count({ where: { supplierId: id } })

        if (hasExpenses > 0) {
            return {
                success: false,
                error: 'לא ניתן למחוק ספק עם הוצאות קיימות. אפשר לסמן כלא פעיל במקום.'
            }
        }

        await prisma.supplier.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteSupplier error:', error)
        return { success: false, error: 'Failed to delete supplier' }
    }
}

export async function getSupplierStats(supplierId: string, year: number) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } })
        if (!supplier || supplier.userId !== user.id) {
            throw new Error('Supplier not found')
        }

        // Get monthly expenses for the year
        const monthlyExpenses = await Promise.all(
            Array.from({ length: 12 }, async (_, i) => {
                const month = i + 1
                const result = await prisma.expense.aggregate({
                    where: {
                        supplierId,
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
                    expenses: result._sum.amount || 0
                }
            })
        )

        // Get total stats
        const totalExpenses = await prisma.expense.aggregate({
            where: { supplierId },
            _sum: { amount: true },
            _count: true
        })

        return {
            success: true,
            data: {
                monthlyExpenses,
                totalExpenses: totalExpenses._sum.amount || 0,
                totalTransactions: totalExpenses._count
            }
        }
    } catch (error) {
        console.error('getSupplierStats error:', error)
        return { success: false, error: 'Failed to fetch supplier stats' }
    }
}
