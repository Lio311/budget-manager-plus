'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation Schemas
const BusinessProfileSchema = z.object({
    companyName: z.string().min(2, 'שם העסק חייב להכיל לפחות 2 תווים').max(100, 'שם העסק ארוך מדי'),
    companyId: z.string().regex(/^\d*$/, 'מספר עוסק חייב להכיל ספרות בלבד').max(20, 'מספר עוסק ארוך מדי').optional(),
    vatStatus: z.enum(['EXEMPT', 'AUTHORIZED', 'LTD', 'NONE', 'FULL', 'PARTIAL']).optional().default('EXEMPT'), // Wider acceptance for enum or string
    address: z.string().max(200, 'הכתובת ארוכה מדי').optional().nullable(),
    phone: z.string().regex(/^[\d-]*$/, 'מספר טלפון לא תקין').max(20, 'מספר טלפון ארוך מדי').optional().nullable(),
    email: z.string().email('כתובת אימייל לא תקינה').max(100, 'כתובת אימייל ארוכה מדי').optional().nullable(),
    signature: z.string().optional().nullable(), // Base64 signature
    taxRate: z.number().min(0).max(100).optional().default(0)
})

const LogoSchema = z.string()
    .startsWith('data:image/', 'פורמט תמונה לא תקין')
    .max(7 * 1024 * 1024, 'קובץ הלוגו גדול מדי (מקסימום 5MB)') // Base64 inflation approx 33%

export interface BusinessProfileData {
    companyName: string
    companyId?: string
    vatStatus: string
    address?: string
    phone?: string
    email?: string
    signature?: string
    taxRate?: number
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

        // Validate Input
        const result = BusinessProfileSchema.safeParse(data)
        if (!result.success) {
            const errorMessage = result.error.errors[0]?.message || 'נתונים לא תקינים'
            return { success: false, error: errorMessage }
        }

        const validData = result.data

        const profile = await prisma.businessProfile.upsert({
            where: { userId: user.id },
            update: {
                companyName: validData.companyName,
                companyId: validData.companyId || null,
                vatStatus: validData.vatStatus || 'EXEMPT',
                address: validData.address || null,
                phone: validData.phone || null,
                email: validData.email || null,
                signatureUrl: validData.signature || null,
                taxRate: validData.taxRate || 0
            },
            create: {
                userId: user.id,
                companyName: validData.companyName,
                companyId: validData.companyId || null,
                vatStatus: validData.vatStatus || 'EXEMPT',
                address: validData.address || null,
                phone: validData.phone || null,
                email: validData.email || null,
                signatureUrl: validData.signature || null,
                taxRate: validData.taxRate || 0
            }
        })

        revalidatePath('/dashboard')
        revalidatePath('/settings')
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

        // Validate Logo Input
        const result = LogoSchema.safeParse(logoData)
        if (!result.success) {
            return { success: false, error: result.error.errors[0]?.message }
        }

        const validLogo = result.data

        const profile = await prisma.businessProfile.upsert({
            where: { userId: user.id },
            update: {
                logoUrl: validLogo
            },
            create: {
                userId: user.id,
                companyName: 'החברה שלי', // Placeholder if creating just for logo
                vatStatus: 'EXEMPT',
                logoUrl: validLogo
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
