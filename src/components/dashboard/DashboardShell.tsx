'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { ExpiryBanner } from '@/components/subscription/ExpiryBanner'

export function DashboardShell({ userPlan, hasPersonalAccess, hasBusinessAccess }: {
    userPlan: 'PERSONAL' | 'BUSINESS',
    hasPersonalAccess: boolean,
    hasBusinessAccess: boolean
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
