'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { ensureUserExists } from './budget'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_BUSINESS_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_SAVINGS_CATEGORIES } from '@/lib/constants/categories'

// Helper to serialize category for safe transport over the wire
function serializeCategory(cat: any) {
    if (!cat) return null
    return {
        ...cat,
        createdAt: cat.createdAt instanceof Date ? cat.createdAt.toISOString() : cat.createdAt,
        updatedAt: cat.updatedAt instanceof Date ? cat.updatedAt.toISOString() : cat.updatedAt,
    }
}

export async function getCategories(type: string = 'expense', scope: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const user = await ensureUserExists()
        const db = await authenticatedPrisma(user.id)

        let categories = await db.category.findMany({
            where: {
                userId: user.id,
                type,
                scope
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // Auto-seed if no categories found
        if (categories.length === 0) {
            let defaults: any[] = []

            if (type === 'expense') {
                defaults = scope === 'BUSINESS' ? DEFAULT_BUSINESS_EXPENSE_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES
            } else if (type === 'income') {
                defaults = DEFAULT_INCOME_CATEGORIES
            } else if (type === 'saving') {
                defaults = DEFAULT_SAVINGS_CATEGORIES
            }

            if (defaults.length > 0) {
                console.log(`[getCategories] Seeding ${defaults.length} categories for user ${user.id} type ${type} scope ${scope}`)
                try {
                    await db.category.createMany({
                        data: defaults.map(c => ({
                            userId: user.id,
                            name: c.name,
                            type,
                            scope,
                            color: c.color,
                            updatedAt: new Date()
                        })),
                        skipDuplicates: true
                    })

                    // Fetch again after seeding
                    categories = await db.category.findMany({
                        where: {
                            userId: user.id,
                            type,
                            scope
                        },
                        orderBy: {
                            createdAt: 'asc'
                        }
                    })
                } catch (seedError: any) {
                    console.error('[getCategories] Seeding error:', seedError)
                }
            }
        }

        // Helper to check if default
        const isDefault = (name: string) => {
            let defaults: any[] = []
            if (type === 'expense') {
                defaults = scope === 'BUSINESS' ? DEFAULT_BUSINESS_EXPENSE_CATEGORIES : DEFAULT_EXPENSE_CATEGORIES
            } else if (type === 'income') {
                defaults = DEFAULT_INCOME_CATEGORIES
            } else if (type === 'saving') {
                defaults = DEFAULT_SAVINGS_CATEGORIES
            }
            return defaults.some(d => d.name === name)
        }

        return {
            success: true,
            data: categories.map(cat => ({
                ...serializeCategory(cat),
                isDefault: isDefault(cat.name)
            }))
        }
    } catch (error: any) {
        console.error('[getCategories] Error:', error)
        return { success: false, error: `Failed to fetch categories: ${error.message}` }
    }
}

export async function addCategory(data: { name: string; type: string; color?: string; scope?: 'PERSONAL' | 'BUSINESS' }) {
    try {
        const user = await ensureUserExists()
        const db = await authenticatedPrisma(user.id)
        const scope = data.scope || 'PERSONAL'

        const existing = await db.category.findFirst({
            where: {
                userId: user.id,
                name: data.name,
                type: data.type,
                scope
            }
        })

        if (existing) {
            return { success: false, error: 'Category already exists' }
        }

        const category = await db.category.create({
            data: {
                userId: user.id,
                name: data.name,
                type: data.type,
                color: data.color,
                scope,
                updatedAt: new Date()
            }
        })

        revalidatePath('/dashboard')

        return {
            success: true,
            data: serializeCategory(category)
        }
    } catch (error: any) {
        console.error('[addCategory] Database error:', error)
        return {
            success: false,
            error: `שגיאת שרת: ${error.message || 'לא ניתן לשמור קטגוריה'}`
        }
    }
}

export async function updateCategory(id: string, data: { name?: string; color?: string }) {
    try {
        const user = await ensureUserExists()
        const db = await authenticatedPrisma(user.id)

        // Fetch current category to get old name
        const currentCategory = await db.category.findUnique({
            where: { id }
        })

        if (!currentCategory) {
            return { success: false, error: 'קטגוריה לא נמצאה' }
        }

        const oldName = currentCategory.name
        const newName = data.name && data.name.trim() !== '' ? data.name : oldName

        // Update the category itself
        const category = await db.category.update({
            where: { id },
            data: {
                name: newName,
                ...(data.color && { color: data.color }),
                updatedAt: new Date()
            }
        })

        // Cascade update if name changed
        if (newName !== oldName) {
            console.log(`Cascading category name change from "${oldName}" to "${newName}"`)
            // Update Expenses
            await db.expense.updateMany({
                where: { category: oldName },
                data: { category: newName }
            })
            // Update Incomes
            await db.income.updateMany({
                where: { category: oldName },
                data: { category: newName }
            })
            // Update Savings
            await db.saving.updateMany({
                where: { category: oldName },
                data: { category: newName }
            })
            // Update Bills
            await db.bill.updateMany({
                where: { category: oldName },
                data: { category: newName }
            })
        }

        revalidatePath('/dashboard')
        return { success: true, data: serializeCategory(category) }
    } catch (error: any) {
        console.error('Error updating category:', error)
        return { success: false, error: error.message || 'Failed to update category' }
    }
}

export async function deleteCategory(id: string) {
    try {
        const user = await ensureUserExists()
        const db = await authenticatedPrisma(user.id)

        // Fetch category to get name for cascading delete
        const currentCategory = await db.category.findUnique({
            where: { id }
        })

        if (!currentCategory) {
            return { success: false, error: 'קטגוריה לא נמצאה' }
        }

        const categoryName = currentCategory.name

        // Cascade Delete
        // Delete Expenses
        await db.expense.deleteMany({
            where: { category: categoryName }
        })
        // Delete Incomes
        await db.income.deleteMany({
            where: { category: categoryName }
        })
        // Delete Savings
        await db.saving.deleteMany({
            where: { category: categoryName }
        })
        // Delete Bills? Maybe just set to default? 
        // User asked "delete all expenses linked". 
        // Bills are "accounts" usually, deleting them might be aggressive but consistent with "delete all linked".
        // Let's stick to Expenses/Incomes/Savings which are the primary transaction types.
        await db.bill.deleteMany({
            where: { category: categoryName }
        })

        // Finally delete the category
        await db.category.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting category:', error)
        return { success: false, error: error.message || 'Failed to delete category' }
    }
}

export async function seedCategories(type: string = 'expense', scope: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const user = await ensureUserExists()

        const count = await prisma.category.count({
            where: { userId: user.id, type, scope }
        })

        if (count > 0) return { success: true, message: 'Categories already exist' }

        const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES :
            (type === 'income' ? DEFAULT_INCOME_CATEGORIES :
                (type === 'saving' ? DEFAULT_SAVINGS_CATEGORIES : []))

        if (defaults.length === 0) return { success: true, message: 'No defaults for this type' }

        await prisma.category.createMany({
            data: defaults.map(c => ({
                userId: user.id,
                name: c.name,
                type,
                scope,
                color: c.color,
                updatedAt: new Date()
            })),
            skipDuplicates: true
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: any) {
        console.error("Error seeding categories:", error)
        return { success: false, error: error.message || 'Failed to seed' }
    }
}
