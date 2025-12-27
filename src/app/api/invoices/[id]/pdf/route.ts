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

        // Generate PDF stream
        const stream = await generateInvoicePDF({
            invoiceId,
            userId: user.id
        })

        // Convert stream to buffer
        const chunks: Uint8Array[] = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)

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
