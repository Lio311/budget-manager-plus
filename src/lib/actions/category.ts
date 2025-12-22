'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { ensureUserExists } from './budget'

// Default categories to seed if needed (optional)
export const DEFAULT_EXPENSE_CATEGORIES = [
    { name: 'מזון', color: 'bg-green-100 text-green-700 border-green-200' },
    { name: 'תחבורה', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { name: 'בילויים', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { name: 'קניות', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { name: 'בריאות', color: 'bg-red-100 text-red-700 border-red-200' },
    { name: 'חינוך', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
]

export const DEFAULT_INCOME_CATEGORIES = [
    { name: 'משכורת', color: 'bg-green-100 text-green-700 border-green-200' },
    { name: 'בונוס', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { name: 'עסק', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { name: 'השקעות', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { name: 'קצבה', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { name: 'מתנה', color: 'bg-pink-100 text-pink-700 border-pink-200' },
]

export const DEFAULT_SAVINGS_CATEGORIES = [
    { name: 'חירום', color: 'bg-red-100 text-red-700 border-red-200' },
    { name: 'חופשה', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { name: 'רכב', color: 'bg-gray-100 text-gray-700 border-gray-200' },
    { name: 'דירה', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { name: 'פנסיה', color: 'bg-green-100 text-green-700 border-green-200' },
    { name: 'השקעות', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
]

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

        console.log(`[addCategory] Successfully added category: ${category.name}`)
        revalidatePath('/dashboard')

        return {
            success: true,
            data: serializeCategory(category)
        }
    } catch (error: any) {
        console.error('[addCategory] Database error:', error)
        return {
            success: false,
            error: error.code === 'P2002'
                ? 'A category with this name already exists'
                : (error.message || 'Failed to save category to database')
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
