'use client'

import { useState } from 'react'
import { motion, Reorder, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Plus,
    Calendar as CalendarIcon,
    User as UserIcon,
    Flag,
    MoreHorizontal,
    Search,
    Filter,
    Clock,
    Trash2,
    Edit
} from 'lucide-react'
import { updateTask, deleteTask } from '@/lib/actions/management'

import { toast } from 'sonner'
import { TaskAnalytics } from '@/components/management/TaskAnalytics'
import { format } from 'date-fns'
import { NewTaskDialog } from '@/components/management/NewTaskDialog'

interface Task {
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'STUCK' | 'REVIEW'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    department: string
    assignees: string[]
    dueDate?: Date
    createdAt: Date
    updatedAt: Date
    creator?: {
        email: string
    }
}

const STATUS_COLORS: Record<string, string> = {
    'TODO': '#C4C4C4',
    'IN_PROGRESS': '#FDAB3D',
    'REVIEW': '#A25DDC',
    'DONE': '#00C875',
    'STUCK': '#E2445C',
}

export function TaskBoard({ initialTasks }: { initialTasks: any[] }) {
    const [tasks, setTasks] = useState<Task[]>(initialTasks)
    const [search, setSearch] = useState('')
    const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    const handleDeleteTask = async (taskId: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) return

        // Optimistic delete
        const oldTasks = [...tasks]
        setTasks(tasks.filter(t => t.id !== taskId))

        const res = await deleteTask(taskId)
        if (!res.success) {
            toast.error('שגיאה במחיקת המשימה')
            setTasks(oldTasks)
        } else {
            toast.success('המשימה נמחקה')
        }
    }

    const handleTaskCreated = (newTask: any) => {
        setTasks([newTask, ...tasks])
    }

    const handleStatusChange = async (taskId: string, newStatus: string) => {
        // Optimistic update
        const oldTasks = [...tasks]

        // We update status AND updatedAt so analytics reflect "Done now"
        const now = new Date()
        setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'], updatedAt: now } : t))

        const res = await updateTask(taskId, { status: newStatus as any })
        if (!res.success) {
            toast.error('שגיאה בעדכון סטטוס')
            setTasks(oldTasks)
        } else {
            toast.success('סטטוס עודכן')
        }
    }

    // Filter tasks
    const filteredTasks = tasks.filter(t => {
        const matchSearch = t.title.toLowerCase().includes(search.toLowerCase())
        const matchAssignee = assigneeFilter === 'ALL' || (t.assignees && t.assignees.includes(assigneeFilter))
        const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
        return matchSearch && matchAssignee && matchStatus
    })

    return (
        <div className="space-y-6">
            <TaskAnalytics tasks={tasks} />

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <NewTaskDialog onTaskCreated={handleTaskCreated} />
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
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[150px] h-9 gap-2">
                            <Filter size={16} className="text-gray-500" />
                            <SelectValue placeholder="סינון" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="ALL">כל הסטטוסים</SelectItem>
                            <SelectItem value="TODO">לביצוע</SelectItem>
                            <SelectItem value="IN_PROGRESS">בעבודה</SelectItem>
                            <SelectItem value="REVIEW">בבדיקה</SelectItem>
                            <SelectItem value="DONE">בוצע</SelectItem>
                            <SelectItem value="STUCK">תקוע</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger className="w-[150px] h-9 gap-2">
                            <UserIcon size={16} className="text-gray-500" />
                            <SelectValue placeholder="אחראי" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="ALL">כל הצוות</SelectItem>
                            <SelectItem value="Lior">Lior</SelectItem>
                            <SelectItem value="Ron">Ron</SelectItem>
                            <SelectItem value="Leon">Leon</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Task Table (Monday Style) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase sticky top-0 z-10">
                    <div className="col-span-1"></div> {/* Selection/Color */}
                    <div className="col-span-11 sm:col-span-3 text-right">משימה</div>
                    <div className="col-span-2 text-center hidden sm:block">נוצר ב</div>
                    <div className="col-span-2 text-center hidden sm:block">תאריך יעד</div>
                    <div className="col-span-1 text-center hidden sm:block">אחראי</div>
                    <div className="col-span-2 text-center hidden sm:block">סטטוס</div>
                    <div className="col-span-1 text-center hidden sm:block">פעולות</div>
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
                                <div className="col-span-11 sm:col-span-3 flex items-center gap-3">
                                    <span className="font-medium text-gray-800 text-sm">{task.title}</span>
                                </div>

                                <div className="col-span-2 hidden sm:flex justify-center flex-col items-center">
                                    <span className="text-xs text-gray-500">{format(new Date(task.createdAt), 'dd/MM/yy')}</span>
                                    <span className="text-[10px] text-gray-400">{format(new Date(task.createdAt), 'HH:mm')}</span>
                                </div>

                                <div className="col-span-2 hidden sm:flex justify-center">
                                    {task.dueDate ? (
                                        <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-xs text-gray-600">
                                            <CalendarIcon size={12} className="text-gray-400" />
                                            {format(new Date(task.dueDate), 'dd/MM/yy')}
                                        </div>
                                    ) : (
                                        <span className="text-gray-300 text-xs">-</span>
                                    )}
                                </div>

                                <div className="col-span-1 hidden sm:flex justify-center -space-x-2 space-x-reverse">
                                    {task.assignees && task.assignees.length > 0 ? (
                                        task.assignees.map((assignee, idx) => (
                                            <div key={idx} className="relative w-8 h-8 rounded-full overflow-hidden border border-white shadow-sm" title={assignee}>
                                                {assignee === 'Leon' ? (
                                                    <img src="/avatars/leon.png" alt="Leon" className="w-full h-full object-cover" />
                                                ) : assignee === 'Lior' ? (
                                                    <img src="/lior-profile.jpg" alt="Lior" className="w-full h-full object-cover object-top" />
                                                ) : assignee === 'Ron' ? (
                                                    <img src="/team/ron.png" alt="Ron" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                        {assignee.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 border border-dashed border-gray-300">
                                            <UserIcon size={14} />
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-2 hidden sm:block">
                                    <Select
                                        value={task.status}
                                        onValueChange={(val) => handleStatusChange(task.id, val)}
                                    >
                                        <SelectTrigger
                                            className="h-8 w-full border-none text-white text-xs font-bold px-2"
                                            style={{ backgroundColor: STATUS_COLORS[task.status] || '#ccc' }}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="TODO">לביצוע</SelectItem>
                                            <SelectItem value="IN_PROGRESS">בעבודה</SelectItem>
                                            <SelectItem value="REVIEW">בבדיקה</SelectItem>
                                            <SelectItem value="STUCK">תקוע</SelectItem>
                                            <SelectItem value="DONE">בוצע</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Actions Column */}
                                <div className="col-span-1 hidden sm:flex justify-center">
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => setEditingTask(task)}
                                            title="ערוך"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDeleteTask(task.id)}
                                            title="מחק"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
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

            {/* Edit Dialog */}
            {editingTask && (
                <NewTaskDialog
                    open={true}
                    onOpenChange={(open) => !open && setEditingTask(null)}
                    taskToEdit={editingTask}
                    onTaskCreated={(updatedTask) => {
                        setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t))
                        setEditingTask(null)
                    }}
                />
            )}
        </div>
    )
}

