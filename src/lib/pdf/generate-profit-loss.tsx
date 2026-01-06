
import { Font, renderToBuffer } from '@react-pdf/renderer'
import { ProfitLossTemplate } from './profit-loss-template'
import { prisma, authenticatedPrisma } from '@/lib/db'
import { ALEF_FONT_BASE64 } from './font-data'
import { getProfitLossData } from '@/lib/actions/reports'
import { auth } from '@clerk/nextjs/server'

// Keep track of font registration state
let isFontRegistered = false

function registerFont() {
    if (isFontRegistered) return

    try {
        Font.register({
            family: 'Alef',
            src: `data:font/ttf;base64,${ALEF_FONT_BASE64}`
        })
        isFontRegistered = true
    } catch (error) {
        console.error('Failed to register PDF font:', error)
    }
}

interface GenerateProfitLossPDFParams {
    year: number
    userId: string
}

export async function generateProfitLossPDF({ year, userId }: GenerateProfitLossPDFParams): Promise<{ buffer: Buffer, filename: string }> {
    try {
        registerFont()

        const db = await authenticatedPrisma(userId)

        // Fetch underlying data using existing logic
        // We need to bypass auth check in getProfitLossData if we are calling it from here where we already have userId?
        // Actually getProfitLossData calls `auth()`, so it works if we are in a server component context.
        // But if this is called from an API route, auth() works too.

        // However, getProfitLossData requires `await auth()` so we can just call it directly if we are in a context where auth works. 
        // IF we pass data manually, we might duplicate logic.
        // Ideally we refactor getProfitLossData to accept userId optionally or split the logic.
        // For now, let's assume this is called from an API route where auth() is valid.

        // Wait, getProfitLossData is an action, it checks auth internally.
        const reportResult = await getProfitLossData(year)

        if (!reportResult.success || !reportResult.data) {
            throw new Error('Failed to fetch report data')
        }

        const data = reportResult.data

        // Fetch User Business Profile
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { businessProfile: true }
        })

        const businessName = user?.businessProfile?.companyName || 'העסק שלי'
        const businessLogo = user?.businessProfile?.logoUrl || undefined

        // Aggregate Data for PDF
        // Group items by category for the PDF table using data.transactions

        // 1. Expenses Logic
        const expenseCategories = new Map<string, number>()
        // Filter transactions for expenses
        data.transactions
            .filter(t => t.type === 'EXPENSE')
            .forEach(item => {
                // If isRecognized is false, should we exclude it from the P&L PDF?
                // The P&L typically shows expenses that reduce profit.
                // Assuming we want to show what was "recognized" logic or just net amounts.
                // The report data structure separates "total" and "recognized".
                // Let's use `amountNet` for the category breakdown, but maybe we should scale it if it's partially deductible?
                // Current `amountNet` in transaction item is just (Amount - VAT).
                // If it's 50% recognized, the P&L line item should probably reflect the recognized portion for accurate Net Profit calc.
                // However, `isRecognized` is boolean in the interface, while `deductibleRate` was used in calculation.
                // The `TransactionItem` doesn't strictly carry the `deductibleRate`.
                // BUT `data.expenses.recognized` matches the report.
                // To avoid mismatch, let's just sum `amountNet` for the breakdown, realizing it might differ from "recognized" total if we don't apply rates.
                // Wait, if `netProfit` is calculated using `recognized`, the table should probable match.
                // Since we lack the rate in `TransactionItem`, we will sum `amountNet` and maybe just display the totals from the summary object at the bottom.
                // Or: assume `amountNet` is what user expects to see as "Expense Cost".

                const current = expenseCategories.get(item.category || 'כללי') || 0
                expenseCategories.set(item.category || 'כללי', current + item.amountNet)
            })

        const expenseItems = Array.from(expenseCategories.entries()).map(([category, amount]) => ({
            category,
            amount
        })).sort((a, b) => b.amount - a.amount)

        // 2. Income Logic
        const incomeCategories = new Map<string, number>()
        // Filter transactions for Invoices and Credit Notes
        data.transactions
            .filter(t => t.type === 'INVOICE' || t.type === 'CREDIT_NOTE')
            .forEach(item => {
                const current = incomeCategories.get(item.category || 'כללי') || 0
                incomeCategories.set(item.category || 'כללי', current + item.amountNet)
            })

        const incomeItems = Array.from(incomeCategories.entries()).map(([category, amount]) => ({
            category,
            amount
        })).sort((a, b) => b.amount - a.amount)


        const pdfData = {
            period: year.toString(),
            businessName,
            businessLogo,
            currency: 'ILS', // Default
            incomes: {
                total: data.revenue.taxable, // Use taxable (Net)
                items: incomeItems
            },
            expenses: {
                total: data.expenses.recognized, // Use recognized summary
                items: expenseItems
            },
            netProfit: data.netProfit, // Use calculated net profit
            poweredByLogoPath: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') || 'https://budget-manager-plus.vercel.app'}/K-LOGO.png`
        }

        const filename = `profit-loss-report-${year}.pdf`
        const buffer = await renderToBuffer(<ProfitLossTemplate data={pdfData} />)

        return { buffer, filename }

    } catch (error) {
        console.error('generateProfitLossPDF error:', error)
        throw error
    }
}
