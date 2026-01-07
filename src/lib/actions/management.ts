'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { TaskStatus, Priority, Department, ProjectTask, User } from '@prisma/client'
import { subDays, format } from 'date-fns'

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
    assignee?: string;
    dueDate?: Date;
}) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const task = await prisma.projectTask.create({
            data: {
                ...data,
                createdBy: userId
            }
        })

        revalidatePath('/management')
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

        const task = await prisma.projectTask.update({
            where: { id },
            data
        })

        revalidatePath('/management')
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

        // 1. Employee Stats (Tasks Completed by specific people)
        // We filter by status=DONE and group by assignee
        const completedTasks = await prisma.projectTask.groupBy({
            by: ['assignee'],
            where: { status: 'DONE' },
            _count: { id: true }
        })

        // 2. Department Load (All tasks per department)
        const deptLoad = await prisma.projectTask.groupBy({
            by: ['department'],
            _count: { id: true }
        })

        // 3. Financial Overview (Global Business Aggregation)
        // Fetch all business budgets for the user
        const businessBudgets = await prisma.budget.findMany({
            where: {
                userId,
                type: 'BUSINESS'
            },
            include: {
                incomes: true,
                expenses: true
            }
        })

        let totalRevenue = 0
        let totalExpenses = 0

        businessBudgets.forEach(budget => {
            totalRevenue += budget.incomes.reduce((acc, curr) => acc + curr.amount, 0)
            totalExpenses += budget.expenses.reduce((acc, curr) => acc + curr.amount, 0)
        })

        // 4. Priority Breakdown
        const priorityStats = await prisma.projectTask.groupBy({
            by: ['priority'],
            _count: { id: true },
            where: { status: { not: 'DONE' } } // Active tasks only
        })

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
            velocityMap.set(format(date, 'MM/dd'), 0)
        }

        // Fill actual data
        completedRecently.forEach(task => {
            const dateStr = format(task.updatedAt, 'MM/dd')
            if (velocityMap.has(dateStr)) {
                velocityMap.set(dateStr, (velocityMap.get(dateStr) || 0) + 1)
            }
        })

        const velocityStats = Array.from(velocityMap.entries()).map(([date, count]) => ({ date, count }))

        return {
            success: true,
            data: {
                employeeStats: completedTasks,
                departmentStats: deptLoad,
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

        // Aggregate count by city
        // Note: city is nullable, so we handle that
        const locations = await prisma.user.groupBy({
            by: ['city'],
            _count: { id: true },
            where: {
                city: { not: null }
            }
        })

        return { success: true, data: locations }
    } catch (error) {
        console.error('Error fetching user locations:', error)
        return { success: false, error: 'Failed to fetch map data' }
    }
}
