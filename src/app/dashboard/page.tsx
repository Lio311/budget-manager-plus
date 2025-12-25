import { currentUser } from '@clerk/nextjs/server'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'לוח בקרה',
    description: 'נהל את ההכנסות, ההוצאות, החשבונות והחיסכונות שלך במקום אחד',
    robots: {
        index: false, // Don't index authenticated pages
        follow: false,
    },
}

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
