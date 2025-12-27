'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface BusinessProfileData {
    companyName: string
    companyId?: string
    vatStatus: string
}

export async function getBusinessProfile() {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const profile = await prisma.businessProfile.findUnique({
            where: { userId: user.id }
        })

        return { success: true, data: profile }
    } catch (error) {
        console.error('getBusinessProfile error:', error)
        return { success: false, error: 'Failed to fetch business profile' }
    }
}

export async function updateBusinessProfile(data: BusinessProfileData) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const profile = await prisma.businessProfile.upsert({
            where: { userId: user.id },
            update: {
                companyName: data.companyName,
                companyId: data.companyId,
                vatStatus: data.vatStatus
            },
            create: {
                userId: user.id,
                companyName: data.companyName,
                companyId: data.companyId,
                vatStatus: data.vatStatus
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: profile }
    } catch (error) {
        console.error('updateBusinessProfile error:', error)
        return { success: false, error: 'Failed to update business profile' }
    }
}

export async function uploadBusinessLogo(logoData: string) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Validate base64 image
        if (!logoData.startsWith('data:image/')) {
            throw new Error('Invalid image format')
        }

        // Check size (max 5MB in base64)
        const sizeInBytes = (logoData.length * 3) / 4
        if (sizeInBytes > 5 * 1024 * 1024) {
            throw new Error('Image too large (max 5MB)')
        }

        const profile = await prisma.businessProfile.upsert({
            where: { userId: user.id },
            update: {
                logoUrl: logoData
            },
            create: {
                userId: user.id,
                companyName: 'החברה שלי',
                vatStatus: 'EXEMPT',
                logoUrl: logoData
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: profile }
    } catch (error: any) {
        console.error('uploadBusinessLogo error:', error)
        return { success: false, error: error.message || 'Failed to upload logo' }
    }
}

export async function deleteBusinessLogo() {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        await prisma.businessProfile.update({
            where: { userId: user.id },
            data: {
                logoUrl: null,
                logoPublicId: null
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteBusinessLogo error:', error)
        return { success: false, error: 'Failed to delete logo' }
    }
}
