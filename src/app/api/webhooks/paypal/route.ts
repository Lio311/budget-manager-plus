import { NextRequest, NextResponse } from 'next/server'
import { createSubscription } from '@/lib/actions/subscription'

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const eventType = body.event_type

        console.log('PayPal webhook received:', eventType)

        if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
            const orderId = body.resource.id
            const amount = parseFloat(body.resource.amount.value)
            const userId = body.resource.custom_id

            if (!userId) {
                console.error('No userId in webhook')
                return NextResponse.json({ error: 'No userId' }, { status: 400 })
            }

            await createSubscription(orderId, amount)
            console.log(`Subscription created for user ${userId}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
    }
}
