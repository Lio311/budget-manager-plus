// Common skeleton patterns for all tabs

export const SkeletonStatCards = ({ count = 3 }: { count?: number }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="monday-card p-4 border-l-4 border-l-gray-300 dark:border-l-slate-600 bg-white dark:bg-slate-800 min-w-0 animate-pulse border-gray-100 dark:border-slate-700">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
        ))}
    </div>
)

export const SkeletonList = ({ count = 3 }: { count?: number }) => (
    <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl animate-pulse">
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-32"></div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-12"></div>
                </div>
            </div>
        ))}
    </div>
)

export const SkeletonValue = ({ loading, value }: { loading: boolean; value: string | number }) => (
    <span className={loading ? 'animate-pulse' : ''}>
        {loading ? '...' : value}
    </span>
)
