'use server'

import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { convertToILS } from '@/lib/currency'

export interface TransactionItem {
    id: string
    date: Date
    type: 'INCOME' | 'EXPENSE' | 'CREDIT_NOTE' | 'INVOICE'
    number?: string // Invoice/Receipt number
    description: string
    category?: string
    entityName?: string // Client or Supplier
    amount: number // Full amount
    amountNet: number // Before VAT
    vat: number
    isRecognized?: boolean // For expenses
}

export interface ProfitLossReport {
    year: number
    revenue: {
        total: number
        taxable: number
        vat: number
    }
    expenses: {
        total: number
        recognized: number
        vatRecognized: number
    }
    netProfit: number
    transactions: TransactionItem[]
}

export async function getProfitLossData(year: number): Promise<{ success: boolean, data?: ProfitLossReport, error?: string }> {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        const startDate = new Date(year, 0, 1) // Jan 1st
        const endDate = new Date(year, 11, 31, 23, 59, 59) // Dec 31st

        // 1. Fetch Invoices (Revenue)
        // User requested: "Signed Finally" -> "Receipt" or "Tax Invoice/Receipt".
        // In our system, valid finalized revenue documents are 'SIGNED' Invoices.
        const invoices = await db.invoice.findMany({
            where: {
                userId,
                status: 'SIGNED', // Only signed invoices
                issueDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: { client: true }
        })

        // 2. Fetch Credit Notes (Revenue Deduction)
        const creditNotes = await db.creditNote.findMany({
            where: {
                userId,
                issueDate: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: { invoice: { include: { client: true } } }
        })

        // 3. Fetch Expenses
        // Need to check budgets for this year periods?
        // Or simpler: Find expenses by date directly if we can, but expenses are linked to Budgets.
        // However, `Expense` has a `date` field. We can query `Expense` directly across budgets if we access `db.expense`.
        // BUT `db.expense` query should filter by `user` which is usually done via `budget.userId`.
        // Let's verify schema: `Expense` -> `Budget` -> `User`.
        const expenses = await db.expense.findMany({
            where: {
                budget: { userId },
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: { supplier: true }
        })

        // --- Aggregation ---

        let revenueTotal = 0
        let revenueNet = 0
        let revenueVat = 0

        const transactions: TransactionItem[] = []

        // Process Invoices
        for (const inv of invoices) {
            // Convert to ILS if necessary (assuming base is ILS for simple sum, or using helper)
            // For rigorous reporting, we should convert foreign currency to ILS at exchange rate of issuing date.
            // Using standard convertToILS for now (which might fetch current rate - approximation).
            // Ideal: Invoice should store its ILS value at creation.
            // Current system: `total` is in `currency`.

            const rate = inv.currency === 'ILS' ? 1 : await convertToILS(1, inv.currency)
            const totalILS = inv.total * rate
            const vatILS = inv.vatAmount * rate
            const netILS = inv.subtotal * rate

            revenueTotal += totalILS
            revenueNet += netILS
            revenueVat += vatILS

            transactions.push({
                id: inv.id,
                date: inv.issueDate,
                type: 'INVOICE',
                number: inv.invoiceNumber,
                description: `חשבונית ${inv.invoiceNumber}`,
                entityName: inv.client.name,
                amount: totalILS,
                amountNet: netILS,
                vat: vatILS
            })
        }

        // Process Credit Notes (Subtract)
        for (const cn of creditNotes) {
            // Credit note currency usually matches invoice currency
            const rate = cn.invoice.currency === 'ILS' ? 1 : await convertToILS(1, cn.invoice.currency)
            const totalILS = cn.totalCredit * rate
            const vatILS = cn.vatAmount * rate
            const netILS = cn.creditAmount * rate

            revenueTotal -= totalILS
            revenueNet -= netILS
            revenueVat -= vatILS

            transactions.push({
                id: cn.id,
                date: cn.issueDate,
                type: 'CREDIT_NOTE',
                number: cn.creditNoteNumber,
                description: `זיכוי ${cn.creditNoteNumber} (חשבונית ${cn.invoice.invoiceNumber})`,
                entityName: cn.invoice.client.name,
                amount: -totalILS,
                amountNet: -netILS,
                vat: -vatILS
            })
        }

        // 2.5 Fetch Manual Incomes (Not linked to Invoices)
        // This covers "Sales/Income" records added manually without generating an invoice in the system.
        const manualIncomes = await db.income.findMany({
            where: {
                budget: { userId },
                date: {
                    gte: startDate,
                    lte: endDate
                },
                invoiceId: null // Only fetch incomes NOT already counted via invoices
            },
            include: { client: true }
        })

        for (const inc of manualIncomes) {
            const rate = inc.currency === 'ILS' ? 1 : await convertToILS(1, inc.currency)
            const totalILS = inc.amount * rate

            // If vatAmount is specified, use it. Otherwise calculate from rate if available, or assume inclusive?
            // Usually manual income in Business mode has `vatAmount` and `amountBeforeVat`.
            // In Personal mode (or if missing), we might assume 0 VAT or inclusive.

            let vatILS = 0
            let netILS = totalILS

            if (inc.vatAmount) {
                vatILS = inc.vatAmount * rate
                netILS = totalILS - vatILS
            } else if (inc.amountBeforeVat) {
                // If we have before vat but no vat amount explicitly (rare)
                netILS = inc.amountBeforeVat * rate
                vatILS = totalILS - netILS
            }

            revenueTotal += totalILS
            revenueNet += netILS
            revenueVat += vatILS

            transactions.push({
                id: inc.id,
                date: inc.date || new Date(),
                type: 'INCOME', // General Income
                description: inc.source || inc.category,
                category: inc.category,
                entityName: inc.client?.name || inc.payer || undefined,
                amount: totalILS,
                amountNet: netILS,
                vat: vatILS
            })
        }

        // Process Expenses
        let expensesTotal = 0
        let expensesRecognized = 0
        let expensesVatRecognized = 0

        for (const exp of expenses) {
            const rate = exp.currency === 'ILS' ? 1 : await convertToILS(1, exp.currency)
            const amountILS = exp.amount * rate

            // Expense Logic:
            // `amount` is usually inclusive of VAT if entered simply, or depends on 'amountBeforeVat'.
            // Let's look at `expense.ts`.
            // If `vatAmount` exists, `amount` is total.
            // Recognized Expense = (dectuctibleRate * Net) + (RecognizedVAT ?)
            // Usually: Net is recognized * rate. VAT is reclaimed if recognized.
            // If `isDeductible` is true (or undefined/true default):
            // Recognized Part = (Amount - VAT) * deductibleRate
            // + VAT Repayment (if fully recognized? or distinct report).
            // P&L usually cares about the Expense (Net) for Tax purposes.
            // Net Profit = Revenue (Net) - Expenses (Recognized Net).

            const vat = (exp.vatAmount || 0) * rate
            const net = amountILS - vat

            // "Entity" (Business) usually cares about Net cost.
            // If expense is NOT deductible, the FULL amount (inc VAT) is the cost (loss).
            // If expense IS deductible, the Cost is the Net (VAT is returned).

            let recognizedCost = 0
            if (exp.isDeductible) {
                const deductibleRate = exp.deductibleRate ?? 1.0
                recognizedCost = net * deductibleRate
                // If only 45% is deductible, is the rest lost? Yes.
                // But for the specific "Profit & Loss" for Tax Authorities:
                // They sum "Recognized Expenses".
            } else {
                // Not deductible at all?
                recognizedCost = 0
            }

            expensesTotal += amountILS // Cash flow total
            expensesRecognized += recognizedCost
            expensesVatRecognized += (exp.isDeductible ? vat : 0) // Approximation

            transactions.push({
                id: exp.id,
                date: exp.date || new Date(),
                type: 'EXPENSE',
                description: exp.description || exp.category,
                category: exp.category,
                entityName: exp.supplier?.name,
                amount: amountILS,
                amountNet: net,
                vat: vat,
                isRecognized: exp.isDeductible || false
            })
        }

        const netProfit = revenueNet - expensesRecognized

        // Sort transactions by date desc
        transactions.sort((a, b) => b.date.getTime() - a.date.getTime())

        return {
            success: true,
            data: {
                year,
                revenue: {
                    total: revenueTotal,
                    taxable: revenueNet,
                    vat: revenueVat
                },
                expenses: {
                    total: expensesTotal,
                    recognized: expensesRecognized,
                    vatRecognized: expensesVatRecognized
                },
                netProfit,
                transactions
            }
        }

    } catch (error) {
        console.error('getProfitLossData error:', error)
        return { success: false, error: 'Failed to generate report' }
    }
}
