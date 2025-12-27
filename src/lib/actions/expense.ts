'use server'

import { prisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'

import { convertToILS } from '@/lib/currency'

export async function getExpenses(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const budget = await getCurrentBudget(month, year, '₪', type)

        const expenses = await prisma.expense.findMany({
            where: { budgetId: budget.id },
            include: {
                supplier: true
            },
            orderBy: { date: 'desc' }
        })

        // Calculate total in ILS
        let totalILS = 0
        for (const expense of expenses) {
            const amountInILS = await convertToILS(expense.amount, expense.currency)
            totalILS += amountInILS
        }

        return { success: true, data: { expenses, totalILS } }
    } catch (error) {
        console.error('Error fetching expenses:', error)
        return { success: false, error: 'Failed to fetch expenses' }
    }
}

import { expenseSchema } from '@/lib/validations/expense'
import { z } from 'zod'

export async function addExpense(
    month: number,
    year: number,
    data: z.infer<typeof expenseSchema>,
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
) {
    try {
        // Validate input
        const validatedData = expenseSchema.parse(data)

        const budget = await getCurrentBudget(month, year, '₪', type)

        const expense = await prisma.expense.create({
            data: {
                budgetId: budget.id,
                category: validatedData.category,
                description: validatedData.description,
                amount: validatedData.amount,
                currency: validatedData.currency,
                date: new Date(validatedData.date),
                isRecurring: validatedData.isRecurring || false,
                recurringStartDate: validatedData.recurringStartDate ? new Date(validatedData.recurringStartDate) : (validatedData.date ? new Date(validatedData.date) : new Date()),
                recurringEndDate: validatedData.recurringEndDate ? new Date(validatedData.recurringEndDate) : null,
                // Business Fields
                supplierId: validatedData.supplierId || null,
                amountBeforeVat: validatedData.amountBeforeVat,
                vatRate: validatedData.vatRate,
                vatAmount: validatedData.vatAmount,
                vatType: validatedData.vatType,
                isDeductible: validatedData.isDeductible,
                deductibleRate: validatedData.deductibleRate,
                expenseType: validatedData.expenseType,
                invoiceDate: validatedData.invoiceDate ? new Date(validatedData.invoiceDate) : null,
                paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : null,
                paymentMethod: validatedData.paymentMethod,
                paymentTerms: validatedData.paymentTerms
            }
        })

        // If recurring, create copies for future months
        if (data.isRecurring && data.recurringEndDate) {
            const startDate = data.recurringStartDate || data.date || new Date().toISOString()
            await createRecurringExpenses(
                expense.id,
                data.category,
                data.description,
                data.amount,
                data.currency,
                startDate,
                data.recurringEndDate,
                type // Pass type to recursive function
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
    currency: string,
    startDateStr: string,
    endDateStr: string,
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'
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

            await prisma.expense.create({
                data: {
                    budgetId: budget.id,
                    category,
                    description,
                    amount,
                    currency,
                    date: new Date(currentYear, currentMonth - 1, dayToUse),
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

export async function updateExpense(
    id: string,
    data: Partial<z.infer<typeof expenseSchema>>
) {
    try {
        // Validate partial input
        const validatedData = expenseSchema.partial().parse(data)

        const expense = await prisma.expense.update({
            where: { id },
            data: {
                ...(validatedData.category && { category: validatedData.category }),
                ...(validatedData.description && { description: validatedData.description }),
                ...(validatedData.amount && { amount: validatedData.amount }),
                ...(validatedData.currency && { currency: validatedData.currency }),
                ...(validatedData.date && { date: new Date(validatedData.date) }),
                // Business Fields
                supplierId: validatedData.supplierId,
                amountBeforeVat: validatedData.amountBeforeVat,
                vatRate: validatedData.vatRate,
                vatAmount: validatedData.vatAmount,
                vatType: validatedData.vatType,
                isDeductible: validatedData.isDeductible,
                deductibleRate: validatedData.deductibleRate,
                expenseType: validatedData.expenseType,
                invoiceDate: validatedData.invoiceDate ? new Date(validatedData.invoiceDate) : undefined,
                paymentDate: validatedData.paymentDate ? new Date(validatedData.paymentDate) : undefined,
                paymentMethod: validatedData.paymentMethod,
                paymentTerms: validatedData.paymentTerms
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: expense }
    } catch (error) {
        console.error('Error updating expense:', error)
        return { success: false, error: 'Failed to update expense' }
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
