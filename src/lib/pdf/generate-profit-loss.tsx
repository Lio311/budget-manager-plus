
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
        // 1. Expenses Logic
        // Detailed list with Date
        const expenseItems = data.transactions
            .filter(t => t.type === 'EXPENSE')
            .map(item => ({
                date: item.date,
                description: item.description,
                category: item.category || 'כללי',
                amount: item.amountNet,
                vat: item.vat
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // 2. Income Logic
        // Detailed list with Date
        const incomeItems = data.transactions
            .filter(t => t.type === 'INVOICE' || t.type === 'CREDIT_NOTE' || t.type === 'INCOME')
            .map(item => ({
                date: item.date,
                description: item.description,
                category: item.category || 'כללי',
                amount: item.amountNet,
                vat: item.vat
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())


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
            poweredByLogoPath: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') || 'https://budget-manager-plus.vercel.app'}/images/branding/K-LOGO.png`
        }

        const filename = `profit-loss-report-${year}.pdf`
        const buffer = await renderToBuffer(<ProfitLossTemplate data={pdfData} />)

        return { buffer, filename }

    } catch (error) {
        console.error('generateProfitLossPDF error:', error)
        throw error
    }
}
