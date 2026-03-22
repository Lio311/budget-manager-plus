'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { mapInvoiceToPDFData } from '@/lib/pdf/generate-invoice'
import { generateConsolidatedPDFBuffer } from '@/lib/pdf/generate-consolidated-report'

export async function generateMonthlyConsolidatedPDF(month: number, year: number) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        // Define date range for the month
        const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999)

        const invoices = await prisma.invoice.findMany({
            where: {
                userId: userId,
                issueDate: {
                    gte: startDate,
                    lte: endDate
                },
                status: {
                    in: ['PAID', 'SIGNED', 'SENT'] // Include relevant invoices
                },
                OR: [
                    { clientId: null },
                    { client: { isActive: true, isDeleted: false } }
                ]
            },
            include: {
                client: true,
                user: {
                    include: {
                        businessProfile: true,
                        budgets: {
                            where: { type: 'BUSINESS' },
                            take: 1
                        }
                    }
                }
            },
            orderBy: {
                issueDate: 'asc'
            }
        })

        if (!invoices.length) {
            return { success: false, error: 'לא נמצאו חשבוניות לחודש המבוקש' }
        }

        const businessProfile = invoices[0].user.businessProfile
        const businessBudget = invoices[0].user.budgets[0]
        const businessName = businessProfile?.companyName || 'העסק שלי'

        const mappedInvoices = invoices.map(inv => mapInvoiceToPDFData(inv, businessProfile, businessBudget))

        const buffer = await generateConsolidatedPDFBuffer({
            invoices: mappedInvoices,
            month: month.toString().padStart(2, '0'),
            year: year.toString(),
            businessName: businessName
        })

        return {
            success: true,
            data: buffer.toString('base64'),
            filename: `Consolidated_Invoices_${month}_${year}.pdf`
        }

    } catch (error) {
        console.error('generateMonthlyConsolidatedPDF error:', error)
        return { success: false, error: 'נכשל בהפקת הדוח' }
    }
}
