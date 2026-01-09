'use client'

import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface EmployeeStat {
    assignee: string | null
    _count: {
        id: number
    }
}

interface User {
    id: string
    firstName?: string | null
    lastName?: string | null
    email?: string
    image?: string | null
    [key: string]: any
}

interface TeamPerformanceBubbleMapProps {
    data: EmployeeStat[]
    users: User[]
    title: string
    badgeColor?: string
    countLabel?: string
}

export function PerformanceBubbles({ data, users, badgeColor = 'bg-green-500', countLabel = 'משימות הושלמו' }: Omit<TeamPerformanceBubbleMapProps, 'title'>) {
    // Filter out unassigned tasks if necessary, or label them "Unassigned"
    const filteredData = data.filter(d => d.assignee)

    // Find max value for scaling
    const maxCount = Math.max(...filteredData.map(d => d._count.id), 1)

    // Sort by count descending
    const sortedData = [...filteredData].sort((a, b) => b._count.id - a._count.id)

    // Hardcoded avatars for known team members
    const KNOWN_AVATARS: Record<string, string> = {
        'Lior': '/images/team/lior-profile.jpg',
        'Ron': '/images/team/ron.png',
        'Leon': '/images/team/leon.png'
    }

    // Helper to find user details
    const getUserDetails = (nameOrId: string | null) => {
        if (!nameOrId) return null
        if (KNOWN_AVATARS[nameOrId]) return { firstName: nameOrId, lastName: '', image: KNOWN_AVATARS[nameOrId], email: '' }
        const userByName = users.find(u => u.firstName === nameOrId || `${u.firstName} ${u.lastName}` === nameOrId || u.email === nameOrId)
        if (userByName) return userByName
        return { firstName: nameOrId, lastName: '', image: null, email: '' }
    }

    return (
        <div className="flex-1 flex flex-wrap items-center justify-center content-center gap-6 p-4 min-h-[160px]">
            {sortedData.map((stat) => {
                const count = stat._count.id
                const size = 60 + (count / maxCount) * 40
                const user = getUserDetails(stat.assignee)
                const initials = stat.assignee?.slice(0, 2).toUpperCase() || '??'

                return (
                    <TooltipProvider key={stat.assignee}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className="relative flex flex-col items-center justify-center transition-transform hover:scale-110 cursor-default animate-in zoom-in duration-500"
                                    style={{ width: `${size}px`, height: `${size}px` }}
                                >
                                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg">
                                        {user?.image ? (
                                            <img src={user.image} alt={stat.assignee || ''} className="w-full h-full object-cover object-top" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-xl">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`absolute -top-1 -right-1 ${badgeColor} text-white text-[10px] font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm z-10`}>
                                        {count}
                                    </div>
                                    <span className="absolute -bottom-6 text-[11px] font-semibold text-gray-700 whitespace-nowrap bg-white/80 px-2 rounded-full backdrop-blur-sm">
                                        {stat.assignee}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p className="font-bold text-right">{stat.assignee}</p>
                                <p className="text-right">{count} {countLabel}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )
            })}
            {data.length === 0 && <div className="text-gray-400 text-xs italic">אין נתונים</div>}
        </div>
    )
}

export function TeamPerformanceBubbleMap(props: TeamPerformanceBubbleMapProps) {
    return (
        <Card className="p-6 h-full min-h-[300px] flex flex-col">
            <h3 className="text-lg font-bold mb-6 text-right">{props.title}</h3>
            <PerformanceBubbles {...props} />
        </Card>
    )
}
