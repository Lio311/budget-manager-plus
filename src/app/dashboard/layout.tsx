import { BudgetProvider } from '@/contexts/BudgetContext'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { ExpiryBanner } from '@/components/subscription/ExpiryBanner'
import { SWRConfig } from 'swr'
import { currentUser } from '@clerk/nextjs/server'
import { getSubscriptionStatus, startTrial } from '@/lib/actions/subscription'
import { redirect } from 'next/navigation'

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

    // Check subscription
    let { hasAccess, status } = await getSubscriptionStatus(user.id)

    // If no access, check if eligible for trial
    if (!hasAccess) {
        if (status === 'none') {
            const result = await startTrial(user.id, user.emailAddresses[0]?.emailAddress || '')
            if (result.success) {
                redirect('/dashboard')
            }
        }
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
                <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
                    <ExpiryBanner />
                    <DashboardHeader />
                    <DashboardTabs />
                </div>
            </BudgetProvider>
        </SWRConfig>
    )
}
