'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const emptyToUndefined = (val: unknown) => {
    if (val === '' || val === null || val === undefined) return undefined;
    return val;
};

const SupplierSchema = z.object({
    name: z.string().min(2, 'שם הספק חייב להכיל לפחות 2 תווים').max(100, 'שם הספק ארוך מדי'),
    email: z.preprocess(emptyToUndefined, z.string().email('כתובת אימייל לא תקינה').max(100).optional()),
    phone: z.preprocess(emptyToUndefined, z.string().regex(/^[\d-]*$/, 'מספר טלפון לא תקין').max(20).optional()),
    taxId: z.preprocess(emptyToUndefined, z.string().regex(/^\d*$/, 'ח.פ/ע.מ חייב להכיל ספרות בלבד').max(20).optional()),
    address: z.preprocess(emptyToUndefined, z.string().max(200, 'הכתובת ארוכה מדי').optional()),
    notes: z.preprocess(emptyToUndefined, z.string().max(500, 'הערות ארוכות מדי').optional()),
    isActive: z.boolean().optional(),

    // Package & Subscription Fields
    packageId: z.preprocess(emptyToUndefined, z.string().optional()),
    subscriptionType: z.preprocess(emptyToUndefined, z.string().optional()),
    subscriptionPrice: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
    subscriptionStart: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    subscriptionEnd: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    subscriptionStatus: z.preprocess(emptyToUndefined, z.string().optional()),
    subscriptionColor: z.preprocess(emptyToUndefined, z.string().optional())
})

export interface SupplierFormData {
    name: string
    email?: string
    phone?: string
    taxId?: string
    address?: string
    notes?: string
    isActive?: boolean

