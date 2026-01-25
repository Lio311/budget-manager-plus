'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'
import { addMonths } from 'date-fns'
import { auth } from '@clerk/nextjs/server'

import { convertToILS } from '@/lib/currency'
import { DEBT_TYPES } from '@/lib/constants/debt-types'
import { syncBudgetToGoogleCalendar } from './calendar'

export async function getDebts(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);
        const budget = await getCurrentBudget(month, year, '₪', type)

        const debts = await db.debt.findMany({
            where: { budgetId: budget.id },
            orderBy: { dueDay: 'asc' }
        })

        // Auto-mark debts as paid if due date has passed
        const today = new Date()
        const currentDay = today.getDate()
        const currentMonth = today.getMonth() + 1
        const currentYear = today.getFullYear()

        const isPastMonth = year < currentYear || (year === currentYear && month < currentMonth)
        const isCurrentMonth = year === currentYear && month === currentMonth

        const debtsToAutoPay = debts.filter(debt => {
            if (debt.isPaid) return false
            if (isPastMonth) return true
            if (isCurrentMonth && debt.dueDay <= currentDay) return true
            return false
        })

        if (debtsToAutoPay.length > 0) {
            await Promise.all(debtsToAutoPay.map(debt =>
                db.debt.update({
                    where: { id: debt.id },
                    data: { isPaid: true, paidDate: new Date() }
                })
            ))

            // Refetch to get updated status
            // Or just update the local array
            debtsToAutoPay.forEach(d => d.isPaid = true)
        }

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
                // If paid, the remaining total balance is effectively less
                const effectiveTotal = debt.isPaid
                    ? Math.max(0, totalAmountInILS - monthlyPaymentInILS)
                    : totalAmountInILS

                totalOwedByMeILS += effectiveTotal
                monthlyPaymentOwedByMeILS += monthlyPaymentInILS
                if (debt.isPaid) {
                    paidThisMonthILS += monthlyPaymentInILS
                }
            } else if (debt.debtType === DEBT_TYPES.OWED_TO_ME) {
                // Same logic for debts owed TO me? 
                // Usually "Total Owed To Me" implies what I expect to get back. 
                // If they paid me part of it, the total outstanding drops.
                const effectiveTotal = debt.isPaid
                    ? Math.max(0, totalAmountInILS - monthlyPaymentInILS)
                    : totalAmountInILS

                totalOwedToMeILS += effectiveTotal
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
async function createDebtInstallments(
    creditor: string,
    debtType: string,
    totalDebtAmount: number,
    currency: string,
    numberOfInstallments: number,
    dueDay: number,
    currentMonth: number,
    currentYear: number,
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL',
    paymentMethod?: string
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
            installmentNumber: i + 1,
            paymentMethod
        })
    }

    // Note: This helper is called from addDebt which handles auth.
    // Ideally we should pass the db instance here.
    const { userId } = await auth();
    if (!userId) return;
    const db = await authenticatedPrisma(userId);

    await db.debt.createMany({
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
        paymentMethod?: string
    },
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const budget = await getCurrentBudget(month, year, '₪', type)

        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

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
                type,
                data.paymentMethod
            )
            // For recurring, we should probably sync at least the first month or all?
            // Let's sync just the current requested month
        } else {
            // Regular single debt
            await db.debt.create({
                data: {
                    budgetId: budget.id,
                    creditor: data.creditor,
                    debtType: data.debtType,
                    totalAmount: data.totalAmount,
                    currency: data.currency,
                    monthlyPayment: data.monthlyPayment,
                    dueDay: data.dueDay,
                    isPaid: false,
                    paymentMethod: data.paymentMethod
                }
            })
        }

        // AUTO-SYNC
        void (async () => {
            try {
                await syncBudgetToGoogleCalendar(month, year, type)
            } catch (e) {
                console.error('Background Auto-sync failed', e)
            }
        })()

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
        paymentMethod?: string
    }
) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        const updatedDebt = await db.debt.update({
            where: { id },
            data: {
                creditor: data.creditor,
                debtType: data.debtType,
                totalAmount: data.totalAmount,
                currency: data.currency,
                monthlyPayment: data.monthlyPayment,
                dueDay: data.dueDay,
                ...(data.paymentMethod !== undefined && { paymentMethod: data.paymentMethod })
            },
            include: { budget: true }
        })

        // AUTO-SYNC
        if (updatedDebt.budget) {
            const budgetType = updatedDebt.budget.type as 'PERSONAL' | 'BUSINESS'
            try {
                await syncBudgetToGoogleCalendar(updatedDebt.budget.month, updatedDebt.budget.year, budgetType)
            } catch (e) {
                console.error('Auto-sync failed', e)
            }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error updating debt:', error)
        return { success: false, error: 'Failed to update debt' }
    }
}

export async function deleteDebt(id: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        // Fetch before delete to get budget
        const debt = await db.debt.findUnique({
            where: { id },
            include: { budget: true }
        })

        await db.debt.delete({
            where: { id }
        })

        // AUTO-SYNC
        if (debt?.budget) {
            const budgetType = debt.budget.type as 'PERSONAL' | 'BUSINESS'
            try {
                await syncBudgetToGoogleCalendar(debt.budget.month, debt.budget.year, budgetType)
            } catch (e) {
                console.error('Auto-sync failed', e)
            }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting debt:', error)
        return { success: false, error: 'Failed to delete debt' }
    }
}

export async function toggleDebtPaid(id: string, isPaid: boolean) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        const updatedDebt = await db.debt.update({
            where: { id },
            data: {
                isPaid,
                paidDate: isPaid ? new Date() : null
            },
            include: { budget: true }
        })

        // AUTO-SYNC
        if (updatedDebt.budget) {
            const budgetType = updatedDebt.budget.type as 'PERSONAL' | 'BUSINESS'
            try {
                await syncBudgetToGoogleCalendar(updatedDebt.budget.month, updatedDebt.budget.year, budgetType)
            } catch (e) {
                console.error('Auto-sync failed', e)
            }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error toggling debt paid status:', error)
        return { success: false, error: 'Failed to update debt' }
    }
}
