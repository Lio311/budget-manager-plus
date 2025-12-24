'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'

export async function submitFeedback(content: string) {
    const user = await currentUser()
    if (!user) throw new Error('Unauthorized')

    await prisma.feedback.create({
        data: {
            userId: user.id,
            content
        }
    })

    return { success: true }
}
