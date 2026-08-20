'use server'

import { auth } from '@clerk/nextjs/server'
import { authenticatedPrisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Types ───────────────────────────────────────────────────

export type BusinessProjectFormData = {
    name: string
    description?: string
    color?: string
    status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
    budget?: number | null
    startDate?: Date | null
    endDate?: Date | null
    clientId?: string | null
    parentId?: string | null
}

export type ProjectWithStats = {
    id: string
    name: string
    description: string | null
    color: string | null
    status: string
    budget: number | null
    startDate: Date | null
    endDate: Date | null
    clientId: string | null
    clientName: string | null
    parentId: string | null
    createdAt: Date
    updatedAt: Date
    stats: {
        totalIncome: number
        totalExpenses: number
        balance: number
        transactionCount: number
    }
    children: ProjectWithStats[]
}

// ─── Validation ──────────────────────────────────────────────

const BusinessProjectSchema = z.object({
    name: z.string().min(2, 'שם הפרויקט חייב להכיל לפחות 2 תווים').max(100, 'שם הפרויקט ארוך מדי'),
    description: z.string().max(500, 'התיאור ארוך מדי').optional().or(z.literal('')),
    color: z.string().optional(),
    status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional(),
    budget: z.number().positive('התקציב חייב להיות חיובי').nullable().optional(),
    startDate: z.date().nullable().optional(),
    endDate: z.date().nullable().optional(),
    clientId: z.string().nullable().optional(),
    parentId: z.string().nullable().optional(),
}).refine(
    (data) => {
        if (data.startDate && data.endDate) {
            return data.endDate >= data.startDate
        }
        return true
    },
    { message: 'תאריך סיום חייב להיות אחרי תאריך התחלה', path: ['endDate'] }
)

// ─── Queries ─────────────────────────────────────────────────

export async function getBusinessProjects() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const projects = await db.project.findMany({
            where: {
                userId,
                scope: 'BUSINESS',
                parentId: null, // Only top-level projects
            },
            include: {
                stages: { orderBy: { createdAt: 'asc' } },
                client: {
                    select: { id: true, name: true }
                },
                incomes: {
                    select: { amount: true }
                },
                expenses: {
                    select: { amount: true }
                },
                children: {
                    include: {
                        stages: { orderBy: { createdAt: 'asc' } },
                client: {
                            select: { id: true, name: true }
                        },
                        incomes: {
                            select: { amount: true }
                        },
                        expenses: {
                            select: { amount: true }
                        },
                    },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const projectsWithStats: ProjectWithStats[] = projects.map(project => {
            const childrenWithStats = project.children.map(child => {
                const childIncome = child.incomes.reduce((sum, item) => sum + item.amount, 0)
                const childExpenses = child.expenses.reduce((sum, item) => sum + item.amount, 0)
                const { incomes, expenses, client, ...childData } = child
                return {
                    ...childData,
                    clientName: client?.name || null,
                    stats: {
                        totalIncome: childIncome,
                        totalExpenses: childExpenses,
                        balance: childIncome - childExpenses,
                        transactionCount: incomes.length + expenses.length,
                    },
                    children: [] as ProjectWithStats[],
                }
            })

            const directIncome = project.incomes.reduce((sum, item) => sum + item.amount, 0)
            const directExpenses = project.expenses.reduce((sum, item) => sum + item.amount, 0)
            const totalChildIncome = childrenWithStats.reduce((sum, c) => sum + c.stats.totalIncome, 0)
            const totalChildExpenses = childrenWithStats.reduce((sum, c) => sum + c.stats.totalExpenses, 0)
            const totalIncome = directIncome + totalChildIncome
            const totalExpenses = directExpenses + totalChildExpenses

            const { incomes, expenses, client, children, ...projectData } = project
            return {
                ...projectData,
                clientName: client?.name || null,
                stats: {
                    totalIncome,
                    totalExpenses,
                    balance: totalIncome - totalExpenses,
                    transactionCount: incomes.length + expenses.length + childrenWithStats.reduce((sum, c) => sum + c.stats.transactionCount, 0),
                },
                children: childrenWithStats,
            }
        })

        return { success: true, data: projectsWithStats }
    } catch (error) {
        console.error('Error fetching business projects:', error)
        return { success: false, error: 'Failed to fetch business projects' }
    }
}

export async function getBusinessProjectDetails(projectId: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const project = await db.project.findUnique({
            where: { id: projectId },
            include: {
                stages: { orderBy: { createdAt: 'asc' } },
                client: {
                    select: { id: true, name: true, email: true, phone: true }
                },
                incomes: {
                    orderBy: { date: 'desc' },
                    include: {
                        budget: {
                            select: { month: true, year: true }
                        }
                    }
                },
                expenses: {
                    orderBy: { date: 'desc' },
                    include: {
                        budget: {
                            select: { month: true, year: true }
                        }
                    }
                },
                children: {
                    include: {
                        stages: { orderBy: { createdAt: 'asc' } },
                client: {
                            select: { id: true, name: true }
                        },
                        incomes: {
                            select: { amount: true }
                        },
                        expenses: {
                            select: { amount: true }
                        },
                    },
                    orderBy: { name: 'asc' }
                },
                parent: {
                    select: { id: true, name: true }
                }
            }
        })

        if (!project) {
            return { success: false, error: 'Project not found' }
        }

        return { success: true, data: project }
    } catch (error) {
        console.error('Error fetching business project details:', error)
        return { success: false, error: 'Failed to fetch project details' }
    }
}

// ─── Mutations ───────────────────────────────────────────────

export async function createBusinessProject(data: BusinessProjectFormData) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const validated = BusinessProjectSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.errors[0].message }
        }

        const db = await authenticatedPrisma(userId)

        // Validate parent exists and belongs to same user + is BUSINESS scope
        if (data.parentId) {
            const parent = await db.project.findFirst({
                where: { id: data.parentId, userId, scope: 'BUSINESS', parentId: null },
            })
            if (!parent) {
                return { success: false, error: 'פרויקט אב לא נמצא או שאינו פרויקט ראשי' }
            }
        }

        // Validate client exists and belongs to same user
        if (data.clientId) {
            const client = await db.client.findFirst({
                where: { id: data.clientId, userId }
            })
            if (!client) {
                return { success: false, error: 'לקוח לא נמצא' }
            }
        }

        const project = await db.project.create({
            data: {
                userId,
                name: data.name,
                description: data.description || null,
                color: data.color || null,
                scope: 'BUSINESS',
                status: data.status || 'ACTIVE',
                budget: data.budget || null,
                startDate: data.startDate || null,
                endDate: data.endDate || null,
                clientId: data.clientId || null,
                parentId: data.parentId || null,
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: project }
    } catch (error: any) {
        console.error('Error creating business project:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'פרויקט עם שם זה כבר קיים' }
        }
        return { success: false, error: 'Failed to create project' }
    }
}

