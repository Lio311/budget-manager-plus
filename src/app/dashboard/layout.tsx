import { BudgetProvider } from '@/contexts/BudgetContext'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <BudgetProvider>
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
                <DashboardHeader />
                <DashboardTabs />
            </div>
        </BudgetProvider>
    )
}
