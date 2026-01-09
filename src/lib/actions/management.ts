'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createManagementNotification } from './notifications'
import { TaskStatus, Priority, Department, ProjectTask, User } from '@prisma/client'
import { subDays, format } from 'date-fns'
import { convertToILS } from '@/lib/currency'

// --- TASKS ---

export async function getTasks() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // In a real app, check if user is MANAGER. For now, assume access.

        const tasks = await prisma.projectTask.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                creator: {
                    select: { id: true, email: true } // minimal user info
                }
            }
        })

        return { success: true, data: tasks }
    } catch (error) {
        console.error('Error fetching tasks:', error)
        return { success: false, error: 'Failed to fetch tasks' }
    }
}

export async function createTask(data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: Priority;
    department: Department;
    assignees?: string[];
    dueDate?: Date;
}) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const task = await prisma.projectTask.create({
            data: {
                ...data,
                assignees: data.assignees || [], // Handle array
                createdBy: userId
            }
        })

        revalidatePath('/management')

        // Trigger Notification
        await createManagementNotification({
            type: 'TASK_CREATED',
            title: 'משימה חדשה נוצרה',
            message: `נוצרה משימה חדשה בשם: "${task.title}"`,
            link: '/management/tasks'
        })

        return { success: true, data: task }
    } catch (error) {
        console.error('Error creating task:', error)
        return { success: false, error: 'Failed to create task' }
    }
}

export async function updateTask(id: string, data: Partial<ProjectTask>) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // Sanitize data -> Remove unsupported fields if any
        // But since data is Partial<ProjectTask>, it handles assignees natively now.

        const task = await prisma.projectTask.update({
            where: { id },
            data
        })

        revalidatePath('/management')

        // Trigger Notification if status changed
        // Trigger Notification if status changed
        if (data.status) {
            const statusLabels: Record<string, string> = {
                'TODO': 'לביצוע',
                'IN_PROGRESS': 'בביצוע',
                'DONE': 'בוצע',
                'BACKLOG': 'מצבור'
            }
            const statusLabel = statusLabels[task.status] || task.status

            await createManagementNotification({
                type: 'TASK_STATUS_CHANGED',
                title: 'סטטוס משימה עודכן',
                message: `הסטטוס של המשימה "${task.title}" עודכן ל: ${statusLabel}`,
                link: '/management/tasks'
            })
        }

        return { success: true, data: task }
    } catch (error) {
        console.error('Error updating task:', error)
        return { success: false, error: 'Failed to update task' }
    }
}

export async function deleteTask(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        await prisma.projectTask.delete({
            where: { id }
        })

        revalidatePath('/management')
        return { success: true }
    } catch (error) {
        console.error('Error deleting task:', error)
        return { success: false, error: 'Failed to delete task' }
    }
}

// --- KPIs ---

