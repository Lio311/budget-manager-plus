'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { ExpiryBanner } from '@/components/subscription/ExpiryBanner'

export function DashboardShell() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100">
            <ExpiryBanner />
            <DashboardHeader
                onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                menuOpen={mobileMenuOpen}
            />
            <DashboardTabs mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        </div>
    )
}
