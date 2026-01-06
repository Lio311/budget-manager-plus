
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
        // We need to group items by category for the PDF table
        // The data.expenses.breakdown has category level data?
        // data.expenses.items is "Detailed list of all expense recognitions"

        // Let's Group Expenses by Category
        const expenseCategories = new Map<string, number>()
        data.expenses.items.forEach(item => {
            const current = expenseCategories.get(item.category) || 0
            expenseCategories.set(item.category, current + item.recognizedAmount)
        })

        const expenseItems = Array.from(expenseCategories.entries()).map(([category, amount]) => ({
            category,
            amount
        })).sort((a, b) => b.amount - a.amount)

        // Group Income by Category (Source?)
        // The data.revenue.items contains individual invoice income events.
        // We should group by 'Source' or 'Category' (usually Income has a category field)

        // Wait, looking at `getProfitLossData` return type.
        // It returns `transactions`. Let's use `data.revenue.items`
        // `Income` model has `category`.

        const incomeCategories = new Map<string, number>()
        // We need to fetch the actual Income objects or trust the breakdown?
        // `data.revenue.items` is `TransactionItem`. It has `category`.

        data.revenue.items.forEach(item => {
            const val = item.netAmount // Revenue is usually Net for P&L
            const current = incomeCategories.get(item.category || 'כללי') || 0
            incomeCategories.set(item.category || 'כללי', current + val)
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
                total: data.revenue.totalNet,
                items: incomeItems
            },
            expenses: {
                total: data.expenses.totalRecognizedNet,
                items: expenseItems
            },
            netProfit: data.netIncome
        }

        const filename = `profit-loss-report-${year}.pdf`
        const buffer = await renderToBuffer(<ProfitLossTemplate data={pdfData} />)

        return { buffer, filename }

    } catch (error) {
        console.error('generateProfitLossPDF error:', error)
        throw error
    }
}
