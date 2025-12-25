import { BudgetProvider } from '@/contexts/BudgetContext'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
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
                <DashboardShell />
            </BudgetProvider>
        </SWRConfig>
    )
}
