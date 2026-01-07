'use client'

import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface DepartmentStat {
    department: string
    _count: {
        id: number
    }
}

interface WorkloadBubbleMapProps {
    data: DepartmentStat[]
}

const DEPARTMENT_COLORS: Record<string, string> = {
    'DEV': 'bg-blue-500',
    'SECURITY': 'bg-slate-600',
    'QA': 'bg-orange-500',
    'MARKETING': 'bg-pink-500',
    'BIZ_DEV': 'bg-green-500'
}

const DEPARTMENT_NAMES: Record<string, string> = {
    'DEV': 'פיתוח',
    'SECURITY': 'אבטחה',
    'QA': 'בדיקות',
    'MARKETING': 'שיווק',
    'BIZ_DEV': 'פיתוח עסקי'
}

export function WorkloadBubbleMap({ data }: WorkloadBubbleMapProps) {
    // Find max value for scaling
    const maxCount = Math.max(...data.map(d => d._count.id), 1)

    // Sort by count descending for better packing visual
    const sortedData = [...data].sort((a, b) => b._count.id - a._count.id)

    return (
        <Card className="p-6 h-full min-h-[300px] flex flex-col">
            <h3 className="text-lg font-bold mb-6 text-right">עומס עבודה לפי מחלקה</h3>

            <div className="flex-1 flex flex-wrap items-center justify-center content-center gap-4 p-4">
                {sortedData.map((dept) => {
                    const count = dept._count.id
                    // Calculate size: min 60px, max 140px based on count vs maxCount
                    const size = 60 + (count / maxCount) * 80
                    const colorClass = DEPARTMENT_COLORS[dept.department] || 'bg-gray-400'

                    return (
                        <TooltipProvider key={dept.department}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={`${colorClass} rounded-full flex flex-col items-center justify-center text-white text-center shadow-md transition-transform hover:scale-110 cursor-default animate-in zoom-in duration-500`}
                                        style={{
                                            width: `${size}px`,
                                            height: `${size}px`,
                                        }}
                                    >
                                        <span className="font-bold text-lg leading-none">{count}</span>
                                        <span className="text-[10px] opacity-90 truncate max-w-[90%] px-1 font-medium">{DEPARTMENT_NAMES[dept.department] || dept.department}</span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{DEPARTMENT_NAMES[dept.department] || dept.department}</p>
                                    <p>{count} משימות פעילות</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )
                })}

                {data.length === 0 && (
                    <div className="text-gray-400 text-sm">אין נתונים להצגה</div>
                )}
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-gray-500" dir="rtl">
                {sortedData.map(d => (
                    <div key={d.department} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${DEPARTMENT_COLORS[d.department] || 'bg-gray-400'}`} />
                        <span className="font-medium text-slate-600">{DEPARTMENT_NAMES[d.department] || d.department}</span>
                    </div>
                ))}
            </div>
        </Card>
    )
}
