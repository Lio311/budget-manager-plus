
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { authenticatedPrisma } from '@/lib/db'
import JSZip from 'jszip'
import { mapInvoiceToPDFData, generatePDFBuffer } from '@/lib/pdf/generate-invoice'

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const db = await authenticatedPrisma(userId)

        // Fetch User Business Profile
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                businessProfile: true,
                budgets: {
                    where: { type: 'BUSINESS' },
                    take: 1
                }
            }
        })

        if (!user) {
            return new NextResponse('User not found', { status: 404 })
        }

        const businessProfile = user.businessProfile
        const businessBudget = user.budgets[0]

        // Fetch All Invoices
        const invoices = await db.invoice.findMany({
            include: {
                client: true
            },
            orderBy: {
                issueDate: 'desc'
            }
        })

        if (!invoices.length) {
            return new NextResponse('No invoices found', { status: 404 })
        }

        const zip = new JSZip()
        const folder = zip.folder("invoices")

        // Helper to sanitize filename
        const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9\u0590-\u05FF\s-]/g, '').trim()

        // Generate PDFs
        for (const invoice of invoices) {
            try {
                const invoiceData = mapInvoiceToPDFData(invoice, businessProfile, businessBudget)
                const buffer = await generatePDFBuffer(invoiceData) // Should be fast enough for reasonable count, can be parallelized if needed

                const clientName = sanitize(invoiceData.clientName || 'Client')
                const fileName = `${invoice.invoiceNumber}_${clientName}.pdf`

                folder?.file(fileName, buffer)
            } catch (err) {
                console.error(`Failed to generate PDF for invoice ${invoice.id}`, err)
                // Continue to next invoice even if one fails
            }
        }

        // Generate ZIP
        const content = await zip.generateAsync({ type: 'nodebuffer' })

        // Return Response
        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="invoices_export_${new Date().toISOString().split('T')[0]}.zip"`
            }
        })

    } catch (error) {
        console.error('Export ZIP Error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
