import { CalendarViewWrapper } from '@/components/management/CalendarViewWrapper'
import { getTasks } from '@/lib/actions/management'
import { Loader2 } from 'lucide-react'
import { Suspense } from 'react'



export default function CalendarPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">לוח שנה</h2>
                    <p className="text-gray-500">תצוגת משימות על גבי לוח שנה</p>
                </div>
            </div>

            <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500 w-8 h-8" /></div>}>
                <CalendarContent />
            </Suspense>
        </div>
    )
}

async function CalendarContent() {
    const { success, data, error } = await getTasks()

    if (!success) {
        return <div className="p-4 text-red-500">Error loading tasks for calendar: {String(error)}</div>
    }

    // Sort by createdAt just in case, though API does it
    const sortedTasks = data?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []

    return <CalendarViewWrapper tasks={sortedTasks} />
}
