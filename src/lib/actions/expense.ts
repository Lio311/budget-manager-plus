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
        let totalNetILS = 0

        for (const expense of expenses) {
            const amountInILS = await convertToILS(expense.amount, expense.currency)
            totalILS += amountInILS

            if (expense.isDeductible && expense.vatAmount) {
                const net = expense.amount - (expense.vatAmount || 0)
                const netInILS = await convertToILS(net, expense.currency)
                totalNetILS += netInILS
            } else {
                // If not deductible, the full amount is the cost
                totalNetILS += amountInILS
            }
        }

        return { success: true, data: { expenses, totalILS, totalNetILS } }
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
    clientId?: string
    projectId?: string
    amountBeforeVat?: number
    vatRate?: number
    vatAmount?: number
    isDeductible?: boolean
    deductibleRate?: number
    paymentMethod?: string
    paidBy?: string
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
                clientId: validatedData.clientId || null,
                amountBeforeVat: validatedData.amountBeforeVat || (validatedData.isDeductible && (!validatedData.vatAmount || validatedData.vatAmount === 0) ? parseFloat(((validatedData.amount / 1.18)).toFixed(2)) : validatedData.amountBeforeVat),
                vatRate: validatedData.vatRate || (validatedData.isDeductible && (!validatedData.vatAmount || validatedData.vatAmount === 0) ? 0.18 : validatedData.vatRate),
                vatAmount: validatedData.vatAmount || (validatedData.isDeductible && (!validatedData.vatAmount || validatedData.vatAmount === 0) ? parseFloat(((validatedData.amount - (validatedData.amount / 1.18))).toFixed(2)) : validatedData.vatAmount),
                vatType: validatedData.vatType,
                isDeductible: validatedData.isDeductible,
                deductibleRate: validatedData.deductibleRate,
                expenseType: validatedData.expenseType,
                invoiceDate: validatedData.invoiceDate ? new Date(validatedData.invoiceDate) : null,
                // Mark as paid by default unless explicitly set otherwise
                paymentDate: validatedData.paymentDate
                    ? new Date(validatedData.paymentDate)
                    : new Date(),
                paymentMethod: validatedData.paymentMethod,

                paymentTerms: validatedData.paymentTerms,
                paidBy: validatedData.paidBy || null,

            }
        })

        // If recurring, create copies for future months
        if (validatedData.isRecurring && validatedData.recurringEndDate) {
            // Helper to create future instances
            await createRecurringExpenses(
                expense.id,
                validatedData.category,
                validatedData.description,
                validatedData.amount,
                validatedData.currency,
                validatedData.date as string,
                validatedData.recurringEndDate,
                type,
                {
                    supplierId: validatedData.supplierId,
                    clientId: validatedData.clientId,
                    projectId: validatedData.projectId,
                    amountBeforeVat: validatedData.amountBeforeVat,
                    vatRate: validatedData.vatRate,
                    vatAmount: validatedData.vatAmount,
                    isDeductible: validatedData.isDeductible,
                    deductibleRate: validatedData.deductibleRate,
                    paymentMethod: validatedData.paymentMethod,
                    paidBy: validatedData.paidBy
                }
            )
        }

        revalidatePath('/')
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
    type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL',
    extraData: any = {}
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
                        recurringEndDate: endDate,
                        // Business Fields
                        supplierId: extraData.supplierId || null,
                        clientId: extraData.clientId || null,
                        projectId: extraData.projectId || null,
                        amountBeforeVat: extraData.amountBeforeVat || (extraData.isDeductible && (!extraData.vatAmount || extraData.vatAmount === 0) ? parseFloat(((amount / 1.18)).toFixed(2)) : extraData.amountBeforeVat),
                        vatRate: extraData.vatRate || (extraData.isDeductible && (!extraData.vatAmount || extraData.vatAmount === 0) ? 0.18 : extraData.vatRate),
                        vatAmount: extraData.vatAmount || (extraData.isDeductible && (!extraData.vatAmount || extraData.vatAmount === 0) ? parseFloat(((amount - (amount / 1.18))).toFixed(2)) : extraData.vatAmount),
                        isDeductible: extraData.isDeductible,
                        deductibleRate: extraData.deductibleRate,
                        paymentMethod: extraData.paymentMethod,
                        paidBy: extraData.paidBy || null,
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
        clientId: validatedData.clientId,
        projectId: validatedData.projectId,
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
        paymentTerms: validatedData.paymentTerms,
        paidBy: validatedData.paidBy
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

        const db = await authenticatedPrisma(userId)

        // --- Duplicate Prevention Check (Row Level) ---
        // 1. Get Date Range
        const validDates = expenses
            .map(e => e.date ? new Date(e.date) : new Date())
            .filter(d => !isNaN(d.getTime()))

        if (validDates.length === 0 && expenses.length > 0) {
            // Fallback if no valid dates (shouldn't happen with valid files)
            // Proceed without check or assume today?
            // Let's assume the loop below handles defaults.
        }

        let skippedCount = 0
        const expensesToImport: ExpenseInput[] = []

        if (validDates.length > 0) {
            const minDate = new Date(Math.min(...validDates.map(d => d.getTime())))
            const maxDate = new Date(Math.max(...validDates.map(d => d.getTime())))

            // Expand range to cover full days
            minDate.setHours(0, 0, 0, 0)
            maxDate.setHours(23, 59, 59, 999)

            // 2. Fetch existing expenses in that range
            const existingExpenses = await db.expense.findMany({
                where: {
                    budget: {
                        userId: userId,
                        type: budgetType
                    },
                    date: {
                        gte: minDate,
                        lte: maxDate
                    }
                },
                select: {
                    date: true,
                    amount: true,
                    description: true
                }
            })

            // 3. Create Signatures
            const existingSignatures = new Set(existingExpenses.map(e => {
                const d = e.date ? new Date(e.date) : new Date(0) // Fallback to 0 if null, unlikely but safe
                d.setHours(0, 0, 0, 0) // Compare by date (day), not time if time is irrelevant
                // Note: If imports have specific times, we might need to be careful. 
                // Usually excel imports have 00:00:00 time unless specified.
                // Existing DB expenses might have weird times if manually entered? 
                // Let's stick to Day+Amount+Description equality.
                return `${d.getTime()}-${e.amount}-${e.description?.trim()}`
            }))

            // 4. Filter
            for (const exp of expenses) {
                const d = exp.date ? new Date(exp.date) : new Date()
                d.setHours(0, 0, 0, 0)
                const signature = `${d.getTime()}-${exp.amount}-${exp.description?.trim()}`

                if (existingSignatures.has(signature)) {
                    skippedCount++
                } else {
                    expensesToImport.push(exp)
                }
            }
        } else {
            // No valid dates found in input?, try to import all?
            expensesToImport.push(...expenses)
        }

        if (expensesToImport.length === 0) {
            return { success: true, count: 0, skipped: skippedCount }
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
        const uniqueCategories = Array.from(new Set(expensesToImport.map(e => e.category).filter(c => c && c !== 'כללי')))

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
        for (const exp of expensesToImport) {
            const date = exp.date ? new Date(exp.date) : new Date()
            const month = date.getMonth() + 1
            const year = date.getFullYear()

            // Get appropriate budget
            const budget = await getCurrentBudget(month, year, '₪', budgetType)

            // VAT Enforcement Logic
            let finalVatAmount = exp.vatAmount
            let finalVatRate = exp.vatRate
            let finalAmountBeforeVat = exp.amountBeforeVat

            if (exp.isDeductible && (!finalVatAmount || finalVatAmount === 0)) {
                finalVatRate = 0.18
                finalAmountBeforeVat = parseFloat((exp.amount / 1.18).toFixed(2))
                finalVatAmount = parseFloat((exp.amount - finalAmountBeforeVat).toFixed(2))
            }

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
                    amountBeforeVat: finalAmountBeforeVat,
                    vatRate: finalVatRate,
                    vatAmount: finalVatAmount,
                    isDeductible: exp.isDeductible,
                    deductibleRate: exp.deductibleRate,
                    paymentMethod: exp.paymentMethod,
                    projectId: exp.projectId,
                }
            })
            addedCount++
        }

        revalidatePath('/')
        return { success: true, count: addedCount, skipped: skippedCount }
    } catch (error: any) {
        console.error('Failed to import expenses:', error)
        return { success: false, error: 'Failed to import expenses: ' + (error.message || 'Unknown error') }
    }
}

export async function deleteAllMonthlyExpenses(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)
        const budget = await getCurrentBudget(month, year, '₪', type)

        const result = await db.expense.deleteMany({
            where: {
                budgetId: budget.id
            }
        })

        revalidatePath('/')
        return { success: true, count: result.count }
    } catch (error: any) {
        console.error('Failed to delete all expenses:', error)
        return { success: false, error: 'Failed to delete expenses' }
    }
}

export async function toggleExpenseStatus(id: string, newStatus: 'PAID' | 'PENDING') {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const data: any = {}
        if (newStatus === 'PAID') {
            data.paymentDate = new Date()
        } else {
            data.paymentDate = null
        }

        await db.expense.update({
            where: { id },
            data
        })

        revalidatePath('/dashboard')
        revalidatePath('/')
        return { success: true }
    } catch (error) {
        console.error('Error toggling expense status:', error)
        return { success: false, error: 'Failed to update status' }
    }
}
