import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function SkeletonCard() {
    return (
        <Card className="animate-pulse">
            <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            </CardContent>
        </Card>
    )
}

export function SkeletonStat() {
    return (
        <div className="monday-card p-4 border-l-4 border-l-gray-300 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-24"></div>
        </div>
    )
}

export function SkeletonTable() {
    return (
        <div className="space-y-2 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-3 border rounded">
                    <div className="h-4 bg-gray-200 rounded flex-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
            ))}
        </div>
    )
}

export function SkeletonChart() {
    return (
        <div className="h-[300px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
            <div className="text-gray-400">טוען נתונים...</div>
        </div>
    )
}
