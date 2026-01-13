'use server'

import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Schema for Supplier Package
const SupplierPackageSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
    defaultPrice: z.number().optional().nullable(),
    defaultType: z.string().optional().nullable()
})

export async function getSupplierPackages() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)
        const packages = await db.supplierPackage.findMany({
            where: { userId },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: packages }
    } catch (error) {
        console.error('getSupplierPackages error:', error)
        return { success: false, error: 'Failed to fetch packages' }
    }
}

export async function createSupplierPackage(data: z.infer<typeof SupplierPackageSchema>) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const validation = SupplierPackageSchema.safeParse(data)
        if (!validation.success) {
            return { success: false, error: validation.error.errors[0].message }
        }

        const db = await authenticatedPrisma(userId)

        const existing = await db.supplierPackage.findFirst({
            where: {
                userId,
                name: data.name
            }
        })

        if (existing) {
            return { success: false, error: 'Supplier package with this name already exists' }
        }

        const newPackage = await db.supplierPackage.create({
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
        console.error('createSupplierPackage error:', error)
        return { success: false, error: 'Failed to create supplier package' }
    }
}

export async function updateSupplierPackage(id: string, data: Partial<z.infer<typeof SupplierPackageSchema>>) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.supplierPackage.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            return { success: false, error: 'Package not found' }
        }

        await db.supplierPackage.update({
            where: { id },
            data: {
                ...data
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('updateSupplierPackage error:', error)
        return { success: false, error: 'Failed to update supplier package' }
    }
}

export async function deleteSupplierPackage(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.supplierPackage.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            return { success: false, error: 'Package not found' }
        }

        await db.supplierPackage.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteSupplierPackage error:', error)
        return { success: false, error: 'Failed to delete supplier package' }
    }
}
