// cleaned import
import { IsraelMapWidget } from '@/components/management/IsraelMapWidget'
import { EmployeePerformance } from '@/components/management/EmployeePerformanceWidget'
import { FinancialOverview } from '@/components/management/FinancialOverviewWidget'
import { PriorityBreakdown } from '@/components/management/PriorityBreakdownWidget'
import { TaskVelocity } from '@/components/management/TaskVelocityWidget'
import { RecentActivity } from '@/components/management/RecentActivityWidget'
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

    const { employeeStats, departmentStats, financials, priorityStats, recentActivity, velocityStats } = kpis.data || {
        employeeStats: [],
        departmentStats: [],
        financials: { revenue: 0, expenses: 0, profit: 0 },
        priorityStats: [],
        recentActivity: [],
        velocityStats: []
    }
    const locationData = locations.data || []

    return (
        <div className="space-y-6">
            {/* Top Row: Financial & Map */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <FinancialOverview data={financials} />
                </div>
                <div className="lg:col-span-1">
                    <IsraelMapWidget locations={locationData} />
                </div>
            </div>

            {/* Middle Row: Employee & Dept Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmployeePerformance data={employeeStats} />

                {/* Department Stats Card (Simple for now) */}
                <Card className="p-6">
                    <h3 className="text-lg font-bold mb-4">עומס עבודה לפי מחלקה</h3>
                    <div className="space-y-4">
                        {departmentStats.map((dept: any) => (
                            <div key={dept.department} className="flex items-center gap-4">
                                <span className="w-24 font-medium text-sm">{dept.department}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full"
                                        style={{ width: `${Math.min(dept._count.id * 10, 100)}%` }} // Arbitrary scaling
                                    />
                                </div>
                                <span className="text-sm font-bold w-6 text-left">{dept._count.id}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Bottom Row: Advanced Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <PriorityBreakdown data={priorityStats || []} />
                </div>
                <div className="lg:col-span-1">
                    <TaskVelocity data={velocityStats || []} />
                </div>
                <div className="lg:col-span-1">
                    <RecentActivity data={recentActivity || []} />
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
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                        ייצוא נתונים
                    </button>
                </div>
            </div>

            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>}>
                <DashboardContent />
            </Suspense>
        </div>
    )
}
