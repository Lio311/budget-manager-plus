import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { generateProfitLossPDF } from '@/lib/pdf/generate-profit-loss'

export async function GET(
    request: NextRequest,
    { params }: { params: { year: string } }
) {
    try {
        const user = await currentUser()
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const year = parseInt(params.year)
        if (isNaN(year)) {
            return new NextResponse('Invalid Year', { status: 400 })
        }

        // Generate PDF buffer
        const { buffer, filename } = await generateProfitLossPDF({
            year,
            userId: user.id
        })

        // Return PDF - Use Uint8Array to satisfy BodyInit type
        return new NextResponse(new Uint8Array(buffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
            },
        })
    } catch (error) {
        console.error('PDF generation error:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
