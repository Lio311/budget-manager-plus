'use client'

import { useState } from 'react'
import { ManagementCalendar } from '@/components/management/ManagementCalendar'
import { ManagementGantt } from '@/components/management/ManagementGantt'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Calendar as CalendarIcon, BarChartHorizontal } from 'lucide-react'

interface CalendarViewWrapperProps {
    tasks: any[]
}

export function CalendarViewWrapper({ tasks }: CalendarViewWrapperProps) {
    const [view, setView] = useState<'calendar' | 'gantt'>('calendar')

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <ToggleGroup type="single" value={view} onValueChange={(v) => v && setView(v as 'calendar' | 'gantt')} className="bg-white p-1 rounded-lg border shadow-sm">
                    <ToggleGroupItem value="calendar" aria-label="Calendar View" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600">
                        <CalendarIcon className="h-4 w-4 ml-2" />
                        <span className="text-xs font-medium">לוח שנה</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="gantt" aria-label="Gantt View" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600">
                        <BarChartHorizontal className="h-4 w-4 ml-2" />
                        <span className="text-xs font-medium">גאנט</span>
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className={`transition-opacity duration-300 ${view === 'calendar' ? 'block' : 'hidden'}`}>
                <ManagementCalendar tasks={tasks} />
            </div>

            <div className={`transition-opacity duration-300 ${view === 'gantt' ? 'block' : 'hidden'}`}>
                <ManagementGantt tasks={tasks} />
            </div>
        </div>
    )
}
