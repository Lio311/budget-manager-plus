import { BudgetProvider } from '@/contexts/BudgetContext'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { SWRConfig } from 'swr'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { prisma } from '@/lib/db'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check authentication
    const user = await currentUser()

    if (!user) {
        redirect('/sign-in')
    }

    console.log('[DashboardLayout] User authenticated:', user.id, user.emailAddresses[0]?.emailAddress)

    // Ensure user exists in database
    try {
        await prisma.user.upsert({
            where: { id: user.id },
            update: {},
            create: {
                id: user.id,
                email: user.emailAddresses[0]?.emailAddress || ''
            }
        })
        console.log('[DashboardLayout] User synced to DB')
    } catch (error) {
        console.error('[DashboardLayout] Error syncing user:', error)
    }

    // Check subscription/trial status
    const subscriptionStatus = await getSubscriptionStatus(user.id)
    console.log('[DashboardLayout] Subscription status:', subscriptionStatus)

    // If user has no access, redirect to subscribe page
    if (!subscriptionStatus.hasAccess) {
        console.log('[DashboardLayout] No access, redirecting to /subscribe')
        redirect('/subscribe')
    }

    console.log('[DashboardLayout] Access granted, rendering dashboard')

    return (
        <SWRConfig
            value={{
                revalidateOnFocus: false,
                revalidateOnReconnect: false,
                refreshInterval: 0
            }}
        >
            <BudgetProvider>
                <DashboardShell />
            </BudgetProvider>
        </SWRConfig>
    )
}
