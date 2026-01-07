import { TaskBoard } from '@/components/management/TaskBoard'
import { getTasks } from '@/lib/actions/management'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'

async function TasksContent() {
    const { success, data, error } = await getTasks()

    if (!success) {
        return <div className="p-4 text-red-500">Error loading tasks: {String(error)}</div>
    }

    return <TaskBoard initialTasks={data || []} />
}

export default function TasksPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">לוח משימות</h2>
                    <p className="text-gray-500">ניהול כל המשימות בפרויקט</p>
                </div>
            </div>

            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>}>
                <TasksContent />
            </Suspense>
        </div>
    )
}
