'use client'

import { useState, useEffect } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { ExpiryBanner } from '@/components/subscription/ExpiryBanner'
import { useBudget } from '@/contexts/BudgetContext'

export function DashboardShell({ userPlan, hasPersonalAccess, hasBusinessAccess }: {
    userPlan: 'PERSONAL' | 'BUSINESS',
    hasPersonalAccess: boolean,
    hasBusinessAccess: boolean
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const { budgetType, setBudgetType } = useBudget()

    // Enforce valid budget type based on access rights
    useEffect(() => {
        if (budgetType === 'BUSINESS' && !hasBusinessAccess && hasPersonalAccess) {
            console.log('[DashboardShell] User has no Business access, forcing switch to Personal')
            setBudgetType('PERSONAL')
        } else if (budgetType === 'PERSONAL' && !hasPersonalAccess && hasBusinessAccess) {
            console.log('[DashboardShell] User has no Personal access, forcing switch to Business')
            setBudgetType('BUSINESS')
        }
    }, [budgetType, hasPersonalAccess, hasBusinessAccess, setBudgetType])

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <ExpiryBanner />
            <DashboardHeader
                onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                menuOpen={mobileMenuOpen}
                userPlan={userPlan}
                hasPersonalAccess={hasPersonalAccess}
                hasBusinessAccess={hasBusinessAccess}
            />
            <DashboardTabs mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        </div>
    )
}
