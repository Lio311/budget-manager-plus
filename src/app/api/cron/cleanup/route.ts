import { NextRequest, NextResponse } from 'next/server'
import { runSubscriptionCleanup } from '@/lib/cron/subscription-cleanup'

export async function GET(req: NextRequest) {
    // Verify cron secret (Vercel Cron sends this header)
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const results = await runSubscriptionCleanup()
        return NextResponse.json({ success: true, results })
    } catch (error) {
        console.error('Cron job error:', error)
        return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
    }
}
