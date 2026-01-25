'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

import { convertToILS } from '@/lib/currency'
import { syncBudgetToGoogleCalendar } from './calendar'

export async function getIncomes(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);
        const budget = await getCurrentBudget(month, year, '₪', type)

        const incomes = await db.income.findMany({
            where: { budgetId: budget.id },
            include: {
                client: true,
                invoice: true
            },
            orderBy: { date: 'desc' }
        })

        // Calculate total in ILS
        let totalILS = 0
        let totalNetILS = 0
        for (const income of incomes) {
            const amountInILS = await convertToILS(income.amount, income.currency)
            totalILS += amountInILS

            const vat = income.vatAmount || 0
            const net = income.amount - vat
            const netInILS = await convertToILS(net, income.currency)
            totalNetILS += netInILS
        }

        return { success: true, data: { incomes, totalILS, totalNetILS } }
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
        currency: string
        date?: string
        isRecurring?: boolean
        recurringStartDate?: string
        recurringEndDate?: string
        // Business Fields
        clientId?: string
        projectId?: string
        invoiceId?: string
        amountBeforeVat?: number
        vatRate?: number
        vatAmount?: number
        invoiceDate?: string
        paymentDate?: string
        paymentMethod?: any
        paymentTerms?: number
        payer?: string
        workTime?: string
        acceptedBy?: string
    },
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        const budget = await getCurrentBudget(month, year, '₪', type)

        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        // Helper function to parse dates safely without timezone issues
        const parseDate = (dateStr: string | undefined): Date | null => {
            if (!dateStr) return null;
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0, 0);
            }
            return new Date(dateStr);
        };

        const income = await db.income.create({
            data: {
                budgetId: budget.id,
                source: data.source,
                category: data.category,
                amount: data.amount,
                currency: data.currency,
                date: parseDate(data.date),
                isRecurring: data.isRecurring || false,
                recurringStartDate: parseDate(data.recurringStartDate || data.date) || new Date(),
                recurringEndDate: parseDate(data.recurringEndDate),
                // Business Fields
                clientId: data.clientId,
                projectId: data.projectId, // Added projectId
                invoiceId: data.invoiceId,
                amountBeforeVat: data.amountBeforeVat,
                vatRate: data.vatRate,
                vatAmount: data.vatAmount,
                invoiceDate: parseDate(data.invoiceDate),
                paymentDate: parseDate(data.paymentDate),
                paymentMethod: data.paymentMethod,
                paymentTerms: data.paymentTerms,
                payer: data.payer,
                workTime: data.workTime,
                acceptedBy: data.acceptedBy,
                status: (data as any).status || 'PAID'
            } as any
        })

        if (data.isRecurring && data.recurringEndDate) {
            const startDate = data.recurringStartDate || data.date || new Date().toISOString()
            await createRecurringIncomes(
                income.id,
                data.source,
                data.category,
                data.amount,
                data.currency,
                startDate,
                data.recurringEndDate,
                type,
                // Pass Business Fields
                data.clientId,
                data.paymentMethod,
                data.payer,
                data.vatRate,
                data.paymentTerms,
                data.workTime,
                data.acceptedBy
            )
        }

        try {
            const incDate = parseDate(data.date) || new Date()
            const syncMonth = incDate.getMonth() + 1
            const syncYear = incDate.getFullYear()
            await syncBudgetToGoogleCalendar(syncMonth, syncYear, type)
        } catch (e) {
            console.error('Auto-sync failed', e)
        }

        revalidatePath('/dashboard')
        return { success: true, data: income }
    } catch (error) {
        console.error('Error adding income:', error)
        return { success: false, error: 'Failed to add income' }
    }
}

export async function toggleIncomeStatus(id: string, newStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED') {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        // Ensure fetching with budget for sync
        const updated = await db.income.update({
            where: { id },
            data: { status: newStatus },
            include: { budget: true }
        })

        if (updated.budget) {
            const budgetType = updated.budget.type as 'PERSONAL' | 'BUSINESS'
            try {
                // If it has a date, use it. If not, use budget month/year (fallback)
                const syncMonth = updated.date ? (updated.date.getMonth() + 1) : updated.budget.month
                const syncYear = updated.date ? updated.date.getFullYear() : updated.budget.year
                await syncBudgetToGoogleCalendar(syncMonth, syncYear, budgetType)
            } catch (e) {
                console.error('Auto-sync failed', e)
            }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error toggling income status:', error)
        return { success: false, error: 'Failed to update status' }
    }
}

