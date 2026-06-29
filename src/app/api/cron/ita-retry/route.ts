import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateAllocationNumber, ItaOfflineError } from '@/lib/services/ita-service'

// Vercel Cron automatically protects routes if CRON_SECRET is set
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    // Simple protection: if CRON_SECRET is configured, enforce it.
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const pendingInvoices = await prisma.invoice.findMany({
            where: {
                allocationStatus: 'PENDING_ITA'
            },
            include: {
                client: true,
                user: {
                    include: {
                        businessProfile: true
                    }
                }
            }
        });

        if (pendingInvoices.length === 0) {
            return NextResponse.json({ success: true, message: 'No pending invoices found' });
        }

        let successCount = 0;
        let failCount = 0;

        for (const invoice of pendingInvoices) {
            const businessProfile = invoice.user.businessProfile;
            if (!businessProfile?.itaRefreshToken) {
                // If they disconnected, mark as failed so we don't keep trying forever
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { allocationStatus: 'FAILED' }
                });
                failCount++;
                continue;
            }

            try {
                // Throttle requests slightly if there are many to avoid ITA rate limits
                await new Promise(r => setTimeout(r, 1000));
                
                const allocationNumber = await generateAllocationNumber(invoice as any, invoice.client as any, businessProfile);
                
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        allocationNumber,
                        allocationStatus: 'COMPLETED'
                    }
                });
                successCount++;
                
                // Note: We are not regenerating the PDF here because the document is already signed.
                // The allocation number will be stored in the DB and can be shown in the UI.
                
            } catch (error) {
                console.error(`CRON ITA Retry failed for invoice ${invoice.id}:`, error);
                
                if (!(error instanceof ItaOfflineError) && (error as Error).name !== 'ItaOfflineError') {
                    // Client error (e.g., bad payload) - mark as failed
                    await prisma.invoice.update({
                        where: { id: invoice.id },
                        data: { allocationStatus: 'FAILED' }
                    });
                }
                // If it's ItaOfflineError again, leave it as PENDING_ITA to try again tomorrow
                failCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Processed ${pendingInvoices.length} invoices. Success: ${successCount}, Failed: ${failCount}` 
        });

    } catch (error) {
        console.error('ITA CRON job error:', error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
