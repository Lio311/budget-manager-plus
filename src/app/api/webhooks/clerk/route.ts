import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    console.log('🔔 Webhook received')

    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    console.log('📋 Headers:', { svix_id, svix_timestamp, has_signature: !!svix_signature })

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        console.error('❌ Missing svix headers')
        return new Response('Error occurred -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    console.log('📦 Payload type:', payload.type)

    // Create a new Svix instance with your secret.
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

    if (!webhookSecret) {
        console.error('❌ CLERK_WEBHOOK_SECRET is not set!')
        return new Response('Server configuration error', { status: 500 })
    }

    console.log('🔑 Webhook secret exists:', webhookSecret.substring(0, 10) + '...')

    const wh = new Webhook(webhookSecret)

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
        console.log('✅ Webhook verified successfully')
    } catch (err) {
        console.error('❌ Error verifying webhook:', err)
        return new Response('Error occurred - invalid signature', {
            status: 400
        })
    }

    // Handle the webhook
    const eventType = evt.type
    console.log('🎯 Event type:', eventType)

    if (eventType === 'user.created') {
        const { id, email_addresses } = evt.data

        console.log('👤 Creating user:', { id, email: email_addresses?.[0]?.email_address })

        try {
            // Create user in our database
            const newUser = await prisma.user.create({
                data: {
                    id,
                    email: email_addresses[0].email_address
                }
            })

            console.log('✅ User created in database:', newUser)
            return new Response(JSON.stringify({ success: true, userId: newUser.id }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            })
        } catch (error) {
            console.error('❌ Error creating user:', error)
            return new Response(JSON.stringify({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            })
        }
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data

        console.log('🗑️ Deleting user:', id)

        try {
            // Delete user from our database
            await prisma.user.delete({
                where: { id: id as string }
            })

            console.log('✅ User deleted from database:', id)
        } catch (error) {
            console.error('⚠️ Error deleting user (might not exist):', error)
            // Don't return error - user might not exist in our DB
        }
    }

    return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    })
}
