import { TeamPerformanceBubbleMap } from '@/components/management/TeamPerformanceBubbleMap'
import { FinancialOverview } from '@/components/management/FinancialOverviewWidget'
import { PriorityBreakdown } from '@/components/management/PriorityBreakdownWidget'
import { TaskVelocity } from '@/components/management/TaskVelocityWidget'
import { WorkloadBubbleMap } from '@/components/management/WorkloadBubbleMap'
import { getManagementKPIs, getUserLocations } from '@/lib/actions/management'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'
import { Card } from '@/components/ui/card'

async function DashboardContent() {
    const [kpis, locations] = await Promise.all([
        getManagementKPIs(),
        getUserLocations()
    ])

    if (!kpis.success || !locations.success) {
        return <div className="p-4 text-red-500">Error loading dashboard data.</div>
    }

    const { employeeStats, departmentStats, financials, priorityStats, recentActivity, velocityStats, users } = kpis.data || {
        employeeStats: [],
        departmentStats: [],
        financials: { revenue: 0, expenses: 0, profit: 0 },
        priorityStats: [],
        recentActivity: [],
        velocityStats: [],
        users: []
    }
    const locationData = locations.data || []

    return (
        <div className="space-y-6">
            {/* Top Row: Financial Only */}
            <div className="w-full">
                <FinancialOverview data={financials} />
            </div>

            {/* Middle Row: Employee & Dept Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TeamPerformanceBubbleMap data={employeeStats} users={users || []} />

                {/* Bubble Map Workload (Replaces old bar chart) */}
                <div className="h-full">
                    <WorkloadBubbleMap data={departmentStats} />
                </div>
            </div>

            {/* Bottom Row: Advanced Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-1">
                    <PriorityBreakdown data={priorityStats || []} />
                </div>
                <div className="lg:col-span-1">
                    <TaskVelocity data={velocityStats || []} />
                </div>
            </div>
        </div>
    )
}

export default function ManagementPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">סקירה כללית</h2>
                    <p className="text-gray-500">תמונת מצב עדכנית של הפרויקט</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                        דוח חודשי
                    </button>

                </div>
            </div>

            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>}>
                <DashboardContent />
            </Suspense>
        </div>
    )
}
