'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const SupplierSchema = z.object({
    name: z.string().min(2, 'שם הספק חייב להכיל לפחות 2 תווים').max(100, 'שם הספק ארוך מדי'),
    email: z.string().email('כתובת אימייל לא תקינה').max(100).optional().or(z.literal('')),
    phone: z.string().regex(/^[\d-]*$/, 'מספר טלפון לא תקין').max(20).optional().or(z.literal('')),
    taxId: z.string().regex(/^\d*$/, 'ח.פ/ע.מ חייב להכיל ספרות בלבד').max(20).optional().or(z.literal('')),
    address: z.string().max(200, 'הכתובת ארוכה מדי').optional().or(z.literal('')),
    notes: z.string().max(500, 'הערות ארוכות מדי').optional().or(z.literal('')),
    isActive: z.boolean().optional()
})

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
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const suppliers = await db.supplier.findMany({
            where: {
                userId,
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
                const totalExpenses = await db.expense.aggregate({
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
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const supplier = await db.supplier.findUnique({
            where: { id },
            include: {
                expenses: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        })

        if (!supplier || supplier.userId !== userId) {
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
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Validate Input
        const result = SupplierSchema.safeParse(data)
        if (!result.success) {
            return { success: false, error: result.error.errors[0]?.message || 'נתונים לא תקינים' }
        }
        const validData = result.data

        const supplier = await db.supplier.create({
            data: {
                userId,
                scope,
                name: validData.name,
                email: validData.email || null,
                phone: validData.phone || null,
                taxId: validData.taxId || null,
                address: validData.address || null,
                notes: validData.notes || null,
                isActive: validData.isActive ?? true
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
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Validate Input
        const result = SupplierSchema.safeParse(data)
        if (!result.success) {
            return { success: false, error: result.error.errors[0]?.message || 'נתונים לא תקינים' }
        }
        const validData = result.data

        // Verify ownership
        const existing = await db.supplier.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Supplier not found')
        }

        const supplier = await db.supplier.update({
            where: { id },
            data: {
                name: validData.name,
                email: validData.email || null,
                phone: validData.phone || null,
                taxId: validData.taxId || null,
                address: validData.address || null,
                notes: validData.notes || null,
                isActive: validData.isActive
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
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.supplier.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Supplier not found')
        }

        // Check if supplier has associated expenses
        const hasExpenses = await db.expense.count({ where: { supplierId: id } })

        if (hasExpenses > 0) {
            return {
                success: false,
                error: 'לא ניתן למחוק ספק עם הוצאות קיימות. אפשר לסמן כלא פעיל במקום.'
            }
        }

        await db.supplier.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteSupplier error:', error)
        return { success: false, error: 'Failed to delete supplier' }
    }
}

export async function getSupplierStats(supplierId: string, year: number) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const supplier = await db.supplier.findUnique({ where: { id: supplierId } })
        if (!supplier || supplier.userId !== userId) {
            throw new Error('Supplier not found')
        }

        // Get monthly expenses for the year
        const monthlyExpenses = await Promise.all(
            Array.from({ length: 12 }, async (_, i) => {
                const month = i + 1
                const result = await db.expense.aggregate({
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
        const totalExpenses = await db.expense.aggregate({
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
