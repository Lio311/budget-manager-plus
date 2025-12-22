'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

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

export async function getCategories(type: string = 'expense') {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

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
                await prisma.category.createMany({
                    data: defaults.map(c => ({
                        userId: user.id,
                        name: c.name,
                        type,
                        color: c.color
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
            }
        }

        return { success: true, data: categories }
    } catch (error) {
        console.error('Error fetching categories:', error)
        return { success: false, error: 'Failed to fetch categories' }
    }
}

export async function addCategory(data: { name: string; type: string; color?: string }) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        const user = await prisma.user.findUnique({
            where: { clerkId: userId }
        })

        if (!user) {
            return { success: false, error: 'User not found' }
        }

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
                color: data.color
            }
        })

        revalidatePath('/')
        return { success: true, data: category }
    } catch (error) {
        console.error('Error adding category:', error)
        return { success: false, error: 'Failed to add category' }
    }
}

export async function updateCategory(id: string, data: { name?: string; color?: string }) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        const category = await prisma.category.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.color && { color: data.color })
            }
        })

        revalidatePath('/')
        return { success: true, data: category }
    } catch (error) {
        console.error('Error updating category:', error)
        return { success: false, error: 'Failed to update category' }
    }
}

export async function deleteCategory(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        await prisma.category.delete({
            where: { id }
        })

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Error deleting category:', error)
        return { success: false, error: 'Failed to delete category' }
    }
}

export async function seedCategories(type: string = 'expense') {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const user = await prisma.user.findUnique({ where: { clerkId: userId } })
        if (!user) return { success: false, error: 'User not found' }

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
                color: c.color
            }))
        })

        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error("Error seeding categories:", error)
        return { success: false, error: 'Failed to seed' }
    }
}
