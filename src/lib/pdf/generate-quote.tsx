// Note: This file requires @react-pdf/renderer to be installed
// Run: npm install @react-pdf/renderer

import { Font, renderToBuffer } from '@react-pdf/renderer'
import { InvoiceTemplate } from './invoice-template'
import { prisma } from '@/lib/db'

import { ALEF_FONT_BASE64 } from './font-data'

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

interface GenerateQuotePDFParams {
    quoteId: string
    userId: string
}

export async function generateQuotePDF({ quoteId, userId }: GenerateQuotePDFParams): Promise<{ buffer: Buffer, filename: string }> {
    try {
        // Ensure font is registered
        registerFont()

        const quote = await prisma.quote.findFirst({
            where: {
                id: quoteId,
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

        if (!quote) {
            throw new Error('Quote not found')
        }

        const businessProfile = quote.user.businessProfile
        const businessBudget = quote.user.budgets[0]

        // Use quote's own financial data
        const vatRate = quote.vatRate * 100 // Convert to percentage
        const subtotal = quote.subtotal
        const vatAmount = quote.vatAmount
        const total = quote.total

        // Prepare quote data
        const quoteData = {
            title: 'הצעת מחיר',
            documentNumberLabel: 'מספר הצעה',
            invoiceNumber: quote.quoteNumber,
            issueDate: quote.issueDate.toISOString(),
            dueDate: quote.validUntil?.toISOString() || quote.issueDate.toISOString(),
            status: getStatusLabel(quote.status),
            paymentMethod: undefined,

            // Business info
            businessName: businessProfile?.companyName || 'החברה שלי',
            businessId: businessProfile?.companyId || undefined,
            businessAddress: businessProfile?.address || undefined,
            businessPhone: businessProfile?.phone || undefined,
            businessEmail: businessProfile?.email || undefined,
            businessLogo: businessProfile?.logoUrl || undefined,
            businessSignature: businessProfile?.signatureUrl || undefined,

            // Client info
            clientName: quote.client.name,
            clientId: quote.client.taxId || undefined,

            // Financial
            subtotal,
            vatRate,
            vatAmount,
            total,
            currency: quote.currency || businessBudget?.currency || 'ILS',

            // Notes
            notes: quote.notes || undefined
        }

        // Generate PDF
        const buffer = await renderToBuffer(<InvoiceTemplate data={quoteData} />)

        // Construct filename: [Quote Number] Quote from [Business Name]
        const safeBusinessName = (quoteData.businessName || 'Business').replace(/[^a-zA-Z0-9\u0590-\u05FF\s_-]/g, '')
        const filename = `${quoteData.invoiceNumber} Quote from ${safeBusinessName}.pdf`

        return {
            buffer,
            filename
        }
    } catch (error) {
        console.error('generateQuotePDF error:', error)
        throw error
    }
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        'DRAFT': 'טיוטה',
        'SENT': 'נשלח',
        'ACCEPTED': 'התקבל',
        'EXPIRED': 'פג תוקף',
        'CANCELLED': 'בוטל'
    }
    return labels[status] || status
}