export async function updateBusinessProject(id: string, data: BusinessProjectFormData) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const validated = BusinessProjectSchema.safeParse(data)
        if (!validated.success) {
            return { success: false, error: validated.error.errors[0].message }
        }

        const db = await authenticatedPrisma(userId)

        // Prevent setting self as parent
        if (data.parentId === id) {
            return { success: false, error: 'פרויקט לא יכול להיות אב של עצמו' }
        }

        // Prevent setting a child as parent (circular reference)
        if (data.parentId) {
            const potentialParent = await db.project.findFirst({
                where: { id: data.parentId, userId, scope: 'BUSINESS', parentId: null },
            })
            if (!potentialParent) {
                return { success: false, error: 'פרויקט אב לא נמצא או שאינו פרויקט ראשי' }
            }
            if (potentialParent.id === id) {
                return { success: false, error: 'פרויקט לא יכול להיות אב של עצמו' }
            }
        }

        const project = await db.project.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description || null,
                color: data.color || null,
                status: data.status || 'ACTIVE',
                budget: data.budget || null,
                startDate: data.startDate || null,
                endDate: data.endDate || null,
                clientId: data.clientId || null,
                parentId: data.parentId || null,
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: project }
    } catch (error: any) {
        console.error('Error updating business project:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'פרויקט עם שם זה כבר קיים' }
        }
        return { success: false, error: 'Failed to update project' }
    }
}

export async function deleteBusinessProject(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        // Check for children
        const childCount = await db.project.count({
            where: { parentId: id }
        })
        if (childCount > 0) {
            return { success: false, error: `לא ניתן למחוק פרויקט עם ${childCount} תתי-פרויקטים. מחק אותם קודם.` }
        }

        // Check for linked transactions
        const incomeCount = await db.income.count({ where: { projectId: id } })
        const expenseCount = await db.expense.count({ where: { projectId: id } })

        if (incomeCount > 0 || expenseCount > 0) {
            // Unlink transactions before deleting (don't delete them)
            await db.income.updateMany({
                where: { projectId: id },
                data: { projectId: null }
            })
            await db.expense.updateMany({
                where: { projectId: id },
                data: { projectId: null }
            })
        }

        await db.project.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting business project:', error)
        return { success: false, error: 'Failed to delete project' }
    }
}

// ─── Helpers ─────────────────────────────────────────────────

export async function getBusinessProjectsList() {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const projects = await db.project.findMany({
            where: {
                userId,
                scope: 'BUSINESS',
            },
            select: {
                id: true,
                name: true,
                parentId: true,
                clientId: true,
                color: true,
                status: true,
            },
            orderBy: { name: 'asc' }
        })

        return { success: true, data: projects }
    } catch (error) {
        console.error('Error fetching business projects list:', error)
        return { success: false, error: 'Failed to fetch projects list' }
    }
}
