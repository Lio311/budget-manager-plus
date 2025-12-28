'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'
import { startOfMonth, endOfMonth, addMonths, isBefore, isAfter } from 'date-fns'
import { convertToILS } from '@/lib/currency'

// Helper function to create recurring savings
async function createRecurringSavings(
    data: {
        category: string
        description: string
        monthlyDeposit: number
        currency: string
        goal?: string
        recurringStartDate: Date
        recurringEndDate: Date
        paymentMethod?: string
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
    const years = Array.from(new Set(dates.map(d => d.getFullYear())))
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
            currency: data.currency,
            notes: data.goal,
            targetDate: date,
            createdAt: date, // Set creation date to the target month for sorting
            isRecurring: true,
            recurringSourceId: sourceId,
            recurringStartDate: data.recurringStartDate,
            recurringEndDate: data.recurringEndDate,
            paymentMethod: data.paymentMethod
        }
    }).filter(s => s !== null)

    if (savingsData.length > 0) {
        await prisma.saving.createMany({
            data: savingsData as any // Type assertion needed sometimes if optional fields differ
        })
    }

    return []
}

export async function getSavings(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const budget = await getCurrentBudget(month, year, '₪', type)

        const savings = await prisma.saving.findMany({
            where: { budgetId: budget.id },
            orderBy: { createdAt: 'desc' }
        })

        // Calculate stats in ILS
        let totalMonthlyDepositILS = 0
        for (const saving of savings) {
            const amountILS = await convertToILS(saving.monthlyDeposit || 0, saving.currency)
            totalMonthlyDepositILS += amountILS
        }

        const stats = {
            totalMonthlyDepositILS,
            count: savings.length
        }

        return { success: true, data: { savings, stats } }
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
        currency: string
        goal?: string
        date: Date
        isRecurring?: boolean
        recurringStartDate?: Date
        recurringEndDate?: Date
        paymentMethod?: string
    },
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const budget = await getCurrentBudget(month, year, '₪', type)

        // Handle recurring savings
        if (data.isRecurring && data.recurringEndDate) {
            const startDate = data.recurringStartDate || data.date || new Date()
            const savings = await createRecurringSavings(
                {
                    category: data.category,
                    description: data.description,
                    monthlyDeposit: data.monthlyDeposit,
                    currency: data.currency,
                    goal: data.goal,
                    recurringStartDate: startDate,
                    recurringEndDate: data.recurringEndDate,
                    paymentMethod: data.paymentMethod
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
                currency: data.currency,
                notes: data.goal,
                targetDate: data.date ? new Date(data.date) : new Date(),
                paymentMethod: data.paymentMethod
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
        currency?: string
        goal?: string
        date?: Date
        paymentMethod?: string
    },
    mode: 'SINGLE' | 'FUTURE' = 'SINGLE'
) {
    try {
        if (mode === 'SINGLE') {
            const saving = await prisma.saving.update({
                where: { id },
                data: {
                    ...(data.category && { category: data.category }),
                    ...(data.description && { name: data.description }),
                    ...(data.monthlyDeposit && { monthlyDeposit: data.monthlyDeposit }),
                    ...(data.currency && { currency: data.currency }),
                    ...(data.goal && { notes: data.goal }),
                    ...(data.date && { targetDate: data.date }),
                    ...(data.paymentMethod && { paymentMethod: data.paymentMethod })
                }
            })
            revalidatePath('/dashboard')
            return { success: true, data: saving }
        } else {
            // FUTURE Mode
            const currentSaving = await prisma.saving.findUnique({ where: { id } })
            if (!currentSaving) return { success: false, error: 'Saving not found' }

            const sourceId = currentSaving.recurringSourceId || currentSaving.id
            const fromDate = currentSaving.targetDate || new Date()

            const updateResult = await prisma.saving.updateMany({
                where: {
                    OR: [
                        { id: sourceId },
                        { recurringSourceId: sourceId }
                    ],
                    targetDate: {
                        gte: fromDate
                    }
                },
                data: {
                    ...(data.category && { category: data.category }),
                    ...(data.description && { name: data.description }),
                    ...(data.monthlyDeposit && { monthlyDeposit: data.monthlyDeposit }),
                    ...(data.currency && { currency: data.currency }),
                    ...(data.goal && { notes: data.goal }),
                    // Exclude targetDate to prevent collapsing recurring dates to a single date
                    ...(data.paymentMethod && { paymentMethod: data.paymentMethod })
                }
            })
            revalidatePath('/dashboard')
            return { success: true, count: updateResult.count }
        }
    } catch (error) {
        console.error('Error updating saving:', error)
        return { success: false, error: 'Failed to update saving' }
    }
}

export async function deleteSaving(id: string, mode: 'SINGLE' | 'FUTURE' = 'SINGLE') {
    try {
        if (mode === 'SINGLE') {
            await prisma.saving.delete({
                where: { id }
            })
        } else {
            // FUTURE Mode
            const currentSaving = await prisma.saving.findUnique({ where: { id } })
            if (!currentSaving) return { success: false, error: 'Saving not found' }

            const sourceId = currentSaving.recurringSourceId || currentSaving.id
            const fromDate = currentSaving.targetDate || new Date()

            await prisma.saving.deleteMany({
                where: {
                    OR: [
                        { id: sourceId },
                        { recurringSourceId: sourceId }
                    ],
                    targetDate: {
                        gte: fromDate
                    }
                }
            })
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting saving:', error)
        return { success: false, error: 'Failed to delete saving' }
    }
}
