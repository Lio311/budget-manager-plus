'use server'

import { auth } from '@clerk/nextjs/server'
import { authenticatedPrisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getProjects(type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const projects = await db.project.findMany({
            where: {
                userId,
                scope: type
            },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: projects }
    } catch (error) {
        console.error('Error fetching projects:', error)
        return { success: false, error: 'Failed to fetch projects' }
    }
}

export async function addProject(
    data: {
        name: string
        color?: string
    },
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const project = await db.project.create({
            data: {
                userId,
                name: data.name,
                color: data.color,
                scope: type
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: project }
    } catch (error: any) {
        console.error('Error adding project:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'פרויקט עם שם זה כבר קיים' }
        }
        return { success: false, error: 'Failed to add project' }
    }
}

export async function updateProject(
    id: string,
    data: {
        name?: string
        color?: string
    }
) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const project = await db.project.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.color && { color: data.color })
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: project }
    } catch (error) {
        console.error('Error updating project:', error)
        return { success: false, error: 'Failed to update project' }
    }
}

export async function deleteProject(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        await db.project.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting project:', error)
        return { success: false, error: 'Failed to delete project' }
    }
}

export async function getProjectStats(
    projectId: string,
    month: number,
    year: number
) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        // Get project with incomes and expenses for the specified month
        const project = await db.project.findUnique({
            where: { id: projectId },
            include: {
                incomes: {
                    where: {
                        date: {
                            gte: new Date(year, month - 1, 1),
                            lt: new Date(year, month, 1)
                        }
                    }
                },
                expenses: {
                    where: {
                        date: {
                            gte: new Date(year, month - 1, 1),
                            lt: new Date(year, month, 1)
                        }
                    }
                }
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        const totalIncome = project.incomes.reduce((sum, income) => sum + income.amount, 0)
        const totalExpenses = project.expenses.reduce((sum, expense) => sum + expense.amount, 0)
        const netProfit = totalIncome - totalExpenses

        return {
            success: true,
            data: {
                project,
                stats: {
                    totalIncome,
                    totalExpenses,
                    netProfit,
                    transactionCount: project.incomes.length + project.expenses.length
                }
            }
        }
    } catch (error) {
        console.error('Error fetching project stats:', error)
        return { success: false, error: 'Failed to fetch project stats' }
    }
}
