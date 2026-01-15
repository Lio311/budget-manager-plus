import { GitAnalytics } from '@/components/management/GitAnalytics'

export default function GitPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">ניתוח Git</h2>
                    <p className="text-gray-500">סטטיסטיקות פעילות וקוד</p>
                </div>
            </div>
            <GitAnalytics />
        </div>
    )
}
