import { currentUser } from '@clerk/nextjs/server'
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

    // Note: Subscription check is handled by the parent layout.tsx
    // to ensure the user has at least ONE active subscription (Personal or Business).

    return null
}
