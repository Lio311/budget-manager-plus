'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function getManagementNotifications() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const notifications = await prisma.managementNotification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        })

        const unreadCount = await prisma.managementNotification.count({
            where: { userId, isRead: false }
        })

        return { success: true, data: { notifications, unreadCount } }
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return { success: false, error: 'Failed' }
    }
}

export async function markNotificationAsRead(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        await prisma.managementNotification.update({
            where: { id, userId },
            data: { isRead: true }
        })

        revalidatePath('/management')
        return { success: true }
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return { success: false, error: 'Failed' }
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        await prisma.managementNotification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true }
        })

        revalidatePath('/management')
        return { success: true }
    } catch (error) {
        console.error('Error marking all notifications as read:', error)
        return { success: false, error: 'Failed' }
    }
}

export async function createManagementNotification({
    type,
    title,
    message,
    link
}: {
    type: string;
    title: string;
    message: string;
    link?: string;
}) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const notification = await prisma.managementNotification.create({
            data: {
                userId,
                type,
                title,
                message,
                link
            }
        })

        revalidatePath('/management')
        return { success: true, data: notification }
    } catch (error) {
        console.error('Error creating notification:', error)
        return { success: false, error: 'Failed' }
    }
}