    packageId?: string
    subscriptionType?: string
    subscriptionPrice?: number | string
    subscriptionStart?: Date | null
    subscriptionEnd?: Date | null
    subscriptionStatus?: string
    subscriptionColor?: string
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
                package: true, // Include Package
                _count: {
                    select: {
                        expenses: {
                            expenses: true
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        const supplierIds = suppliers.map(s => s.id)

        // Bulk aggregates for better performance
        const expenseGroups = await db.expense.groupBy({
            by: ['supplierId'],
            where: {
                supplierId: { in: supplierIds },
                supplierId: { in: supplierIds }
            },
            _sum: { amount: true }
        })

        // Create lookup map
        const expenseMap = new Map(expenseGroups.map(g => [g.supplierId, g._sum.amount || 0]))

        const suppliersWithStats = suppliers.map((supplier) => {
            const totalExpenses = expenseMap.get(supplier.id) || 0

            return {
                ...supplier,
                totalExpenses
            }
        })

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
                package: true, // Include Package
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
        const price = validData.subscriptionPrice ? parseFloat(validData.subscriptionPrice.toString()) : null

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
                isActive: validData.isActive ?? true,

                // New Fields
                packageId: validData.packageId || null,
                subscriptionType: validData.subscriptionType || null,
                subscriptionPrice: price,
                subscriptionStart: validData.subscriptionStart,
                subscriptionEnd: validData.subscriptionEnd,
                subscriptionStatus: validData.subscriptionStatus || null,
                subscriptionColor: validData.subscriptionColor || null
            },
            include: {
                package: true
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
        const price = validData.subscriptionPrice ? parseFloat(validData.subscriptionPrice.toString()) : null

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
                isActive: validData.isActive,

                // New Fields
                packageId: validData.packageId || null,
                subscriptionType: validData.subscriptionType || null,
                subscriptionPrice: price,
                subscriptionStart: validData.subscriptionStart,
                subscriptionEnd: validData.subscriptionEnd,
                subscriptionStatus: validData.subscriptionStatus || null,
                subscriptionColor: validData.subscriptionColor || null
            },
            include: {
                package: true
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
            where: {
                supplierId,
                where: {
                    supplierId
                },
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

import { addExpense } from './expense'
import { startOfDay, addDays, addMonths, addYears, format } from 'date-fns'

export async function generateSubscriptionExpenses(supplier: any, userId: string, minDate?: Date) {
    // Only proceed if status is ACTIVE/PAID equivalent and we have fields
    // For suppliers, existing logic usually checks active status or just presence of subscription fields
    if (!supplier.subscriptionPrice || !supplier.subscriptionStart || !supplier.subscriptionType) {
        return
    }

    try {
        const db = await authenticatedPrisma(userId)

        // Fetch existing expenses to avoid duplicates
        // Source pattern: "מנוי - [Supplier Name]"
        const sourcePattern = `מנוי - ${supplier.name}`
        const existingExpenses = await db.expense.findMany({
            where: {
                supplierId: supplier.id,
                description: sourcePattern,
                amount: supplier.subscriptionPrice
            },
            select: { date: true }
        })

        const existingDates = new Set(existingExpenses.map((exp: any) => startOfDay(exp.date).getTime()))

        let currentDate = startOfDay(new Date(supplier.subscriptionStart))
        const endDate = supplier.subscriptionEnd ? startOfDay(new Date(supplier.subscriptionEnd)) : addYears(new Date(), 1) // Default to 1 year ahead if no end date
        const amount = supplier.subscriptionPrice
        const currency = 'ILS'
        const budgetType = supplier.scope || 'BUSINESS'

        // Loop
        const today = startOfDay(new Date())

        // Safety break
        let loops = 0
        while (currentDate <= endDate && loops < 1000) {
            loops++

            if (minDate && currentDate < minDate) {
                // Skip
            } else if (!existingDates.has(currentDate.getTime())) {
                const isPaid = currentDate <= today

                await addExpense(
                    currentDate.getMonth() + 1,
                    currentDate.getFullYear(),
                    {
                        description: sourcePattern,
                        category: 'מנויים', // Default category
                        amount: amount,
                        currency: 'ILS',
                        date: currentDate.toISOString(),
                        isRecurring: false,
                        supplierId: supplier.id,
                        paymentMethod: 'BANK_TRANSFER', // Default
                        // Use paymentDate to indicate Paid status
                        paymentDate: isPaid ? currentDate.toISOString() : undefined,
                        expenseType: 'OPEX'
                    } as any,
                    budgetType as any
                )
            }

            // Advance Date
            switch (supplier.subscriptionType) {
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
                    currentDate = addDays(endDate, 1) // One time
                    break
                default:
                    currentDate = addDays(endDate, 1)
            }
        }

    } catch (error) {
        console.error('Error generating subscription expenses:', error)
    }
}

export async function syncSupplierExpenses(supplierId: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)
        const supplier = await db.supplier.findUnique({ where: { id: supplierId } })

        if (!supplier) return { success: false, error: 'Supplier not found' }

        await generateSubscriptionExpenses(supplier, userId)
        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('syncSupplierExpenses error:', error)
        return { success: false, error: 'Failed' }
    }
}

export async function getSupplierSubscriptionExpenses(supplierId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // We identify subscription expenses by description "מנוי - ..." or explicit link if we had one.
        // For now relying on description logic as in clients.
        // Ideally we'd filter by exact description match but "startsWith" is safer for small variations.

        // First get the supplier details to match and potentially generate
        const supplier = await db.supplier.findUnique({
            where: { id: supplierId },
            include: { package: true } // Include package if needed, but mainly we need own fields which are default included if no select
        })
        if (!supplier) throw new Error('Supplier not found')

        let expenses = await db.expense.findMany({
            where: {
                supplierId,
                description: { startsWith: 'מנוי -' }
            },
            orderBy: { date: 'desc' },
            select: {
                id: true,
                date: true,
                amount: true,
                currency: true,
                paymentDate: true, // We use this for status
                description: true
            }
        })

        // If no expenses found but supplier has subscription details, generate them
        const s = supplier as any
        if (expenses.length === 0 && s.subscriptionPrice && s.subscriptionType && s.subscriptionStart) {
            console.log('Generating missing subscription expenses for supplier:', s.name)
            await generateSubscriptionExpenses(s, userId, startOfDay(new Date(s.subscriptionStart)))

            // Re-fetch
            expenses = await db.expense.findMany({
                where: {
                    supplierId,
                    description: { startsWith: 'מנוי -' }
                },
                orderBy: { date: 'desc' },
                select: {
                    id: true,
                    date: true,
                    amount: true,
                    currency: true,
                    paymentDate: true,
                    description: true
                }
            })
        }

        // Map to format compatible with dialog (add 'status' field derived from paymentDate)
        const mappedExpenses = expenses.map(e => ({
            ...e,
            status: e.paymentDate ? 'PAID' : (new Date(e.date || new Date()) < new Date() ? 'OVERDUE' : 'PENDING')
        }))

        return { success: true, data: mappedExpenses }
    } catch (error) {
        console.error('getSupplierSubscriptionExpenses error:', error)
        return { success: false, error: 'Failed to fetch subscription expenses' }
    }
}

export async function updateExpenseStatus(expenseId: string, status: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // If PAID -> paymentDate = now (or keep existing if present?)
        // If PENDING/OVERDUE -> paymentDate = null

        const data: any = {}
        if (status === 'PAID') {
            // If already has date, don't overwrite? Or set to now?
            // Let's check first
            const existing = await db.expense.findUnique({ where: { id: expenseId } })
            if (!existing?.paymentDate) {
                data.paymentDate = new Date()
            }
        } else {
            data.paymentDate = null
        }

        await db.expense.update({
            where: { id: expenseId },
            data
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('updateExpenseStatus error:', error)
        return { success: false, error: 'Failed to update status' }
    }
}

export async function deleteSubscriptionExpense(expenseId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        await db.expense.delete({
            where: { id: expenseId }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteSubscriptionExpense error:', error)
        return { success: false, error: 'Failed to delete expense' }
    }
}

export async function updateSubscriptionExpense(expenseId: string, data: { date: Date, amount: number }) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        await db.expense.update({
            where: { id: expenseId },
            data: {
                date: data.date,
                amount: data.amount
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('updateSubscriptionExpense error:', error)
        return { success: false, error: 'Failed to update expense' }
    }
}
