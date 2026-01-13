'use server'

import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache' // Ensure this is imported correctly
import { z } from 'zod'

// Schema for Package
const PackageSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    defaultPrice: z.number().optional(),
    defaultType: z.string().optional()
})

export async function getClientPackages() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)
        const packages = await db.clientPackage.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: packages }
    } catch (error) {
        console.error('getClientPackages error:', error)
        return { success: false, error: 'Failed to fetch packages' }
    }
}

export async function createClientPackage(data: z.infer<typeof PackageSchema>) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const validation = PackageSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: validation.error.errors[0].message }
        }

        const db = await authenticatedPrisma(userId)

        // Use upsert or checking existence is not strictly needed with unique constraint, 
        // but we want to avoid throwing internal errors.
        const existing = await db.clientPackage.findFirst({
            where: {
                userId,
                name: data.name
            }
        })

        if (existing) {
            return { success: false, error: 'Package with this name already exists' }
        }

        const newPackage = await db.clientPackage.create({
            data: {
                userId: userId,
                name: data.name,
                color: data.color,
                defaultPrice: data.defaultPrice,
                defaultType: data.defaultType
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: newPackage }
    } catch (error) {
        console.error('createClientPackage error:', error)
        return { success: false, error: 'Failed to create package' }
    }
}

export async function updateClientPackage(id: string, data: Partial<z.infer<typeof PackageSchema>>) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        await db.clientPackage.update({
            where: { id },
            data: {
                ...data
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('updateClientPackage error:', error)
        return { success: false, error: 'Failed to update package' }
    }
}

export async function deleteClientPackage(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        // What happens to clients using this package? 
        // Set their packageId to null? Or prevent delete?
        // Let's set to null for now (onDelete SetNull is not in schema relation though).
        // Relation define usage: fields: [packageId], references: [id]
        // If we delete package, it might fail unless we unlink clients first.

        // Unlink clients first
        await db.client.updateMany({
            where: { packageId: id },
            data: { packageId: null }
        })

        await db.clientPackage.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteClientPackage error:', error)
        return { success: false, error: 'Failed to delete package' }
    }
}
