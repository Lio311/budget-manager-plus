import { currentUser } from '@clerk/nextjs/server'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
    // Check authentication
    const user = await currentUser()
    if (!user) {
        redirect('/sign-in')
    }

    // Check subscription
    let { hasAccess } = await getSubscriptionStatus(user.id)

    // If no access, redirect to subscribe
    if (!hasAccess) {
        redirect('/subscribe')
    }

    return null
}
