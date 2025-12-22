'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { ensureUserExists } from './budget'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_SAVINGS_CATEGORIES } from '@/lib/constants/categories'

// Helper to serialize category for safe transport over the wire
function serializeCategory(cat: any) {
    if (!cat) return null
    return {
        ...cat,
        createdAt: cat.createdAt instanceof Date ? cat.createdAt.toISOString() : cat.createdAt,
        updatedAt: cat.updatedAt instanceof Date ? cat.updatedAt.toISOString() : cat.updatedAt,
    }
}

export async function getCategories(type: string = 'expense') {
    try {
        const user = await ensureUserExists()

        let categories = await prisma.category.findMany({
            where: {
                userId: user.id,
                type
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        // Auto-seed if no categories found
        if (categories.length === 0) {
            const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES :
                (type === 'income' ? DEFAULT_INCOME_CATEGORIES :
                    (type === 'saving' ? DEFAULT_SAVINGS_CATEGORIES : []))

            if (defaults.length > 0) {
                console.log(`[getCategories] Seeding ${defaults.length} categories for user ${user.id} type ${type}`)
                try {
                    await prisma.category.createMany({
                        data: defaults.map(c => ({
                            userId: user.id,
                            name: c.name,
                            type,
                            color: c.color,
                            updatedAt: new Date()
                        }))
                    })

                    // Fetch again after seeding
                    categories = await prisma.category.findMany({
                        where: {
                            userId: user.id,
                            type
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

        return { success: true, data: categories.map(serializeCategory) }
    } catch (error: any) {
        console.error('[getCategories] Error:', error)
        return { success: false, error: `Failed to fetch categories: ${error.message}` }
    }
}

export async function addCategory(data: { name: string; type: string; color?: string }) {
    try {
        const user = await ensureUserExists()

        const existing = await prisma.category.findFirst({
            where: {
                userId: user.id,
                name: data.name,
                type: data.type
            }
        })

        if (existing) {
            return { success: false, error: 'Category already exists' }
        }

        const category = await prisma.category.create({
            data: {
                userId: user.id,
                name: data.name,
                type: data.type,
                color: data.color,
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

        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.color && { color: data.color }),
                updatedAt: new Date()
            }
        })

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

        await prisma.category.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: any) {
        console.error('Error deleting category:', error)
        return { success: false, error: error.message || 'Failed to delete category' }
    }
}

export async function seedCategories(type: string = 'expense') {
    try {
        const user = await ensureUserExists()

        const count = await prisma.category.count({
            where: { userId: user.id, type }
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
                color: c.color,
                updatedAt: new Date()
            }))
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error: any) {
        console.error("Error seeding categories:", error)
        return { success: false, error: error.message || 'Failed to seed' }
    }
}
