
// Note: This file requires @react-pdf/renderer to be installed
// Run: npm install @react-pdf/renderer

import { Font, renderToBuffer } from '@react-pdf/renderer'
import { InvoiceTemplate } from './invoice-template'
import { prisma } from '@/lib/db'
import path from 'path'

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

interface GenerateInvoicePDFParams {
    invoiceId: string
    userId: string
}

export function mapInvoiceToPDFData(invoice: any, businessProfile: any, businessBudget: any) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') || 'https://www.kesefly.co.il'
    const logoPath = `${baseUrl}/images/branding/K-LOGO.png`

    const vatRate = invoice.vatRate * 100
    const subtotal = invoice.subtotal
    const vatAmount = invoice.vatAmount
    const total = invoice.total

    return {
        title: 'חשבונית',
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate.toISOString(),
        dueDate: invoice.dueDate?.toISOString() || invoice.issueDate.toISOString(),
        status: getStatusLabel(invoice.status),
        paymentMethod: getPaymentMethodLabel(invoice.paymentMethod),

        businessName: businessProfile?.companyName || 'החברה שלי',
        businessId: businessProfile?.companyId || undefined,
        businessAddress: businessProfile?.address || undefined,
        businessPhone: businessProfile?.phone || undefined,
        businessEmail: businessProfile?.email || undefined,
        businessLogo: businessProfile?.logoUrl || undefined,
        businessSignature: businessProfile?.signatureUrl || undefined,

        clientName: invoice.guestClientName || invoice.client?.name || 'N/A',
        clientId: invoice.client?.taxId || undefined,

        subtotal,
        vatRate,
        vatAmount,
        total,
        currency: invoice.currency || businessBudget?.currency || 'ILS',

        notes: invoice.notes || undefined,
        poweredByLogoPath: logoPath
    }
}

export async function generatePDFBuffer(data: any): Promise<Buffer> {
    registerFont()
    return await renderToBuffer(<InvoiceTemplate data={data} />)
}

export async function generateInvoicePDF({ invoiceId, userId }: GenerateInvoicePDFParams): Promise<{ buffer: Buffer, filename: string }> {
    try {
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
                            where: { type: 'BUSINESS' },
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

        const invoiceData = mapInvoiceToPDFData(invoice, businessProfile, businessBudget)

        const sanitizedBusinessName = (businessProfile?.companyName || 'Business').replace(/[^a-zA-Z0-9\u0590-\u05FF\s-]/g, '').trim()
        const filename = `${invoice.invoiceNumber} Invoice from ${sanitizedBusinessName}.pdf`

        const buffer = await generatePDFBuffer(invoiceData)

        return { buffer, filename }
    } catch (error) {
        console.error('generateInvoicePDF error:', error)
        throw error
    }
}


function getPaymentMethodLabel(method?: string | null): string {
    if (!method) return 'העברה בנקאית'

    const labels: Record<string, string> = {
        'BANK_TRANSFER': 'העברה בנקאית',
        'CREDIT_CARD': 'כרטיס אשראי',
        'BIT': 'ביט',
        'PAYBOX': 'פייבוקס',
        'CASH': 'מזומן',
        'CHECK': 'צ\'ק',
        'OTHER': 'אחר'
    }
    return labels[method] || method
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
