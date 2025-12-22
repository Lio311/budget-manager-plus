'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

export async function getDebts(month: number, year: number) {
    try {
        const budget = await getCurrentBudget(month, year)

        const debts = await prisma.debt.findMany({
            where: { budgetId: budget.id },
            orderBy: { dueDay: 'asc' }
        })

        return { success: true, data: debts }
    } catch (error) {
        console.error('Error fetching debts:', error)
        return { success: false, error: 'Failed to fetch debts' }
    }
}

// Helper function to create recurring debts
async function createRecurringDebts(
    budgetId: string,
    data: {
        creditor: string
        totalAmount: number
        monthlyPayment: number
        dueDay: number
        recurringStartDate: Date
        recurringEndDate: Date
    },
    userId: string
) {
    const recurringSourceId = `recurring_${Date.now()}`
    const debts = []

    const startDate = new Date(data.recurringStartDate)
    const endDate = new Date(data.recurringEndDate)

    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
        const month = currentDate.getMonth() + 1
        const year = currentDate.getFullYear()

        // Get or create budget for this month
        const { getCurrentBudget } = await import('./budget')
        const monthBudget = await getCurrentBudget(month, year)

        debts.push({
            budgetId: monthBudget.id,
            creditor: data.creditor,
            totalAmount: data.totalAmount,
            monthlyPayment: data.monthlyPayment,
            dueDay: data.dueDay,
            isPaid: false,
            isRecurring: true,
            recurringSourceId,
            recurringStartDate: data.recurringStartDate,
            recurringEndDate: data.recurringEndDate
        })

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1)
    }

    // Create all debts
    await prisma.debt.createMany({
        data: debts
    })

    return debts
}

export async function addDebt(
    month: number,
    year: number,
    data: {
        creditor: string
        totalAmount: number
        monthlyPayment: number
        dueDay: number
        isRecurring?: boolean
        recurringStartDate?: Date
        recurringEndDate?: Date
    }
) {
    try {
        const budget = await getCurrentBudget(month, year)

        // Handle recurring debts
        if (data.isRecurring && data.recurringStartDate && data.recurringEndDate) {
            const debts = await createRecurringDebts(
                budget.id,
                {
                    creditor: data.creditor,
                    totalAmount: data.totalAmount,
                    monthlyPayment: data.monthlyPayment,
                    dueDay: data.dueDay,
                    recurringStartDate: data.recurringStartDate,
                    recurringEndDate: data.recurringEndDate
                },
                budget.userId
            )

            revalidatePath('/dashboard')
            return { success: true, data: debts }
        }

        const debt = await prisma.debt.create({
            data: {
                budgetId: budget.id,
                creditor: data.creditor,
                totalAmount: data.totalAmount,
                monthlyPayment: data.monthlyPayment,
                dueDay: data.dueDay,
                isPaid: false
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: debt }
    } catch (error) {
        console.error('Error adding debt:', error)
        return { success: false, error: 'Failed to add debt' }
    }
}

export async function deleteDebt(id: string) {
    try {
        await prisma.debt.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting debt:', error)
        return { success: false, error: 'Failed to delete debt' }
    }
}

export async function updateDebt(
    id: string,
    data: {
        creditor?: string
        totalAmount?: number
        monthlyPayment?: number
        dueDay?: number
    }
) {
    try {
        const debt = await prisma.debt.update({
            where: { id },
            data: {
                ...(data.creditor && { creditor: data.creditor }),
                ...(data.totalAmount && { totalAmount: data.totalAmount }),
                ...(data.monthlyPayment && { monthlyPayment: data.monthlyPayment }),
                ...(data.dueDay && { dueDay: data.dueDay })
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: debt }
    } catch (error) {
        console.error('Error updating debt:', error)
        return { success: false, error: 'Failed to update debt' }
    }
}

export async function toggleDebtPaid(id: string, isPaid: boolean) {
    try {
        await prisma.debt.update({
            where: { id },
            data: {
                isPaid,
                paidDate: isPaid ? new Date() : null
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error toggling debt paid status:', error)
        return { success: false, error: 'Failed to update debt' }
    }
}
