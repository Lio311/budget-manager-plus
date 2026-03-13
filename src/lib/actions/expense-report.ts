'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { generateExpenseReportPDFBuffer } from '@/lib/pdf/generate-expense-report'

export async function generateMonthlyExpenseReportPDF(month: number, year: number, budgetType: 'PERSONAL' | 'BUSINESS' = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        // Define date range for the month
        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)

        const expenses = await prisma.expense.findMany({
            where: {
                budget: {
                    userId: userId,
                    type: budgetType,
                    month,
                    year
                },
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        const manualRefunds = await prisma.manualVatRefund.findMany({
            where: {
                budget: {
                    userId: userId,
                    type: budgetType,
                    month,
                    year
                },
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        })

        if (!expenses.length && !manualRefunds.length) {
            return { success: false, error: 'לא נמצאו הוצאות או החזרי מע"מ לחודש המבוקש' }
        }

        const businessProfile = await prisma.businessProfile.findUnique({
            where: { userId }
        })
        const businessName = businessProfile?.companyName || 'העסק שלי'
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
        const totalManualRefunds = manualRefunds.reduce((sum, ref) => sum + ref.amount, 0)

        const buffer = await generateExpenseReportPDFBuffer({
            expenses,
            manualRefunds,
            month: month.toString().padStart(2, '0'),
            year: year.toString(),
            businessName: businessName,
            totalAmount: totalExpenses + totalManualRefunds
        })

        return {
            success: true,
            data: buffer.toString('base64'),
            filename: `Expense_Report_${month}_${year}.pdf`
        }

    } catch (error) {
        console.error('generateMonthlyExpenseReportPDF error:', error)
        return { success: false, error: 'נכשל בהפקת הדוח' }
    }
}
