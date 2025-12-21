import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
    // Get the headers
    const headerPayload = await headers()
    const svix_id = headerPayload.get("svix-id")
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', {
            status: 400
        })
    }

    // Get the body
    const payload = await req.json()
    const body = JSON.stringify(payload)

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

    let evt: WebhookEvent

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent
    } catch (err) {
        console.error('Error verifying webhook:', err)
        return new Response('Error occured', {
            status: 400
        })
    }

    // Handle the webhook
    const eventType = evt.type

    if (eventType === 'user.created') {
        const { id, email_addresses } = evt.data

        try {
            // Create user in our database
            await prisma.user.create({
                data: {
                    clerkId: id,
                    email: email_addresses[0].email_address
                }
            })

            console.log('User created in database:', id)
        } catch (error) {
            console.error('Error creating user:', error)
            return new Response('Error creating user', { status: 500 })
        }
    }

    if (eventType === 'user.deleted') {
        const { id } = evt.data

        try {
            // Delete user from our database
            await prisma.user.delete({
                where: { clerkId: id as string }
            })

            console.log('User deleted from database:', id)
        } catch (error) {
            console.error('Error deleting user:', error)
            // Don't return error - user might not exist in our DB
        }
    }

    return new Response('', { status: 200 })
}
