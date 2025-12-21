'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export async function getExpenses(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        const expenses = await prisma.expense.findMany({
            where: { budgetId: budget.id },
            orderBy: { date: 'desc' }
        })

        return { success: true, data: expenses }
    } catch (error) {
        console.error('Error fetching expenses:', error)
        return { success: false, error: 'Failed to fetch expenses' }
    }
}

export async function addExpense(
    month: number,
    year: number,
    data: {
        category: string
        description: string
        amount: number
        date: string
        isRecurring?: boolean
        recurringStartDate?: string
        recurringEndDate?: string
    }
) {
    try {
        const budget = await getCurrentBudget(month, year)

        const expense = await prisma.expense.create({
            data: {
                budgetId: budget.id,
                category: data.category,
                description: data.description,
                amount: data.amount,
                date: new Date(data.date),
                isRecurring: data.isRecurring || false,
                recurringStartDate: data.recurringStartDate ? new Date(data.recurringStartDate) : null,
                recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : null
            }
        })

        // If recurring, create copies for future months
        if (data.isRecurring && data.recurringStartDate && data.recurringEndDate) {
            await createRecurringExpenses(
                expense.id,
                data.category,
                data.description,
                data.amount,
                data.recurringStartDate,
                data.recurringEndDate
            )
        }

        revalidatePath('/dashboard')
        return { success: true, data: expense }
    } catch (error) {
        console.error('Error adding expense:', error)
        return { success: false, error: 'Failed to add expense' }
    }
}

async function createRecurringExpenses(
    sourceId: string,
    category: string,
    description: string,
    amount: number,
    startDateStr: string,
    endDateStr: string
) {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    const startMonth = startDate.getMonth() + 1
    const startYear = startDate.getFullYear()
    const endMonth = endDate.getMonth() + 1
    const endYear = endDate.getFullYear()

    let currentMonth = startMonth
    let currentYear = startYear

    // Skip the first month (already created)
    if (currentMonth === 12) {
        currentMonth = 1
        currentYear++
    } else {
        currentMonth++
    }

    while (
        currentYear < endYear ||
        (currentYear === endYear && currentMonth <= endMonth)
    ) {
        try {
            const budget = await getCurrentBudget(currentMonth, currentYear)

            await prisma.expense.create({
                data: {
                    budgetId: budget.id,
                    category,
                    description,
                    amount,
                    date: new Date(currentYear, currentMonth - 1, 1),
                    isRecurring: true,
                    recurringSourceId: sourceId,
                    recurringStartDate: startDate,
                    recurringEndDate: endDate
                }
            })
        } catch (error) {
            console.error(`Error creating recurring expense for ${currentMonth}/${currentYear}:`, error)
        }

        if (currentMonth === 12) {
            currentMonth = 1
            currentYear++
        } else {
            currentMonth++
        }
    }
}

export async function cancelRecurringExpense(expenseId: string, fromMonth: number, fromYear: number) {
    try {
        // Get the expense to find its recurringSourceId
        const expense = await prisma.expense.findUnique({
            where: { id: expenseId }
        })

        if (!expense || !expense.isRecurring) {
            return { success: false, error: 'Expense is not recurring' }
        }

        // Find the source ID (either this expense or its parent)
        const sourceId = expense.recurringSourceId || expense.id

        // Delete all future recurring expenses with the same source
        const fromDate = new Date(fromYear, fromMonth - 1, 1)

        await prisma.expense.deleteMany({
            where: {
                OR: [
                    { id: sourceId },
                    { recurringSourceId: sourceId }
                ],
                date: {
                    gte: fromDate
                }
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error canceling recurring expense:', error)
        return { success: false, error: 'Failed to cancel recurring expense' }
    }
}

export async function deleteExpense(id: string) {
    try {
        await prisma.expense.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting expense:', error)
        return { success: false, error: 'Failed to delete expense' }
    }
}
