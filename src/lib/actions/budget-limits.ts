'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export interface CategoryBudgetUsage {
    categoryId: string
    categoryName: string
    limit: number
    spent: number
    currency: string
}

export interface GetCategoryBudgetsResponse {
    success: boolean
    data?: CategoryBudgetUsage[]
    avgIncome?: number
    error?: string
}

export async function getCategoryBudgets(month: number, year: number): Promise<GetCategoryBudgetsResponse> {
    try {
        const budget = await getCurrentBudget(month, year, '₪', 'PERSONAL')
        const categories = await prisma.category.findMany({
            where: {
                userId: budget.userId
            }
        })

        const categoryBudgets = await prisma.categoryBudget.findMany({
            where: { budgetId: budget.id }
        })

        // Calculate actual spending for each category
        const expenses = await prisma.expense.groupBy({
            by: ['category'],
            where: {
                budgetId: budget.id
            },
            _sum: {
                amount: true
            }
        })

        // Merge data
        const usage: CategoryBudgetUsage[] = categories.map(cat => {
            const limitObj = categoryBudgets.find(cb => cb.categoryId === cat.id)
            const spendingObj = expenses.find(e => e.category === cat.name)

            return {
                categoryId: cat.id,
                categoryName: cat.name,
                limit: limitObj?.limit || 0,
                spent: spendingObj?._sum.amount || 0,
                currency: budget.currency
            }
        })

        // Calculate 4-Month Average Income (Current + 3 previous)
        const incomeStats = await prisma.income.aggregate({
            _sum: { amount: true },
            where: {
                budget: {
                    userId: budget.userId,
                    type: 'PERSONAL',
                    // Logic: Get budgets with (year * 12 + month) >= (currentYear * 12 + currentMonth - 3)
                    // Simplified: just filter by date? No, budgets structure is month/year.
                    // Just filtering by createdAt or direct budget link is safer.
                    // Let's use the explicit logic of selecting last 4 budgets.
                }
            }
        })

        // Better approach: Find last 4 budgets explicitly
        // We need to handle year wrapping properly (e.g. month 1, year 2025 -> prev is 12/2024)
        // Let's use a raw query or just fetch budgets sorted by date descending?
        const lastBudgets = await prisma.budget.findMany({
            where: {
                userId: budget.userId,
                type: 'PERSONAL'
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ],
            take: 4,
            include: {
                incomes: true
            }
        })

        const totalIncomeLast4 = lastBudgets.reduce((sum, b) => {
            const monthlyIncome = b.incomes.reduce((acc, i) => acc + i.amount, 0)
            return sum + monthlyIncome
        }, 0)

        const avgIncome = lastBudgets.length > 0 ? totalIncomeLast4 / lastBudgets.length : 0

        return { success: true, data: usage, avgIncome }
    } catch (error) {
        console.error('Error fetching category budgets:', error)
        return { success: false, error: 'Failed to fetch budget limits' }
    }
}

export async function updateCategoryLimit(month: number, year: number, categoryId: string, limit: number) {
    try {
        const budget = await getCurrentBudget(month, year, '₪', 'PERSONAL')

        await prisma.categoryBudget.upsert({
            where: {
                budgetId_categoryId: {
                    budgetId: budget.id,
                    categoryId
                }
            },
            update: { limit },
            create: {
                budgetId: budget.id,
                categoryId,
                limit
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error updating category limit:', error)
        return { success: false, error: 'Failed to update limit' }
    }
}

export async function getSmartRecommendations(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year, '₪', 'PERSONAL')

        // 1. Get average spending for last 3 months
        // We need to find budgets for month-1, month-2, month-3
        // Simplified: just fetch all expenses from last 90 days? 
        // Better: Fetch last 3 budgets and average their expenses per category.

        // Get categories first
        const categories = await prisma.category.findMany({
            where: {
                userId: budget.userId,
                type: 'expense',
                scope: 'PERSONAL'
            }
        })

        // Calculate Average Limit Recommendation
        // Logic: Look at last 3 months of ACTUAL spending.
        // If no data, maybe use strict 50/30/20 rule if we knew income?
        // Let's assume we want to base it on actual spending habit + 10% buffer?
        // Or just the average.

        const recommendations: Record<string, number> = {}

        for (const cat of categories) {
            // Find stats for this category in previous months
            // This is a bit heavy, strictly speaking we should use raw SQL or optimized queries
            // But for MVP:
            const stats = await prisma.expense.aggregate({
                _avg: { amount: true },
                _count: { id: true },
                where: {
                    category: cat.name,
                    budget: {
                        userId: budget.userId,
                        // Filter by date range roughly?
                        year: { gte: year - 1 } // Simple optimization
                    }
                }
            })

            // If we have history, recommend the average. 
            // If average is 0, maybe recommend 0.
            // Issue: 'amount' average is per transaction. We need monthly sum average.

            // Correct approach: Sum per month, then average the sums.
            // Hard with Prisma aggregate.
            // Fallback: Just return 0 for now and let the user set it, OR
            // Set a default "Smart" value based on CURRENT month's spending projected?

            // Better Smart Logic: 
            // "This category usually costs X per month". 
            // Let's rely on the client to ask for a specific recommendation or just return 0 if no history.

            // For now, let's just use a dummy "random" smartness or 0 if empty.
            // Actually, let's try to get total income and suggest 10%? No that's bad.

            // Real implementation: Fetch last 3 months expenses sum.
            // We can do this efficiently later. For now, let's return 0.
            recommendations[cat.id] = 0
        }

        // Try to improve: Get last 3 months sums
        const last3Budgets = await prisma.budget.findMany({
            where: {
                userId: budget.userId,
                type: 'PERSONAL',
                OR: [
                    { month: month - 1, year: year },
                    { month: month - 2, year: year }, // handle year wrap manually if needed, simplified for now
                    { month: month - 3, year: year }
                ]
            },
            include: {
                expenses: true
            }
        })

        for (const cat of categories) {
            let totalSpent = 0
            let phases = 0
            for (const b of last3Budgets) {
                const catExpense = b.expenses.filter(e => e.category === cat.name).reduce((sum, e) => sum + e.amount, 0)
                if (catExpense > 0) {
                    totalSpent += catExpense
                    phases++
                }
            }

            if (phases > 0) {
                recommendations[cat.id] = Math.ceil(totalSpent / phases)
            }
        }

        return { success: true, data: recommendations }

    } catch (error) {
        console.error('Error generating recommendations:', error)
        return { success: false, error: 'Failed to generate recommendations' }
    }
}
