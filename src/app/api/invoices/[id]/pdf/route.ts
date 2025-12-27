import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { generateInvoicePDF } from '@/lib/pdf/generate-invoice'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await currentUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const invoiceId = params.id

        // Generate PDF buffer
        const buffer = await generateInvoicePDF({
            invoiceId,
            userId: user.id
        })

        // Return PDF
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-${invoiceId}.pdf"`,
            },
        })
    } catch (error) {
        console.error('PDF generation error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
