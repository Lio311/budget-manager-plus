import { BudgetProvider } from '@/contexts/BudgetContext'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { ExpiryBanner } from '@/components/subscription/ExpiryBanner'
import { SWRConfig } from 'swr'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
