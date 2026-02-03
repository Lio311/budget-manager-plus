'use client'

import { BudgetProvider } from '@/contexts/BudgetContext'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { DemoProvider } from '@/contexts/DemoContext'

export default function DemoPage() {
    return (
        <DemoProvider isDemo={true}>
            <BudgetProvider initialPlan="PERSONAL">
                <DashboardShell
                    userPlan="PERSONAL"
                    hasPersonalAccess={true}
                    hasBusinessAccess={true}
                >
                    <DashboardTabs mobileMenuOpen={false} setMobileMenuOpen={() => { }} />
                </DashboardShell>
            </BudgetProvider>
        </DemoProvider>
    )
}
