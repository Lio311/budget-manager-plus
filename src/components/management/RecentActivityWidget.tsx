'use client'

import { Card } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const STATUS_ICONS: Record<string, any> = {
    'DONE': CheckCircle,
    'IN_PROGRESS': Clock,
    'STUCK': AlertCircle,
    'TODO': Activity
}

const STATUS_COLORS: Record<string, string> = {
    'DONE': 'text-green-500',
    'IN_PROGRESS': 'text-blue-500',
    'STUCK': 'text-red-500',
    'TODO': 'text-gray-400'
}

export function RecentActivity({ data }: { data: any[] }) {
    // data is array of Tasks with creator info

    return (
        <Card className="p-6 h-[400px] shadow-sm flex flex-col">
            <h3 className="text-lg font-bold mb-4 text-gray-800">פעילות אחרונה</h3>

            {data.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    אין פעילות אחרונה
                </div>
            ) : (
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    {data.map((task) => {
                        const Icon = STATUS_ICONS[task.status] || Activity

                        return (
                            <div key={task.id} className="flex gap-3 items-start p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <div className={`mt-1 bg-white p-1 rounded-full shadow-sm ${STATUS_COLORS[task.status]}`}>
                                    <Icon size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{task.title}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                        <span>{task.assignee || 'לא הוקצה'}</span>
                                        <span>•</span>
                                        <span>{formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: he })}</span>
                                    </div>
                                </div>
                                <div className="text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600">
                                    {task.status}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </Card>
    )
}
