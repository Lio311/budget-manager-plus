import { NextRequest, NextResponse } from 'next/server'
import { generateInvoicePDF } from '@/lib/pdf/generate-invoice'

export async function GET(
    request: NextRequest,
    { params }: { params: { token: string } }
) {
    try {
        const token = params.token

        // Generate PDF buffer using public token
        const { buffer, filename } = await generateInvoicePDF({
            token
        })

        // Return PDF
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
                'Cache-Control': 'no-store, max-age=0',
            },
        })
    } catch (error) {
        console.error('Public PDF generation error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
