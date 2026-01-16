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

        // Fetch user budget for the requested month to anchor the query
        // But we need ALL records to calculate cumulative totals properly
        const budget = await getCurrentBudget(month, year, '₪', type)

        // 1. Fetch ALL savings (transactions) for this user/type
        // We filter by budget.userId and budget.type via the relation to get all historical data
        const savings = await db.saving.findMany({
            where: {
                budget: {
                    userId,
                    type
                }
            },
            include: {
                budget: true
            },
            orderBy: { createdAt: 'asc' }
        })

        // 2. Fetch Latest Targets (Find all goals and map latest)
        // We want to persist targets across months. If no target for THIS month, use the most recent one.
        const allCategoryGoals = await db.savingCategoryGoal.findMany({
            where: {
                budget: {
                    userId,
                    type
                }
            },
            include: {
                budget: true
            }
        })

        const targetMap = new Map<string, number>()

        // Sort goals by date descending (Newest budget first)
        allCategoryGoals.sort((a, b) => {
            const dateA = a.budget.year * 12 + a.budget.month
            const dateB = b.budget.year * 12 + b.budget.month
            return dateB - dateA
        })

        // Fill map (first entry is newest, so it wins)
        allCategoryGoals.forEach(goal => {
            if (!targetMap.has(goal.category)) {
                targetMap.set(goal.category, goal.targetAmount)
            }
        })

        // 3. Group savings and Calculate Totals (Correct logic: Simply Sum Amounts)
        const categoryMap = new Map<string, {
            savingsCount: number
            totalMonthly: number
            totalCurrent: number
        }>()

        const requestedDateStart = new Date(year, month - 1, 1) // Start of requested month
        const requestedDateEnd = new Date(year, month, 0, 23, 59, 59, 999) // End of requested month

        savings.forEach(saving => {
            if (!categoryMap.has(saving.category)) {
                categoryMap.set(saving.category, {
                    savingsCount: 0,
                    totalMonthly: 0,
                    totalCurrent: 0
                })
            }

            const categoryData = categoryMap.get(saving.category)!
            categoryData.savingsCount++

            // Use targetDate if available, else createdAt.
            // targetDate represents the effective date of the transaction.
            let date = saving.targetDate
            if (!date) {
                // Fallback to budget month/year if no specific date
                if (saving.budget) {
                    date = new Date(saving.budget.year, saving.budget.month - 1, 1)
                } else {
                    // Should technically not happen if filtered by budget, but for safety
                    date = new Date()
                }
            }

            const amount = saving.monthlyDeposit || 0

            // Current Total: Sum all savings up to end of requested month
            // (So viewing past months shows historical status)
            if (date <= requestedDateEnd) {
                categoryData.totalCurrent += amount
            }

            // Monthly Total: Sum savings ONLY IN requested month
            if (date >= requestedDateStart && date <= requestedDateEnd) {
                categoryData.totalMonthly += amount
            }
        })

        // 4. Build Result
        const goals: CategoryGoal[] = []

        // Merge categories from Savings and from Targets (in case we have a target but no savings yet)
        const allCategories = new Set([...categoryMap.keys(), ...targetMap.keys()])

        for (const category of allCategories) {
            const data = categoryMap.get(category) || { totalCurrent: 0, totalMonthly: 0, savingsCount: 0 }
            const targetAmount = targetMap.get(category) || 0

            const currentAmount = data.totalCurrent
            const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
            const remainingAmount = Math.max(0, targetAmount - currentAmount)

            goals.push({
                category,
                currentAmount,
                targetAmount,
                currency: 'ILS',
                progress: Math.min(100, progress),
                remainingAmount,
                savingsCount: data.savingsCount,
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