async function createRecurringIncomes(
    sourceId: string,
    source: string,
    category: string,
    amount: number,
    currency: string,
    startDateStr: string,
    endDateStr: string,
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL',
    // Business Fields
    clientId?: string,
    paymentMethod?: any,
    payer?: string,
    vatRate?: number,
    paymentTerms?: number,
    workTime?: string,
    acceptedBy?: string
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
            const budget = await getCurrentBudget(currentMonth, currentYear, '₪', type)

            // Handle invalid days (e.g., Feb 31 -> Feb 28/29)
            const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate()
            const dayToUse = Math.min(dayOfMonth, lastDayOfMonth)

            // Fetch auth inside loop if not passed, but we should refactor.
            const { userId } = await auth();
            if (userId) {
                const db = await authenticatedPrisma(userId);
                await db.income.create({
                    data: {
                        budgetId: budget.id,
                        source,
                        category,
                        amount,
                        currency,
                        date: new Date(currentYear, currentMonth - 1, dayToUse),
                        isRecurring: true,
                        recurringSourceId: sourceId,
                        recurringStartDate: startDate,
                        recurringEndDate: endDate,
                        // Business Fields Copy
                        clientId,
                        paymentMethod,
                        payer,
                        vatRate,
                        paymentTerms,
                        workTime,
                        acceptedBy
                    } as any
                })
            }
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
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        // Get the income to find its recurringSourceId
        // Use db to ensure RLS
        const income = await db.income.findUnique({
            where: { id: incomeId }
        })

        if (!income || !income.isRecurring) {
            return { success: false, error: 'Income is not recurring' }
        }

        // Find the source ID (either this income or its parent)
        const sourceId = income.recurringSourceId || income.id

        // Delete all future recurring incomes with the same source
        const fromDate = new Date(fromYear, fromMonth - 1, 1)

        await db.income.deleteMany({
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
        currency?: string
        date?: string
        // Business Fields
        clientId?: string
        projectId?: string
        invoiceId?: string
        amountBeforeVat?: number
        vatRate?: number
        vatAmount?: number
        invoiceDate?: string
        paymentDate?: string
        paymentMethod?: any
        paymentTerms?: number
        payer?: string
    },
    mode: 'SINGLE' | 'FUTURE' = 'SINGLE'
) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        if (mode === 'SINGLE') {
            const income = await db.income.update({
                where: { id },
                data: formatIncomeDataForUpdate(data),
                include: { budget: true }
            })

            if (income.budget) {
                const budgetType = income.budget.type as 'PERSONAL' | 'BUSINESS'
                try {
                    const syncMonth = income.date ? (income.date.getMonth() + 1) : income.budget.month
                    const syncYear = income.date ? income.date.getFullYear() : income.budget.year
                    await syncBudgetToGoogleCalendar(syncMonth, syncYear, budgetType)
                } catch (e) {
                    console.error('Auto-sync failed', e)
                }
            }

            revalidatePath('/dashboard')
            return { success: true, data: income }
        } else {
            // FUTURE Mode
            const currentIncome = await db.income.findUnique({ where: { id } })
            if (!currentIncome) return { success: false, error: 'Income not found' }

            const sourceId = currentIncome.recurringSourceId || currentIncome.id
            const fromDate = currentIncome.date || new Date()

            // Prepare data but REMOVE date to prevent collapsing all future records to the same single date
            // Unless we implement complex shifting logic, date should not be updated in bulk for recurrence
            const updateData = formatIncomeDataForUpdate(data)
            delete updateData.date

            const updateResult = await db.income.updateMany({
                where: {
                    OR: [
                        { id: sourceId },
                        { recurringSourceId: sourceId }
                    ],
                    date: {
                        gte: fromDate
                    }
                },
                data: updateData
            })

            revalidatePath('/dashboard')
            return { success: true, count: updateResult.count }
        }
    } catch (error) {
        console.error('Error updating income:', error)
        return { success: false, error: 'Failed to update income' }
    }
}

function formatIncomeDataForUpdate(data: any) {
    return {
        ...(data.source && { source: data.source }),
        ...(data.category && { category: data.category }),
        ...(data.amount && { amount: data.amount }),
        ...(data.currency && { currency: data.currency }),
        ...(data.date && { date: new Date(data.date) }),
        // Business Fields
        clientId: data.clientId,
        projectId: data.projectId,
        invoiceId: data.invoiceId,
        amountBeforeVat: data.amountBeforeVat,
        vatRate: data.vatRate,
        vatAmount: data.vatAmount,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : undefined,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
        paymentMethod: data.paymentMethod,
        paymentTerms: data.paymentTerms,
        payer: data.payer,
        workTime: data.workTime,
        acceptedBy: data.acceptedBy
    } as any // Cast to any to allow property deletion upstream
}

export async function deleteIncome(id: string, mode: 'SINGLE' | 'FUTURE' = 'SINGLE') {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        // Find the income first to check for credit notes AND for sync
        const income = await db.income.findUnique({
            where: { id },
            include: { budget: true }
        })

        if (!income) return { success: false, error: 'Income not found' }

        if (mode === 'SINGLE') {
            // If it's linked to a credit note, delete the credit note first
            if (income?.invoiceId) {
                const creditNote = await db.creditNote.findFirst({
                    where: {
                        userId,
                        invoiceId: income.invoiceId
                    }
                })

                if (creditNote) {
                    await db.creditNote.delete({
                        where: { id: creditNote.id }
                    })
                }
            }

            await db.income.delete({
                where: { id }
            })
        } else {
            // FUTURE Mode
            const sourceId = income.recurringSourceId || income.id
            const fromDate = income.date || new Date()

            await db.income.deleteMany({
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
        }

        if (income?.budget) {
            const budgetType = income.budget.type as 'PERSONAL' | 'BUSINESS'
            try {
                const syncMonth = income.date ? (income.date.getMonth() + 1) : income.budget.month
                const syncYear = income.date ? income.date.getFullYear() : income.budget.year
                await syncBudgetToGoogleCalendar(syncMonth, syncYear, budgetType)
            } catch (e) {
                console.error('Auto-sync failed', e)
            }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting income:', error)
        return { success: false, error: 'Failed to delete income' }
    }
}

export async function getClientUninvoicedIncomes(clientId: string) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);

        const incomes = await db.income.findMany({
            where: {
                clientId,
                invoiceId: null
            },
            orderBy: { date: 'desc' },
            include: {
                client: true,
                invoice: true
            }
        })

        return { success: true, data: incomes }
    } catch (error) {
        console.error('Error fetching client incomes:', error)
        return { success: false, error: 'Failed to fetch client incomes' }
    }
}