export async function getManagementKPIs() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // 1. Employee Stats (Tasks by specific people, grouped by status)
        const allTasksForStats = await prisma.projectTask.findMany({
            select: { assignees: true, status: true }
        })

        const statusStatsMap: Record<TaskStatus, Map<string, number>> = {
            'TODO': new Map(),
            'IN_PROGRESS': new Map(),
            'REVIEW': new Map(),
            'STUCK': new Map(),
            'DONE': new Map()
        }

        allTasksForStats.forEach((task: { status: TaskStatus, assignees: string[] }) => {
            const statusMap = statusStatsMap[task.status]
            if (statusMap) {
                task.assignees.forEach((assignee: string) => {
                    statusMap.set(assignee, (statusMap.get(assignee) || 0) + 1)
                })
            }
        })

        const employeeStats = {
            'TODO': Array.from(statusStatsMap['TODO'].entries()).map(([assignee, count]) => ({ assignee, _count: { id: count } })),
            'IN_PROGRESS': Array.from(statusStatsMap['IN_PROGRESS'].entries()).map(([assignee, count]) => ({ assignee, _count: { id: count } })),
            'REVIEW': Array.from(statusStatsMap['REVIEW'].entries()).map(([assignee, count]) => ({ assignee, _count: { id: count } })),
            'STUCK': Array.from(statusStatsMap['STUCK'].entries()).map(([assignee, count]) => ({ assignee, _count: { id: count } })),
            'DONE': Array.from(statusStatsMap['DONE'].entries()).map(([assignee, count]) => ({ assignee, _count: { id: count } })),
        }

        // 2. Department Load (All tasks per department)
        const deptLoad = await prisma.projectTask.groupBy({
            by: ['department'],
            _count: { id: true }
        })

        // 3. Financial Overview (Global Business Aggregation)
        // REVENUE: Fetch from PaymentHistory (Admin source of truth)
        const revenueAgg = await prisma.paymentHistory.aggregate({
            _sum: { amount: true }
        })
        const totalRevenue = revenueAgg._sum.amount || 0

        // EXPENSES: Fetch from BusinessExpenses
        const expensesAgg = await prisma.businessExpense.aggregate({
            _sum: { amount: true }
        })
        const totalExpenses = expensesAgg._sum.amount || 0

        // 4. Priority Breakdown & Users for Avatars
        const [priorityStats, users] = await Promise.all([
            prisma.projectTask.groupBy({
                by: ['priority'],
                _count: { id: true },
                where: { status: { not: 'DONE' } }
            }),
            prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    city: true
                }
            })
        ])

        // 5. Recent Activity (Last 5 updated tasks)
        const recentActivity = await prisma.projectTask.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: {
                creator: { select: { id: true, email: true } }
            }
        })

        // 6. Task Velocity (Completed in last 30 days)
        const thirtyDaysAgo = subDays(new Date(), 30)
        const completedRecently = await prisma.projectTask.findMany({
            where: {
                status: 'DONE',
                updatedAt: { gte: thirtyDaysAgo }
            },
            select: { updatedAt: true }
        })

        // Process velocity (Group by date)
        const velocityMap = new Map<string, number>()
        // Initialize last 30 days with 0
        for (let i = 29; i >= 0; i--) {
            const date = subDays(new Date(), i)
            velocityMap.set(format(date, 'dd/MM/yy'), 0)
        }

        // Fill actual data
        completedRecently.forEach(task => {
            const dateStr = format(task.updatedAt, 'dd/MM/yy')
            if (velocityMap.has(dateStr)) {
                velocityMap.set(dateStr, (velocityMap.get(dateStr) || 0) + 1)
            }
        })

        const velocityStats = Array.from(velocityMap.entries()).map(([date, count]) => ({ date, count }))

        return {
            success: true,
            data: {
                employeeStats,
                departmentStats: deptLoad,
                users,
                financials: {
                    revenue: totalRevenue,
                    expenses: totalExpenses,
                    profit: totalRevenue - totalExpenses
                },
                priorityStats,
                recentActivity,
                velocityStats
            }
        }
    } catch (error) {
        console.error('Error fetching KPIs:', error)
        return { success: false, error: 'Failed to fetch KPIs' }
    }
}

// --- MAP ---

export async function getUserLocations() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        // Weekly Reset Logic: Get the start of the current week (Sunday)
        const now = new Date()
        const dayOfWeek = now.getDay() // 0 = Sunday, 1 = Monday...
        const diff = now.getDate() - dayOfWeek
        const lastSunday = new Date(now.setDate(diff))
        lastSunday.setHours(0, 0, 0, 0)

        const locations = await prisma.visitorLog.groupBy({
            by: ['city'],
            _count: { id: true },
            where: {
                createdAt: {
                    gte: lastSunday
                }
            }
        }) as unknown as { city: string, _count: { id: number } }[]

        return { success: true, data: locations }
    } catch (error) {
        console.error('Error fetching user locations:', error)
        return { success: false, error: 'Failed to fetch map data' }
    }
}
export async function fixTaskTitle() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const wrongTitle = "וכתיבת תוכנית יישום ISO מעבר על תקני אבטחה יישום"
        const correctTitle = "מעבר על תקני אבטחה ISO וכתיבת תוכנית יישום"

        const task = await prisma.projectTask.findFirst({
            where: { title: { contains: "ISO" } } // Broad search to be sure
        })

        if (task) {
            await prisma.projectTask.update({
                where: { id: task.id },
                data: { title: correctTitle }
            })
            revalidatePath('/management')
            return { success: true, fixed: task.title }
        }

        return { success: false, error: 'Task not found' }
    } catch (error) {
        console.error('Error fixing task title:', error)
        return { success: false, error: 'Failed' }
    }
}
