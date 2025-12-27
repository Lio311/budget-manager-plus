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
                budget: {
                    userId: userId,
                    type: 'BUSINESS'
                }
            },
            include: {
                client: true,
                budget: {
                    include: {
                        user: {
                            include: {
                                businessProfile: true
                            }
                        }
                    }
                }
            }
        })

        if (!invoice) {
            throw new Error('Invoice not found')
        }

        const businessProfile = invoice.budget.user.businessProfile

        // Calculate VAT
        const vatRate = 17 // Israel VAT rate
        const subtotal = invoice.amount / (1 + vatRate / 100)
        const vatAmount = invoice.amount - subtotal

        // Prepare invoice data
        const invoiceData = {
            invoiceNumber: invoice.invoiceNumber,
            issueDate: invoice.issueDate.toISOString(),
            dueDate: invoice.dueDate.toISOString(),
            status: getStatusLabel(invoice.status),
            paymentMethod: getPaymentMethodLabel(invoice.paymentMethod),

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
            total: invoice.amount,
            currency: invoice.budget.currency,

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

function getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
        'BANK_TRANSFER': 'העברה בנקאית',
        'CREDIT_CARD': 'כרטיס אשראי',
        'CASH': 'מזומן',
        'CHECK': 'צ׳ק',
        'PAYPAL': 'PayPal',
        'OTHER': 'אחר'
    }
    return labels[method] || method
}
