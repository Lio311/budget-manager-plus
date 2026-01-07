'use client'

import { useState } from 'react'
import { motion, Reorder, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Plus,
    Calendar as CalendarIcon,
    User as UserIcon,
    Flag,
    MoreHorizontal,
    Search,
    Filter
} from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { NewTaskDialog } from './NewTaskDialog'

// Mock types if Prisma logic isn't fully picked up yet
type Task = {
    id: string;
    title: string;
    status: string; // 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'STUCK'
    priority: string;
    department: string;
    assignee?: string | null;
    dueDate?: Date | string | null;
}

const STATUS_COLORS: Record<string, string> = {
    'DONE': '#00C875',
    'IN_PROGRESS': '#FDAB3D',
    'STUCK': '#E2445C',
    'TODO': '#C4C4C4',
    'REVIEW': '#579BFC'
}

const STATUS_LABELS: Record<string, string> = {
    'DONE': 'בוצע',
    'IN_PROGRESS': 'בעבודה',
    'STUCK': 'תקוע',
    'TODO': 'לביצוע',
    'REVIEW': 'בבדיקה'
}

export function TaskBoard({ initialTasks }: { initialTasks: any[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [search, setSearch] = useState('')

    // Filter tasks
    const filteredTasks = tasks.filter(t => t.title.includes(search))

    return (
        <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <NewTaskDialog />
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="חיפוש..."
                            className="pl-10 pr-4 w-40 sm:w-64 bg-gray-50 border-gray-200 text-right"
                            dir="rtl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                        <Filter size={16} />
                        סינון
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 text-gray-600">
                        <UserIcon size={16} />
                        אחראי
                    </Button>
                </div>
            </div>

            {/* Task Table (Monday Style) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase sticky top-0 z-10">
                    <div className="col-span-1"></div> {/* Selection/Color */}
                    <div className="col-span-5 text-right">משימה</div>
                    <div className="col-span-2 text-center">אחראי</div>
                    <div className="col-span-2 text-center">סטטוס</div>
                    <div className="col-span-2 text-center">תאריך יעד</div>
                </div>

                {/* Rows */}
                <div className="divide-y divide-gray-100">
                    <AnimatePresence>
                        {filteredTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="grid grid-cols-12 gap-4 p-3 items-center hover:bg-gray-50/50 transition-colors group"
                            >
                                <div className="col-span-1 flex justify-center">
                                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: STATUS_COLORS[task.status] || '#ccc' }} />
                                </div>
                                <div className="col-span-5 flex items-center gap-3">
                                    <span className="font-medium text-gray-800 text-sm">{task.title}</span>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    {task.assignee ? (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-white shadow-sm" title={task.assignee}>
                                            {task.assignee.charAt(0)}
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                                            <UserIcon size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2">
                                    <div
                                        className="h-8 w-full flex items-center justify-center text-white text-xs font-bold px-2 cursor-pointer hover:opacity-90 transition-opacity"
                                        style={{ backgroundColor: STATUS_COLORS[task.status] || '#ccc' }}
                                    >
                                        {STATUS_LABELS[task.status] || task.status}
                                    </div>
                                </div>
                                <div className="col-span-2 flex justify-center text-gray-500 text-sm">
                                    {task.dueDate ? format(new Date(task.dueDate), 'd MMM', { locale: he }) : '-'}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredTasks.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            לא נמצאו משימות
                        </div>
                    )}
                </div>


            </div>
        </div>
    )
}
