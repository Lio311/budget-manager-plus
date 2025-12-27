'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'
import { addMonths } from 'date-fns'

import { convertToILS } from '@/lib/currency'
import { DEBT_TYPES } from '@/lib/constants/debt-types'

export async function getDebts(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const budget = await getCurrentBudget(month, year, '₪', type)

        const debts = await prisma.debt.findMany({
            where: { budgetId: budget.id },
            orderBy: { dueDay: 'asc' }
        })

        // Calculate stats in ILS
        let totalOwedByMeILS = 0
        let totalOwedToMeILS = 0
        let monthlyPaymentOwedByMeILS = 0
        let monthlyPaymentOwedToMeILS = 0
        let paidThisMonthILS = 0

        for (const debt of debts) {
            const totalAmountInILS = await convertToILS(debt.totalAmount, debt.currency)
            const monthlyPaymentInILS = await convertToILS(debt.monthlyPayment, debt.currency)

            if (debt.debtType === DEBT_TYPES.OWED_BY_ME) {
                totalOwedByMeILS += totalAmountInILS
                monthlyPaymentOwedByMeILS += monthlyPaymentInILS
                if (debt.isPaid) {
                    paidThisMonthILS += monthlyPaymentInILS
                }
            } else if (debt.debtType === DEBT_TYPES.OWED_TO_ME) {
                totalOwedToMeILS += totalAmountInILS
                monthlyPaymentOwedToMeILS += monthlyPaymentInILS
                if (debt.isPaid) {
                    paidThisMonthILS -= monthlyPaymentInILS
                }
            }
        }

        const stats = {
            totalOwedByMeILS,
            totalOwedToMeILS,
            netDebtILS: totalOwedByMeILS - totalOwedToMeILS,
            monthlyPaymentOwedByMeILS,
            monthlyPaymentOwedToMeILS,
            netMonthlyPaymentILS: monthlyPaymentOwedByMeILS - monthlyPaymentOwedToMeILS,
            paidThisMonthILS,
            unpaidThisMonthILS: (monthlyPaymentOwedByMeILS - monthlyPaymentOwedToMeILS) - paidThisMonthILS
        }

        return { success: true, data: { debts, stats } }
    } catch (error) {
        console.error('Error fetching debts:', error)
        return { success: false, error: 'Failed to fetch debts' }
    }
}

// Helper function to create debt installments
// Helper function to create debt installments
async function createDebtInstallments(
    creditor: string,
    debtType: string,
    totalDebtAmount: number,
    currency: string,
    numberOfInstallments: number,
    dueDay: number,
    currentMonth: number,
    currentYear: number,
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    const monthlyPayment = Math.round((totalDebtAmount / numberOfInstallments) * 100) / 100
    const recurringSourceId = `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const installments = []

    for (let i = 0; i < numberOfInstallments; i++) {
        // Start from current month
        const installmentDate = addMonths(new Date(currentYear, currentMonth - 1, 1), i)
        const installmentMonth = installmentDate.getMonth() + 1
        const installmentYear = installmentDate.getFullYear()

        // Get or create budget for this month
        const budget = await getCurrentBudget(installmentMonth, installmentYear, '₪', type)

        installments.push({
            budgetId: budget.id,
            creditor,
            debtType,
            totalAmount: totalDebtAmount,
            currency,
            monthlyPayment,
            dueDay,
            isPaid: false,
            isRecurring: true,
            recurringSourceId,
            totalDebtAmount,
            numberOfInstallments,
            installmentNumber: i + 1
        })
    }

    await prisma.debt.createMany({
        data: installments
    })
}

export async function addDebt(
    month: number,
    year: number,
    data: {
        creditor: string
        debtType: string
        totalAmount: number
        currency: string
        monthlyPayment: number
        dueDay: number
        isRecurring?: boolean
        totalDebtAmount?: number
        numberOfInstallments?: number
    },
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const budget = await getCurrentBudget(month, year, '₪', type)

        // Check if this is an installment-based debt
        if (data.isRecurring && data.totalDebtAmount && data.numberOfInstallments) {
            await createDebtInstallments(
                data.creditor,
                data.debtType,
                data.totalDebtAmount,
                data.currency,
                data.numberOfInstallments,
                data.dueDay,
                month,
                year,
                type
            )
        } else {
            // Regular single debt
            await prisma.debt.create({
                data: {
                    budgetId: budget.id,
                    creditor: data.creditor,
                    debtType: data.debtType,
                    totalAmount: data.totalAmount,
                    currency: data.currency,
                    monthlyPayment: data.monthlyPayment,
                    dueDay: data.dueDay,
                    isPaid: false
                }
            })
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error adding debt:', error)
        return { success: false, error: 'Failed to add debt' }
    }
}

export async function updateDebt(
    id: string,
    data: {
        creditor: string
        debtType: string
        totalAmount: number
        currency: string
        monthlyPayment: number
        dueDay: number
    }
) {
    try {
        await prisma.debt.update({
            where: { id },
            data: {
                creditor: data.creditor,
                debtType: data.debtType,
                totalAmount: data.totalAmount,
                currency: data.currency,
                monthlyPayment: data.monthlyPayment,
                dueDay: data.dueDay
            }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error updating debt:', error)
        return { success: false, error: 'Failed to update debt' }
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
