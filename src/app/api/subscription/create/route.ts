import { NextRequest, NextResponse } from 'next/server'
import { createSubscription } from '@/lib/actions/subscription'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(req: NextRequest) {
    try {
        const user = await currentUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { orderId, amount } = await req.json()

        if (!orderId || !amount) {
            return NextResponse.json({ error: 'Missing orderId or amount' }, { status: 400 })
        }

        const result = await createSubscription(orderId, amount)

        return NextResponse.json({ success: true, subscription: result.subscription })
    } catch (error) {
        console.error('Create subscription error:', error)
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
    }
}
