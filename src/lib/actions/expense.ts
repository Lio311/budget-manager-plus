'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { getCurrentBudget } from './budget'
import { revalidatePath } from 'next/cache'
import { auth } from '@clerk/nextjs/server'

import { convertToILS } from '@/lib/currency'

export async function getExpenses(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);
        const budget = await getCurrentBudget(month, year, '₪', type)

        const expenses = await db.expense.findMany({
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

export interface ExpenseInput {
    description: string
    amount: number
    category: string
    currency: 'ILS' | 'USD' | 'EUR' | 'GBP'
    date?: string
    isRecurring?: boolean
    recurringEndDate?: string
    supplierId?: string
    amountBeforeVat?: number
    vatRate?: number
    vatAmount?: number
    isDeductible?: boolean
    deductibleRate?: number
    paymentMethod?: string
}

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

        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);

        // Use db instead of prisma
        const expense = await db.expense.create({
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

            // Note: This function is called from addExpense which already has auth context, but
            // for safety we should ideally pass the db instance.
            // However, since we can't easily modify the signature efficiently without prop drilling:
            // Let's refactor createRecurringExpenses to accept userId or db instance.
            // For now, let's fetch auth inside loop (cached)
            const { userId } = await auth();
            if (userId) {
                const db = await authenticatedPrisma(userId);
                await db.expense.create({
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
            }
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
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        // Get the expense to find its recurringSourceId
        // Use db to ensure RLS
        const expense = await db.expense.findUnique({
            where: { id: expenseId }
        })

        if (!expense || !expense.isRecurring) {
            return { success: false, error: 'Expense is not recurring' }
        }

        // Find the source ID (either this expense or its parent)
        const sourceId = expense.recurringSourceId || expense.id

        // Delete all future recurring expenses with the same source
        const fromDate = new Date(fromYear, fromMonth - 1, 1)

        await db.expense.deleteMany({
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
    data: Partial<z.infer<typeof expenseSchema>>,
    mode: 'SINGLE' | 'FUTURE' = 'SINGLE'
) {
    try {
        // Validate partial input
        const validatedData = expenseSchema.partial().parse(data)

        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        if (mode === 'SINGLE') {
            const expense = await db.expense.update({
                where: { id },
                data: formatExpenseDataForUpdate(validatedData)
            })
            revalidatePath('/dashboard')
            return { success: true, data: expense }
        } else {
            // FUTURE Mode
            const currentExpense = await db.expense.findUnique({ where: { id } })
            if (!currentExpense) return { success: false, error: 'Expense not found' }

            const sourceId = currentExpense.recurringSourceId || currentExpense.id
            const fromDate = currentExpense.date || new Date()

            // Prepared Data
            const updateData = formatExpenseDataForUpdate(validatedData)
            delete updateData.date // Important: Don't collapse dates for future recurring series

            const updateResult = await db.expense.updateMany({
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
        console.error('Error updating expense:', error)
        return { success: false, error: 'Failed to update expense' }
    }
}

function formatExpenseDataForUpdate(validatedData: any) {
    return {
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
    } as any // Cast to any to allow property deletion upstream
}

export async function deleteExpense(id: string, mode: 'SINGLE' | 'FUTURE' = 'SINGLE') {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };
        const db = await authenticatedPrisma(userId);

        if (mode === 'SINGLE') {
            await db.expense.delete({
                where: { id }
            })
        } else {
            // FUTURE Mode
            const currentExpense = await db.expense.findUnique({ where: { id } })
            if (!currentExpense) return { success: false, error: 'Expense not found' }

            const sourceId = currentExpense.recurringSourceId || currentExpense.id
            const fromDate = currentExpense.date || new Date()

            await db.expense.deleteMany({
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

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error deleting expense:', error)
        return { success: false, error: 'Failed to delete expense' }
    }
}


export async function importExpenses(expenses: ExpenseInput[], budgetType: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'User not authenticated' }
        }

        if (expenses.length === 0) return { success: true }

        // --- Duplicate Prevention Check ---
        // We check a sample of rows to see if they already exist.
        // If we find that a significant portion of the sample exists, we assume the file was already imported.

        const db = await authenticatedPrisma(userId);

        // ... Duplicate Prevention Logic Check (Using db instead of prisma) ...
        // Pick up to 5 samples
        const sampleSize = Math.min(expenses.length, 5)
        const step = Math.floor(expenses.length / sampleSize)
        const samples = []
        for (let i = 0; i < expenses.length; i += step) {
            if (samples.length < sampleSize) samples.push(expenses[i])
        }

        let duplicateCount = 0

        for (const sample of samples) {
            const date = sample.date ? new Date(sample.date) : new Date()

            // Look for EXACT match using db (RLS enforce)
            const existing = await db.expense.findFirst({
                where: {
                    budget: {
                        userId: userId,
                        type: budgetType
                    },
                    date: {
                        gte: new Date(date.setHours(0, 0, 0, 0)),
                        lt: new Date(date.setHours(23, 59, 59, 999))
                    },
                    amount: sample.amount,
                    description: sample.description
                }
            })

            if (existing) {
                duplicateCount++
            }
        }

        if (samples.length > 0 && duplicateCount === samples.length) {
            return { success: false, error: 'הקובץ הזה כבר נטען למערכת (זוהו רשומות כפולות)' }
        }

        // Get or Create Default Category "All" or "General"
        let defaultCategory = await db.category.findFirst({
            where: {
                userId,
                type: 'expense',
                name: 'כללי',
                scope: budgetType
            }
        })

        if (!defaultCategory) {
            defaultCategory = await db.category.create({
                data: {
                    userId,
                    name: 'כללי',
                    type: 'expense',
                    color: 'bg-gray-500',
                    scope: budgetType
                }
            })
        }

        // Create missing categories
        const uniqueCategories = Array.from(new Set(expenses.map(e => e.category).filter(c => c && c !== 'כללי')))

        for (const catName of uniqueCategories) {
            const existingCat = await db.category.findFirst({
                where: {
                    userId,
                    name: catName,
                    type: 'expense',
                    scope: budgetType
                }
            })

            if (!existingCat) {
                console.log(`Creating new category from import: ${catName}`)
                await db.category.create({
                    data: {
                        userId,
                        name: catName,
                        type: 'expense',
                        color: 'bg-gray-500',
                        scope: budgetType
                    }
                })
            }
        }

        // Process expenses
        let addedCount = 0
        for (const exp of expenses) {
            const date = exp.date ? new Date(exp.date) : new Date()
            const month = date.getMonth() + 1
            const year = date.getFullYear()

            // Get appropriate budget
            const budget = await getCurrentBudget(month, year, '₪', budgetType)

            await db.expense.create({
                data: {
                    budgetId: budget.id,
                    description: exp.description,
                    amount: exp.amount,
                    currency: exp.currency || 'ILS',
                    date: date,
                    category: exp.category || defaultCategory!.name,
                    isRecurring: false,
                    // Business Fields
                    amountBeforeVat: exp.amountBeforeVat,
                    vatRate: exp.vatRate,
                    vatAmount: exp.vatAmount,
                    isDeductible: exp.isDeductible,
                    deductibleRate: exp.deductibleRate,
                    paymentMethod: exp.paymentMethod
                }
            })
            addedCount++
        }

        revalidatePath('/')
        return { success: true, count: addedCount }
    } catch (error: any) {
        console.error('Failed to import expenses:', error)
        return { success: false, error: 'Failed to import expenses: ' + (error.message || 'Unknown error') }
    }
}
