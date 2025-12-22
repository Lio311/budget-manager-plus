'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export async function getIncomes(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        const incomes = await prisma.income.findMany({
            where: { budgetId: budget.id },
            orderBy: { date: 'desc' }
        })

        return { success: true, data: incomes }
    } catch (error) {
        console.error('Error fetching incomes:', error)
        return { success: false, error: 'Failed to fetch incomes' }
    }
}

export async function addIncome(
    month: number,
    year: number,
    data: {
        source: string
        category: string
        amount: number
        date?: string
        isRecurring?: boolean
        recurringStartDate?: string
        recurringEndDate?: string
    }
) {
    try {
        const budget = await getCurrentBudget(month, year)

        const income = await prisma.income.create({
            data: {
                budgetId: budget.id,
                source: data.source,
                category: data.category,
                amount: data.amount,
                date: data.date ? new Date(data.date) : null,
                isRecurring: data.isRecurring || false,
                recurringStartDate: data.recurringStartDate ? new Date(data.recurringStartDate) : (data.date ? new Date(data.date) : new Date()),
                recurringEndDate: data.recurringEndDate ? new Date(data.recurringEndDate) : null
            }
        })

        // If recurring, create copies for future months
        if (data.isRecurring && data.recurringEndDate) {
            const startDate = data.recurringStartDate || data.date || new Date().toISOString()
            await createRecurringIncomes(income.id, data.source, data.category, data.amount, startDate, data.recurringEndDate)
        }

        revalidatePath('/dashboard')
        return { success: true, data: income }
    } catch (error) {
        console.error('Error adding income:', error)
        return { success: false, error: 'Failed to add income' }
    }
}

async function createRecurringIncomes(
    sourceId: string,
    source: string,
    category: string,
    amount: number,
    startDateStr: string,
    endDateStr: string
) {
    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Extract the day of month from start date
    const dayOfMonth = startDate.getDate()

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

            // Handle invalid days (e.g., Feb 31 -> Feb 28/29)
            const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate()
            const dayToUse = Math.min(dayOfMonth, lastDayOfMonth)

            await prisma.income.create({
                data: {
                    budgetId: budget.id,
                    source,
                    category,
                    amount,
                    date: new Date(currentYear, currentMonth - 1, dayToUse),
                    isRecurring: true,
                    recurringSourceId: sourceId,
                    recurringStartDate: startDate,
                    recurringEndDate: endDate
                }
            })
        } catch (error) {
            console.error(`Error creating recurring income for ${currentMonth}/${currentYear}:`, error)
        }

        if (currentMonth === 12) {
            currentMonth = 1
            currentYear++
        } else {
            currentMonth++
        }
    }
}

export async function cancelRecurringIncome(incomeId: string, fromMonth: number, fromYear: number) {
    try {
        // Get the income to find its recurringSourceId
        const income = await prisma.income.findUnique({
            where: { id: incomeId }
        })

        if (!income || !income.isRecurring) {
            return { success: false, error: 'Income is not recurring' }
        }

        // Find the source ID (either this income or its parent)
        const sourceId = income.recurringSourceId || income.id

        // Delete all future recurring incomes with the same source
        const fromDate = new Date(fromYear, fromMonth - 1, 1)

        await prisma.income.deleteMany({
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
        console.error('Error canceling recurring income:', error)
        return { success: false, error: 'Failed to cancel recurring income' }
    }
}

export async function updateIncome(
    id: string,
    data: {
        source?: string
        category?: string
        amount?: number
        date?: string
    }
) {
    try {
        const income = await prisma.income.update({
            where: { id },
            data: {
                ...(data.source && { source: data.source }),
                ...(data.category && { category: data.category }),
                ...(data.amount && { amount: data.amount }),
                ...(data.date && { date: new Date(data.date) })
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: income }
    } catch (error) {
        console.error('Error updating income:', error)
        return { success: false, error: 'Failed to update income' }
    }
}

export async function deleteIncome(id: string) {
    try {
        await prisma.income.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting income:', error)
        return { success: false, error: 'Failed to delete income' }
    }
}
