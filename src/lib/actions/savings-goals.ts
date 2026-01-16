'use server'

import { auth } from '@clerk/nextjs/server'
import { authenticatedPrisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { convertToILS } from '@/lib/currency'

export interface CategoryGoal {
    category: string
    currentAmount: number
    targetAmount: number
    currency: string
    progress: number
    remainingAmount: number
    savingsCount: number
    monthlyTotal: number
}

export interface SavingsGoalsData {
    goals: CategoryGoal[]
    stats: {
        totalCategories: number
        totalSavedILS: number
        totalTargetILS: number
        overallProgress: number
    }
}

export async function getSavingsGoals(
    month: number,
    year: number,
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)
        const budget = await getCurrentBudget(month, year, '₪', type)

        // Fetch ALL savings for this user (not just current month)
        // We need all savings to calculate cumulative deposits
        const savings = await db.saving.findMany({
            where: {
                budget: {
                    userId,
                    type
                }
            },
            orderBy: { category: 'asc' }
        })

        // Fetch category goals
        const categoryGoals = await db.savingCategoryGoal.findMany({
            where: {
                budgetId: budget.id
            }
        })

        // Create a map of category -> targetAmount
        const targetMap = new Map<string, number>()
        categoryGoals.forEach(goal => {
            targetMap.set(goal.category, goal.targetAmount)
        })

        // Group savings by category and calculate totals
        const categoryMap = new Map<string, {
            savings: typeof savings
            totalMonthly: number
            totalCurrent: number
        }>()

        savings.forEach(saving => {
            if (!categoryMap.has(saving.category)) {
                categoryMap.set(saving.category, {
                    savings: [],
                    totalMonthly: 0,
                    totalCurrent: 0
                })
            }

            const categoryData = categoryMap.get(saving.category)!
            categoryData.savings.push(saving)
            categoryData.totalMonthly += saving.monthlyDeposit || 0

            // Calculate accumulated amount for this saving
            const createdDate = new Date(saving.createdAt)
            const now = new Date()

            // Calculate how many months have passed since creation
            let monthsPassed = (now.getFullYear() - createdDate.getFullYear()) * 12 +
                (now.getMonth() - createdDate.getMonth()) + 1 // +1 to include current month

            // If this is a recurring saving with an end date, limit the months
            if (saving.isRecurring && saving.recurringEndDate) {
                const endDate = new Date(saving.recurringEndDate)
                const maxMonths = (endDate.getFullYear() - createdDate.getFullYear()) * 12 +
                    (endDate.getMonth() - createdDate.getMonth()) + 1

                // Use the minimum between months passed and max months
                monthsPassed = Math.min(monthsPassed, maxMonths)
            }

            const monthlyDeposit = saving.monthlyDeposit || 0
            const accumulated = monthlyDeposit * Math.max(0, monthsPassed)
            categoryData.totalCurrent += accumulated
        })

        // Build category goals array
        const goals: CategoryGoal[] = []

        for (const [category, data] of categoryMap.entries()) {
            const targetAmount = targetMap.get(category) || 0
            const currentAmount = data.totalCurrent
            const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
            const remainingAmount = Math.max(0, targetAmount - currentAmount)

            goals.push({
                category,
                currentAmount,
                targetAmount,
                currency: 'ILS', // We'll convert everything to ILS for now
                progress: Math.min(100, progress),
                remainingAmount,
                savingsCount: data.savings.length,
                monthlyTotal: data.totalMonthly
            })
        }

        // Sort by category name
        goals.sort((a, b) => a.category.localeCompare(b.category, 'he'))

        // Calculate aggregate statistics
        let totalSavedILS = 0
        let totalTargetILS = 0

        for (const goal of goals) {
            totalSavedILS += goal.currentAmount
            totalTargetILS += goal.targetAmount
        }

        const overallProgress = totalTargetILS > 0 ? (totalSavedILS / totalTargetILS) * 100 : 0

        const stats = {
            totalCategories: goals.length,
            totalSavedILS,
            totalTargetILS,
            overallProgress: Math.min(100, overallProgress)
        }

        return { success: true, data: { goals, stats } }
    } catch (error) {
        console.error('Error fetching savings goals:', error)
        return { success: false, error: 'Failed to fetch savings goals' }
    }
}

export async function updateCategoryGoalTarget(
    category: string,
    targetAmount: number,
    month: number,
    year: number,
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)
        const budget = await getCurrentBudget(month, year, '₪', type)

        // Upsert category goal
        await db.savingCategoryGoal.upsert({
            where: {
                budgetId_category: {
                    budgetId: budget.id,
                    category
                }
            },
            update: {
                targetAmount
            },
            create: {
                budgetId: budget.id,
                category,
                targetAmount
            }
        })

        return { success: true }
    } catch (error) {
        console.error('Error updating category goal target:', error)
        return { success: false, error: 'Failed to update target' }
    }
}
