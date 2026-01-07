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

const TEAM_MEMBERS = [
    { name: 'Lior', avatar: '/lior-profile.jpg', color: 'blue' },
    { name: 'Ron', avatar: '/team/ron.png', color: 'green' },
    { name: 'Leon', avatar: '/avatars/leon.png', color: 'purple' },
]

interface ManagementGanttProps {
    tasks: Task[]
    onTaskClick?: (task: any) => void
}

import { fixTaskTitle } from '@/lib/actions/management'

export function ManagementGantt({ tasks, onTaskClick }: ManagementGanttProps) {
    useEffect(() => {
        fixTaskTitle().then(res => {
            if (res.success) console.log('Task title fixed:', res.fixed)
        })
    }, [])

    // 1. Calculate Date Range (Show exactly 10 days around today)
    const today = new Date()
    const minDate = subDays(today, 2)
    const maxDate = addDays(today, 7)

    const days = eachDayOfInterval({ start: minDate, end: maxDate })

    // 2. Constants for layout
    const DAY_WIDTH = 80
    const HEADER_HEIGHT = 50
    const ROW_HEIGHT = 64
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

    // Helper to get member details
    const getMember = (name: string) => TEAM_MEMBERS.find(m => m.name === name)

    return (
        <Card className="flex h-[700px] border-none shadow-sm overflow-hidden bg-white relative">
            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar [data-radix-scroll-area-viewport] {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                .hide-scrollbar [data-radix-scroll-area-viewport]::-webkit-scrollbar {
                    display: none !important;
                }
            `}} />
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
                <ScrollArea className="flex-1 hide-scrollbar">
                    <div className="flex flex-col">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-center px-4 border-b hover:bg-gray-50 transition-colors group relative cursor-pointer"
                                style={{ height: ROW_HEIGHT }}
                                onClick={() => onTaskClick?.(task)}
                            >
                                <div className="flex items-center gap-3 w-full overflow-hidden flex-row-reverse text-right">
                                    {/* Color indicator strip on the right */}
                                    <div className={cn("w-1.5 h-8 rounded-full flex-shrink-0", getStatusColor(task.status))} />

                                    <div className="flex-1 min-w-0 text-right">
                                        <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight h-[2.5rem]" title={task.title}>
                                            {task.title}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium h-4 flex justify-start flex-row-reverse gap-1">
                                            {task.dueDate && (
                                                <span dir="rtl">{format(new Date(task.dueDate), 'd MMM', { locale: he })}</span>
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
            <ScrollArea className="flex-1 relative hide-scrollbar" dir="ltr">
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
                                        {format(day, 'EEE', { locale: he })}
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
                                const taskEnd = task.dueDate ? new Date(task.dueDate) : new Date()

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
                                                "absolute h-7 rounded-full shadow-sm flex items-center justify-between text-[11px] text-white font-bold px-3 whitespace-nowrap transition-all hover:brightness-110 cursor-pointer group/bar",
                                                getStatusColor(task.status)
                                            )}
                                            style={{
                                                left: daysFromStart * DAY_WIDTH + 2,
                                                width: durationDays * DAY_WIDTH - 4,
                                            }}
                                            onClick={() => onTaskClick?.(task)}
                                            title={`${task.title} (${durationDays} ימים)`}
                                        >
                                            <div className="flex items-center gap-1.5 overflow-hidden">
                                                {/* Avatars */}
                                                <div className="flex -space-x-2 mr-1">
                                                    {task.assignees.map((name, i) => {
                                                        const member = getMember(name)
                                                        return (
                                                            <Avatar key={i} className="h-5 w-5 border border-white shadow-sm hover:scale-125 transition-transform">
                                                                <AvatarImage src={member?.avatar} />
                                                                <AvatarFallback className="text-[8px] bg-slate-200 text-slate-700">
                                                                    {name[0]}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            {/* Duration Label */}
                                            <span className="flex-shrink-0 ml-2" dir="rtl">
                                                {durationDays} ימים
                                            </span>
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
