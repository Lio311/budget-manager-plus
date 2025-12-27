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
    // We check both because Business plan grants access to Personal features too (conceptually),
    // but strict separation means we might need to check specific plan for specific actions.
    // For Dashboard access, we just need *some* access.

    const personalStatus = await getSubscriptionStatus(user.id, 'PERSONAL')
    const businessStatus = await getSubscriptionStatus(user.id, 'BUSINESS')

    const hasAccess = personalStatus.hasAccess || businessStatus.hasAccess
    const planType = businessStatus.hasAccess ? 'BUSINESS' : (personalStatus.hasAccess ? 'PERSONAL' : 'none')

    console.log('[DashboardLayout] Subscription status:', { personal: personalStatus.hasAccess, business: businessStatus.hasAccess, resolved: planType })

    // If user has no access, redirect to subscribe page
    if (!hasAccess) {
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
            <BudgetProvider initialPlan={planType as 'PERSONAL' | 'BUSINESS'}>
                <DashboardShell userPlan={planType as 'PERSONAL' | 'BUSINESS'} />
            </BudgetProvider>
        </SWRConfig>
    )
}
