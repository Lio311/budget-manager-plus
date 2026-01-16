'use server'

import { auth } from '@clerk/nextjs/server'
import { authenticatedPrisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { convertToILS } from '@/lib/currency'

export interface SavingGoal {
    id: string
    category: string
    name: string
    notes: string | null
    targetAmount: number
    currentAmount: number
    monthlyDeposit: number | null
    currency: string
    targetDate: Date | null
    progress: number // Percentage
    remainingAmount: number
}

export interface SavingsGoalsData {
    goals: SavingGoal[]
    stats: {
        totalGoals: number
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

        // Fetch all savings with notes (goals) defined
        const savings = await db.saving.findMany({
            where: {
                budgetId: budget.id,
                notes: { not: null }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calculate progress for each goal
        const goals: SavingGoal[] = savings.map(saving => {
            const targetAmount = saving.targetAmount || 0
            const currentAmount = saving.currentAmount || 0
            const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
            const remainingAmount = Math.max(0, targetAmount - currentAmount)

            return {
                id: saving.id,
                category: saving.category,
                name: saving.name,
                notes: saving.notes,
                targetAmount,
                currentAmount,
                monthlyDeposit: saving.monthlyDeposit,
                currency: saving.currency,
                targetDate: saving.targetDate,
                progress: Math.min(100, progress),
                remainingAmount
            }
        })

        // Calculate aggregate statistics in ILS
        let totalSavedILS = 0
        let totalTargetILS = 0
        let totalMonthlyDepositILS = 0

        for (const goal of goals) {
            const savedILS = await convertToILS(goal.currentAmount, goal.currency)
            const targetILS = await convertToILS(goal.targetAmount, goal.currency)
            const monthlyILS = await convertToILS(goal.monthlyDeposit || 0, goal.currency)

            totalSavedILS += savedILS
            totalTargetILS += targetILS
            totalMonthlyDepositILS += monthlyILS
        }

        // If no targets are set, use monthly deposits as the "saved" amount for display
        const displaySaved = totalTargetILS > 0 ? totalSavedILS : totalMonthlyDepositILS
        const overallProgress = totalTargetILS > 0 ? (totalSavedILS / totalTargetILS) * 100 : 0

        const stats = {
            totalGoals: goals.length,
            totalSavedILS: displaySaved,
            totalTargetILS,
            overallProgress: Math.min(100, overallProgress)
        }

        return { success: true, data: { goals, stats } }
    } catch (error) {
        console.error('Error fetching savings goals:', error)
        return { success: false, error: 'Failed to fetch savings goals' }
    }
}
