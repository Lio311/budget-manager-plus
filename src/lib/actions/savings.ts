'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'
import { startOfMonth, endOfMonth, addMonths, isBefore, isAfter } from 'date-fns'

// Helper function to create recurring savings
async function createRecurringSavings(
    data: {
        category: string
        description: string
        monthlyDeposit: number
        goal?: string
        recurringStartDate: Date
        recurringEndDate: Date
    },
    userId: string,
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    const savings = []

    // Preserve the day of month from start date
    const dayOfMonth = data.recurringStartDate.getDate()
    let currentDate = new Date(data.recurringStartDate)
    const endDate = endOfMonth(data.recurringEndDate)
    const sourceId = `recurring-saving-${Date.now()}`

    // 1. Identify all months needed
    const dates: Date[] = []
    while (isBefore(currentDate, endDate) || currentDate.getTime() === startOfMonth(endDate).getTime()) {
        // Handle invalid days (e.g., Feb 31 -> Feb 28/29)
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
        const dayToUse = Math.min(dayOfMonth, lastDayOfMonth)

        dates.push(new Date(year, month, dayToUse))
        currentDate = addMonths(currentDate, 1)
    }

    if (dates.length === 0) return []

    // 2. Fetch existing budgets for these months
    // We need to query by (month, year) pairs. Prisma doesn't support tuple 'IN' efficiently in all DBs,
    // but we can just fetch all budgets for the years involved and filter in memory, or use OR conditions.
    // Given the range isn't likely huge, fetching by years is safe.
    const years = Array.from(new Set(dates.map(d => d.getFullYear())))

    // Fetch user once to be sure (though userId is passed)
    // Actually we can just query budgets directly by userId
    // Fetch user once to be sure (though userId is passed)
    // Actually we can just query budgets directly by userId
    const existingBudgets = await prisma.budget.findMany({
        where: {
            userId: userId,
            year: { in: years },
            type: type
        } as any
    })

    // 3. Ensure budgets exist for all dates
    const budgetMap = new Map<string, string>() // "month-year" -> budgetId
    existingBudgets.forEach(b => budgetMap.set(`${b.month}-${b.year}`, b.id))

    const budgetsToCreate = []
    for (const date of dates) {
        const m = date.getMonth() + 1
        const y = date.getFullYear()
        if (!budgetMap.has(`${m}-${y}`)) {
            budgetsToCreate.push({
                userId,
                month: m,
                year: y,
                currency: '₪',
                type: type
            } as any)
        }
    }

    if (budgetsToCreate.length > 0) {
        // createMany is not supported nicely for returning IDs in all providers (Postgres does supports it but Prisma `createMany` doesn't return records).
        // So we might have to use transaction or individual creates if we need IDs.
        // But since we need to link savings to budgetIds, we need the IDs.
        // Loop create is okay for budgets as there are usually few (missing ones),
        // or we create them and then re-fetch.
        // Re-fetching is safer.
        await prisma.budget.createMany({
            data: budgetsToCreate,
            skipDuplicates: true
        })

        // Re-fetch to get all IDs including new ones
        const allBudgets = await prisma.budget.findMany({
            where: {
                userId: userId,
                year: { in: years },
                type: type
            } as any
        })
        allBudgets.forEach(b => budgetMap.set(`${b.month}-${b.year}`, b.id))
    }

    // 4. Create Savings in Bulk
    const savingsData = dates.map(date => {
        const m = date.getMonth() + 1
        const y = date.getFullYear()
        const budgetId = budgetMap.get(`${m}-${y}`)

        if (!budgetId) return null // Should not happen

        return {
            budgetId,
            category: data.category,
            name: data.description || 'חסכון',
            monthlyDeposit: data.monthlyDeposit,
            notes: data.goal,
            targetDate: date,
            createdAt: date, // Set creation date to the target month for sorting
            isRecurring: true,
            recurringSourceId: sourceId,
            recurringStartDate: data.recurringStartDate,
            recurringEndDate: data.recurringEndDate
        }
    }).filter(s => s !== null)

    if (savingsData.length > 0) {
        await prisma.saving.createMany({
            data: savingsData as any // Type assertion needed sometimes if optional fields differ
        })
    }

    // Return something meaningful? The original returned created objects.
    // createMany doesn't return objects. We can return count or just empty array. 
    // The calling function expects 'data: savings' but mainly for the UI update.
    // Since we revalidatePath, exact return might not matter as much, but let's return [] or fetch one to trigger success.
    return []
}

export async function getSavings(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const budget = await getCurrentBudget(month, year, type)

        const savings = await prisma.saving.findMany({
            where: { budgetId: budget.id },
            orderBy: { createdAt: 'desc' }
        })

        return { success: true, data: savings }
    } catch (error) {
        console.error('Error fetching savings:', error)
        return { success: false, error: 'Failed to fetch savings' }
    }
}

export async function addSaving(
    month: number,
    year: number,
    data: {
        category: string
        description: string
        monthlyDeposit: number
        goal?: string
        date: Date
        isRecurring?: boolean
        recurringStartDate?: Date
        recurringEndDate?: Date
    },
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const budget = await getCurrentBudget(month, year, type)

        // Handle recurring savings
        if (data.isRecurring && data.recurringEndDate) {
            const startDate = data.recurringStartDate || data.date || new Date()
            const savings = await createRecurringSavings(
                {
                    category: data.category,
                    description: data.description,
                    monthlyDeposit: data.monthlyDeposit,
                    goal: data.goal,
                    recurringStartDate: startDate,
                    recurringEndDate: data.recurringEndDate
                },
                budget.userId,
                type
            )

            revalidatePath('/dashboard')
            return { success: true, data: savings }
        }

        const saving = await prisma.saving.create({
            data: {
                budgetId: budget.id,
                category: data.category,
                name: data.description || 'חסכון',
                monthlyDeposit: data.monthlyDeposit,
                notes: data.goal,
                targetDate: data.date ? new Date(data.date) : new Date()
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: saving }
    } catch (error) {
        console.error('Error adding saving:', error)
        return { success: false, error: 'Failed to add saving' }
    }
}

export async function updateSaving(
    id: string,
    data: {
        category?: string
        description?: string
        monthlyDeposit?: number
        goal?: string
        date?: Date
    }
) {
    try {
        const saving = await prisma.saving.update({
            where: { id },
            data: {
                ...(data.category && { type: data.category, category: data.category }),
                ...(data.description && { description: data.description }),
                ...(data.monthlyDeposit && { monthlyDeposit: data.monthlyDeposit }),
                ...(data.goal && { goal: data.goal }),
                ...(data.date && { targetDate: data.date })
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: saving }
    } catch (error) {
        console.error('Error updating saving:', error)
        return { success: false, error: 'Failed to update saving' }
    }
}

export async function deleteSaving(id: string) {
    try {
        await prisma.saving.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting saving:', error)
        return { success: false, error: 'Failed to delete saving' }
    }
}
