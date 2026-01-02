'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function getWorkEvents(month: number, year: number) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);

        // Get events for the whole month
        // We can grab a bit broader range to handle timezone/overlaps
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        const events = await db.workEvent.findMany({
            where: {
                start: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                client: { select: { id: true, name: true } },
                income: { select: { id: true, source: true, amount: true, currency: true } }
            },
            orderBy: { start: 'asc' }
        })

        return { success: true, data: events }
    } catch (error) {
        console.error('Error fetching work events:', error)
        return { success: false, error: 'Failed to fetch work events' }
    }
}

export async function addWorkEvent(data: {
    title: string
    description?: string
    start: Date
    end?: Date
    allDay?: boolean
    clientId?: string
    incomeId?: string
    location?: string
}) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        console.log('Adding Work Event:', { userId, ...data }); // Debug Log

        const db = await authenticatedPrisma(userId);

        const event = await db.workEvent.create({
            data: {
                title: data.title,
                description: data.description,
                start: data.start,
                end: data.end,
                allDay: data.allDay || false,
                location: data.location,
                clientId: data.clientId,
                incomeId: data.incomeId,
                userId: userId
            }
        })

        console.log('Work Event Created:', event); // Debug Log

        revalidatePath('/dashboard')
        return { success: true, data: event }
    } catch (error) {
        console.error('Error adding work event:', error)
        return { success: false, error: 'Failed to add event' }
    }
}

export async function updateWorkEvent(id: string, data: {
    title?: string
    description?: string
    start?: Date
    end?: Date
    allDay?: boolean
    clientId?: string
    incomeId?: string
    location?: string
}) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);

        const event = await db.workEvent.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.start && { start: data.start }),
                ...(data.end !== undefined && { end: data.end }),
                ...(data.allDay !== undefined && { allDay: data.allDay }),
                ...(data.location !== undefined && { location: data.location }),
                ...(data.clientId !== undefined && { clientId: data.clientId }),
                ...(data.incomeId !== undefined && { incomeId: data.incomeId })
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: event }
    } catch (error) {
        console.error('Error updating work event:', error)
        return { success: false, error: 'Failed to update event' }
    }
}

export async function deleteWorkEvent(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);

        await db.workEvent.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting work event:', error)
        return { success: false, error: 'Failed to delete event' }
    }
}
