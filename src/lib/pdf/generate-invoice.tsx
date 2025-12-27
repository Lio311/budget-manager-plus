// Note: This file requires @react-pdf/renderer to be installed
// Run: npm install @react-pdf/renderer

import { renderToStream } from '@react-pdf/renderer'
import { InvoiceTemplate } from './invoice-template'
import { prisma } from '@/lib/db'

interface GenerateInvoicePDFParams {
    invoiceId: string
    userId: string
}

export async function generateInvoicePDF({ invoiceId, userId }: GenerateInvoicePDFParams) {
    try {
        // Fetch invoice data
        const invoice = await prisma.invoice.findFirst({
            where: {
                id: invoiceId,
                userId: userId
            },
            include: {
                client: true,
                user: {
                    include: {
                        businessProfile: true,
                        budgets: {
                            where: {
                                type: 'BUSINESS'
                            },
                            take: 1
                        }
                    }
                }
            }
        })

        if (!invoice) {
            throw new Error('Invoice not found')
        }

        const businessProfile = invoice.user.businessProfile
        const businessBudget = invoice.user.budgets[0]

        // Use invoice's own financial data
        const vatRate = invoice.vatRate * 100 // Convert to percentage
        const subtotal = invoice.subtotal
        const vatAmount = invoice.vatAmount
        const total = invoice.total

        // Prepare invoice data
        const invoiceData = {
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate.toISOString(),
            dueDate: invoice.dueDate?.toISOString() || invoice.issueDate.toISOString(),
            status: getStatusLabel(invoice.status),
            paymentMethod: 'העברה בנקאית', // Default payment method

            // Business info
            businessName: businessProfile?.companyName || 'החברה שלי',
            businessId: businessProfile?.companyId,
            businessAddress: businessProfile?.address,
            businessPhone: businessProfile?.phone,
            businessEmail: businessProfile?.email,
            businessLogo: businessProfile?.logoUrl,

            // Client info
            clientName: invoice.client.name,
            clientId: invoice.client.taxId,

            // Financial
            subtotal,
            vatRate,
            vatAmount,
            total,
            currency: invoice.currency || businessBudget?.currency || 'ILS',

            // Notes
            notes: invoice.notes || undefined
        }

        // Generate PDF
        const stream = await renderToStream(<InvoiceTemplate data={invoiceData} />)

        return stream
    } catch (error) {
        console.error('generateInvoicePDF error:', error)
        throw error
    }
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'DRAFT': 'טיוטה',
        'SENT': 'נשלח',
        'PAID': 'שולם',
        'OVERDUE': 'באיחור',
        'CANCELLED': 'בוטל'
    }
    return labels[status] || status
}
