import { Card } from '@/components/ui/card'
import { PerformanceBubbles } from './TeamPerformanceBubbleMap'

interface EmployeeStat {
    assignee: string | null
    _count: {
        id: number
    }
}

interface User {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string
    image?: string | null
    [key: string]: any
}

interface UnifiedTeamPerformanceProps {
    employeeStats: Record<string, EmployeeStat[]>
    users: User[]
}

export function UnifiedTeamPerformance({ employeeStats, users }: UnifiedTeamPerformanceProps) {
    const statuses = [
        { key: 'DONE', label: 'בוצע', badgeColor: 'bg-green-500' },
        { key: 'IN_PROGRESS', label: 'בעבודה', badgeColor: 'bg-orange-400' },
        { key: 'REVIEW', label: 'בבדיקה', badgeColor: 'bg-purple-500' },
        { key: 'STUCK', label: 'תקוע', badgeColor: 'bg-red-500' },
        { key: 'TODO', label: 'לביצוע', badgeColor: 'bg-gray-400' },
    ]

    return (
        <Card className="p-6 overflow-hidden shadow-sm">
            <h3 className="text-xl font-bold mb-8 text-right px-2">ביצועי צוות לפי סטטוס</h3>

            <div className="flex flex-col lg:flex-row lg:divide-x lg:divide-x-reverse divide-gray-100">
                {statuses.map((status, index) => (
                    <div key={status.key} className="flex-1 px-4 mb-8 lg:mb-0">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${status.badgeColor}`}>
                                {employeeStats[status.key]?.reduce((acc, curr) => acc + curr._count.id, 0) || 0}
                            </div>
                            <h4 className="font-bold text-gray-700">{status.label}</h4>
                        </div>
                        <PerformanceBubbles
                            data={employeeStats[status.key] || []}
                            users={users}
                            badgeColor={status.badgeColor}
                            countLabel={`משימות ב${status.label}`}
                        />
                    </div>
                ))}
            </div>
        </Card>
    )
}
