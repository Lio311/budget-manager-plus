import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { authenticatedPrisma } from '@/lib/db';
import { generateBkmvData } from '@/lib/export/openformat';

export async function GET(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const db = await authenticatedPrisma(userId);
        
        const businessProfile = await db.businessProfile.findUnique({
            where: { userId }
        });

        const invoices = await db.invoice.findMany({
            where: { userId, isLocked: true },
            include: { lineItems: true }
        });

        const creditNotes = await db.creditNote.findMany({
            where: { userId, isLocked: true }
        });

        const bkmvText = generateBkmvData(invoices, creditNotes, businessProfile);

        return new NextResponse(bkmvText, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': 'attachment; filename="BKMVDATA.txt"'
            }
        });
    } catch (error) {
        console.error('Export Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
