'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function getAgreementStatus() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const agreement = await prisma.employeeAgreement.findUnique({
            where: { userId }
        })

        if (!agreement) {
            return { success: true, data: { status: 'NOT_SIGNED' } }
        }

        return {
            success: true,
            data: {
                status: 'SIGNED',
                version: agreement.version,
                signedAt: agreement.signedAt,
                signature: agreement.signature,
                filledValues: agreement.filledValues
            }
        }

    } catch (error) {
        console.error('Error fetching agreement status:', error)
        return { success: false, error: 'Failed to fetch status' }
    }
}

export async function signAgreement(signature: string, version: number, filledValues: any) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // Upsert allows re-signing if needed, or we could strict check
        const agreement = await prisma.employeeAgreement.upsert({
            where: { userId },
            update: {
                signature,
                version,
                filledValues,
                signedAt: new Date(),
                // ipAddress would be captured from headers in a real scenario
            },
            create: {
                userId,
                signature,
                version,
                filledValues,
                signedAt: new Date(),
            }
        })

        revalidatePath('/management')

        return { success: true, data: agreement }

    } catch (error) {
        console.error('Error signing agreement:', error)
        return { success: false, error: 'Failed to sign agreement' }
    }
}
