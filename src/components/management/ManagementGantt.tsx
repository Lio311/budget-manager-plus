'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
    addDays,
    differenceInDays,
    format,
    isSameDay,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isToday,
    subDays,
    addMonths,
    getDay
} from 'date-fns'
import { he } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface Task {
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'STUCK'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    assignees: string[]
    dueDate?: Date
    createdAt: Date
    updatedAt: Date
    creator?: {
        email: string
    }
}

interface ManagementGanttProps {
    tasks: Task[]
}

export function ManagementGantt({ tasks }: ManagementGanttProps) {
    // 1. Calculate Date Range
    // Find min start date and max end date from tasks, with some buffer
    const today = new Date()
    const taskDates = tasks.flatMap(t => [
        t.createdAt ? new Date(t.createdAt) : today,
        t.dueDate ? new Date(t.dueDate) : today
    ])

    const minTime = taskDates.length > 0 ? Math.min(...taskDates.map(d => d.getTime())) : today.getTime()
    const maxTime = taskDates.length > 0 ? Math.max(...taskDates.map(d => d.getTime())) : today.getTime()

    const minDate = subDays(new Date(minTime), 7)
    const maxDate = addMonths(new Date(maxTime), 1)

    const days = eachDayOfInterval({ start: minDate, end: maxDate })

    // 2. Constants for layout
    const DAY_WIDTH = 40
    const HEADER_HEIGHT = 50
    const ROW_HEIGHT = 50
    const SIDEBAR_WIDTH = 300

    // 3. Status Colors
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE': return 'bg-green-500 hover:bg-green-600'
            case 'IN_PROGRESS': return 'bg-amber-400 hover:bg-amber-500' // Monday.com Orange-ish
            case 'STUCK': return 'bg-rose-500 hover:bg-rose-600'
            case 'TODO': return 'bg-slate-400 hover:bg-slate-500'
            default: return 'bg-slate-400'
        }
    }

    return (
        <Card className="flex h-[700px] border-none shadow-sm overflow-hidden bg-white">
            {/* LEFT SIDEBAR: Task List */}
            <div
                className="flex-shrink-0 border-l border-gray-200 bg-white z-20 flex flex-col shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]"
                style={{ width: SIDEBAR_WIDTH }}
            >
                {/* Header */}
                <div
                    className="flex items-center px-4 border-b bg-gray-50/50 font-bold text-gray-700 text-sm"
                    style={{ height: HEADER_HEIGHT }}
                >
                    משימה
                </div>

                {/* Rows */}
                <ScrollArea className="flex-1">
                    <div className="flex flex-col">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center px-4 border-b hover:bg-gray-50 transition-colors group relative"
                                style={{ height: ROW_HEIGHT }}
                            >
                                <div className="flex items-center gap-3 w-full overflow-hidden">
                                    {/* Color indicator strip */}
                                    <div className={cn("w-1.5 h-8 rounded-full flex-shrink-0", getStatusColor(task.status))} />

                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate" title={task.title}>
                                            {task.title}
                                        </div>
                                        <div className="text-[10px] text-gray-500 flex items-center gap-2">
                                            {task.dueDate && (
                                                <span>{format(new Date(task.dueDate), 'd MMM', { locale: he })}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* RIGHT SIDE (TIMELINE): Scrollable */}
            <ScrollArea className="flex-1 relative" dir="ltr">
                <div className="flex flex-col min-w-max">
                    {/* Timeline Header */}
                    <div className="sticky top-0 z-10 bg-white border-b flex">
                        {days.map((day) => {
                            const isCurrentDay = isToday(day)

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={cn(
                                        "flex flex-col items-center justify-center border-r text-xs flex-shrink-0 select-none",
                                        isCurrentDay ? "bg-blue-50 text-blue-700 font-bold" : "text-gray-500",
                                        getDay(day) === 6 ? "bg-gray-50/50" : "" // Saturday highlight
                                    )}
                                    style={{ width: DAY_WIDTH, height: HEADER_HEIGHT }}
                                >
                                    <span className="text-[10px] uppercase font-bold text-gray-400">
                                        {format(day, 'EEE')}
                                    </span>
                                    <span className="text-sm">
                                        {format(day, 'd')}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    {/* Timeline Grid & Bars */}
                    <div className="relative">
                        {/* Background Grid Lines */}
                        <div className="absolute inset-0 flex pointer-events-none">
                            {days.map((day) => (
                                <div
                                    key={`grid-${day.toISOString()}`}
                                    className={cn(
                                        "border-r h-full flex-shrink-0",
                                        getDay(day) === 6 ? "bg-gray-50/50" : "" // Saturday
                                    )}
                                    style={{ width: DAY_WIDTH }}
                                />
                            ))}
                        </div>

                        {/* Task Rows */}
                        <div className="flex flex-col relative z-0">
                            {tasks.map((task) => {
                                // Calculate Bar Position
                                const taskStart = task.createdAt ? new Date(task.createdAt) : new Date()
                                const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date() // If no due date, assume single day or now

                                // Ensure start comes before end
                                const startDate = taskStart < taskEnd ? taskStart : taskEnd
                                const endDate = taskEnd > taskStart ? taskEnd : taskStart

                                // Days from timeline start
                                const daysFromStart = differenceInDays(startDate, minDate)
                                const durationDays = Math.max(1, differenceInDays(endDate, startDate) + 1)

                                return (
                                    <div
                                        key={`timeline-${task.id}`}
                                        className="border-b relative flex items-center hover:bg-gray-50/30 transition-colors"
                                        style={{ height: ROW_HEIGHT }}
                                    >
                                        {/* The Gantt Bar */}
                                        <div
                                            className={cn(
                                                "absolute h-6 rounded-full shadow-sm flex items-center justify-center text-[10px] text-white font-medium px-2 whitespace-nowrap overflow-hidden transition-all hover:brightness-110 cursor-pointer",
                                                getStatusColor(task.status)
                                            )}
                                            style={{
                                                left: daysFromStart * DAY_WIDTH + 2, // +2 for spacing
                                                width: durationDays * DAY_WIDTH - 4, // -4 for spacing
                                            }}
                                            title={`${task.title} (${differenceInDays(endDate, startDate)} days)`}
                                        >
                                            {durationDays > 2 && (
                                                <span className="truncate w-full text-center px-1">
                                                    {differenceInDays(endDate, startDate)} ימים
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Current Time Line */}
                        {isSameDay(today, minDate) || today > minDate && today < maxDate ? (
                            <div
                                className="absolute top-0 bottom-0 border-l-2 border-blue-500 z-10 pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                style={{ left: differenceInDays(today, minDate) * DAY_WIDTH + (DAY_WIDTH / 2) }}
                            >
                                <div className="bg-blue-500 text-white text-[9px] px-1 py-0.5 rounded-full absolute -top-2 -left-3 font-bold">
                                    היום
                                </div>
                            </div>
                        ) : null}

                    </div>
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </Card>
    )
}
