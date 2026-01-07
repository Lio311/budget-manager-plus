'use client'

import { useState } from 'react'
import { ManagementCalendar } from '@/components/management/ManagementCalendar'
import { ManagementGantt } from '@/components/management/ManagementGantt'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { NewTaskDialog } from '@/components/management/NewTaskDialog'
import { Calendar as CalendarIcon, BarChartHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CalendarViewWrapperProps {
    tasks: any[]
}

export function CalendarViewWrapper({ tasks }: CalendarViewWrapperProps) {
    const [view, setView] = useState<'calendar' | 'gantt'>('calendar')
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const router = useRouter()

    const handleTaskClick = (task: any) => {
        setSelectedTask(task)
        setIsDialogOpen(true)
    }

    const handleTaskUpdated = () => {
        router.refresh()
        setIsDialogOpen(false)
        setSelectedTask(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <ToggleGroup type="single" value={view} onValueChange={(v: string) => v && setView(v as 'calendar' | 'gantt')} className="bg-white p-1 rounded-lg border shadow-sm">
                    <ToggleGroupItem value="calendar" aria-label="Calendar View" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600">
                        <span className="text-xs font-medium">לוח שנה</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="gantt" aria-label="Gantt View" className="data-[state=on]:bg-blue-50 data-[state=on]:text-blue-600">
                        <span className="text-xs font-medium">גאנט</span>
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className={`transition-opacity duration-300 ${view === 'calendar' ? 'block' : 'hidden'}`}>
                <ManagementCalendar tasks={tasks} onTaskClick={handleTaskClick} />
            </div>

            <div className={`transition-opacity duration-300 ${view === 'gantt' ? 'block' : 'hidden'}`}>
                <ManagementGantt tasks={tasks} onTaskClick={handleTaskClick} />
            </div>

            {isDialogOpen && (
                <NewTaskDialog
                    open={isDialogOpen}
                    onOpenChange={setIsDialogOpen}
                    taskToEdit={selectedTask}
                    onTaskCreated={handleTaskUpdated}
                />
            )}
        </div>
    )
}
