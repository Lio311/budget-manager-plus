import { BudgetProvider } from '@/contexts/BudgetContext'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { SWRConfig } from 'swr'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSubscriptionStatus } from '@/lib/actions/subscription'

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

    // Check subscription/trial status
    const subscriptionStatus = await getSubscriptionStatus(user.id)

    // If user has no access, redirect to subscribe page
    if (!subscriptionStatus.hasAccess) {
        redirect('/subscribe')
    }

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
