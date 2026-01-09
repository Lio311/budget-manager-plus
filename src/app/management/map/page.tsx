import { IsraelMapWidget } from '@/components/management/IsraelMapWidget'
import { getUserLocations } from '@/lib/actions/management'

export default async function MapPage() {
    const { success, data } = await getUserLocations()

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">מפת משתמשים</h2>
            <div className="h-[800px]">
                <IsraelMapWidget locations={success && data ? data : []} />
            </div>
        </div>
    )
}
