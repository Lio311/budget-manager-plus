import { Button } from "@/components/ui/button"
import { Calendar, RefreshCw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { syncBudgetToGoogleCalendar } from "@/lib/actions/calendar"
import { useBudget } from "@/contexts/BudgetContext"

export function CalendarSyncButton() {
    const { month, year } = useBudget()
    const [loading, setLoading] = useState(false)

    const handleSync = async () => {
        try {
            setLoading(true)
            // 1. Check if connected (we can just try sync, handling 401 redirect is harder here)
            // But let's assume if it fails with "connected expired", we show that.

            // Trigger Sync
            const { budgetType } = useBudget()
            const result = await syncBudgetToGoogleCalendar(month, year, budgetType)

            if (result.success) {
                toast.success(`סונכרנו ${result.count} אירועים ליומן גוגל!`)
            } else {
                if (result.error?.includes('not enabled') || result.error?.includes('expired')) {
                    // Redirect to auth
                    window.location.href = '/api/auth/google/calendar'
                } else {
                    toast.error(result.error || 'שגיאה בסנכרון')
                }
            }
        } catch (err) {
            toast.error('שגיאה בסנכרון')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={loading}
            className="gap-2 text-gray-600 hover:text-blue-600 border-gray-200 hover:border-blue-200"
            title="סנכרן עם גוגל יומן"
        >
            <Calendar className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'מסנכרן...' : (
                <div className="flex items-center gap-1">
                    סנכרן עם
                    <img src="/calender.png" alt="Google Calendar" className="h-5 w-auto object-contain" />
                </div>
            )}
        </Button>
    )
}
