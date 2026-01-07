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

    const { employeeStats, departmentStats, financials, priorityStats, recentActivity, velocityStats, users } = (kpis.data as any) || {
        employeeStats: {} as any,
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
                {/* Team Performance Split into 5 statuses */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <TeamPerformanceBubbleMap
                        data={employeeStats['DONE'] || []}
                        users={users || []}
                        title="משימות שהושלמו"
                        badgeColor="bg-green-500"
                        countLabel="משימות הושלמו"
                    />
                    <TeamPerformanceBubbleMap
                        data={employeeStats['IN_PROGRESS'] || []}
                        users={users || []}
                        title="בעבודה"
                        badgeColor="bg-orange-400"
                        countLabel="משימות בעבודה"
                    />
                    <TeamPerformanceBubbleMap
                        data={employeeStats['REVIEW'] || []}
                        users={users || []}
                        title="בבדיקה"
                        badgeColor="bg-purple-500"
                        countLabel="משימות בבדיקה"
                    />
                    <TeamPerformanceBubbleMap
                        data={employeeStats['STUCK'] || []}
                        users={users || []}
                        title="תקוע"
                        badgeColor="bg-red-500"
                        countLabel="משימות תקועות"
                    />
                    <TeamPerformanceBubbleMap
                        data={employeeStats['TODO'] || []}
                        users={users || []}
                        title="לביצוע"
                        badgeColor="bg-gray-400"
                        countLabel="משימות לביצוע"
                    />
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
                    <p className="text-gray-500">תמונת מצב עדכנית של העסק</p>
                </div>
                <div className="flex gap-2">
                </div>
            </div>

            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>}>
                <DashboardContent />
            </Suspense>
        </div>
    )
}
