'use client'

import { useState, useEffect } from 'react'
import { getMySubscriptionStatus } from '@/lib/actions/subscription'
import { Loader2, Calendar, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusInfo {
    hasAccess: boolean
    status: string
    endDate: Date | null
    planType: string
    daysUntilExpiry: number | null
}

export function SubscriptionStatus() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<{ personal: StatusInfo, business: StatusInfo, userEmail: string } | null>(null)

    useEffect(() => {
        getMySubscriptionStatus().then(res => {
            if (res.success && res.data) {
                // Parse dates back from server serialization
                const parse = (item: any) => ({
                    ...item,
                    endDate: item.endDate ? new Date(item.endDate) : null
                })
                setData({
                    personal: parse(res.data.personal),
                    business: parse(res.data.business),
                    userEmail: res.data.userEmail || ''
                })
            }
            setLoading(false)
        })
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>טוען פרטי מנוי...</p>
            </div>
        )
    }

    if (!data) {
        return <div className="p-4 text-center text-red-500">שגיאה בטעינת נתונים</div>
    }

    const { personal, business } = data

    const renderCard = (info: StatusInfo, title: string) => {
        const isTrial = info.status === 'trial'
        const isActive = info.status === 'active' || isTrial
        const isExpired = !isActive

        let statusText = 'לא פעיל'
        let colorClass = 'text-gray-500 bg-gray-50 border-gray-200'
        let icon = <XCircle className="w-5 h-5" />

        if (isTrial) {
            statusText = 'תקופת ניסיון'
            colorClass = 'text-blue-600 bg-blue-50 border-blue-200'
            icon = <Clock className="w-5 h-5" />
        } else if (isActive) {
            statusText = 'מנוי פעיל'
            colorClass = 'text-green-600 bg-green-50 border-green-200'
            icon = <CheckCircle className="w-5 h-5" />
        } else if (info.status === 'trial_expired') {
            statusText = 'תקופת ניסיון הסתיימה'
            colorClass = 'text-orange-600 bg-orange-50 border-orange-200'
            icon = <AlertTriangle className="w-5 h-5" />
        }

        return (
            <div className={cn("border rounded-xl p-4 transition-all hover:shadow-sm", colorClass)}>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">{title}</h3>
                    {icon}
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="opacity-80">סטטוס:</span>
                        <span className="font-bold">{statusText}</span>
                    </div>

                    {isActive && info.daysUntilExpiry !== null && (
                        <div className="flex justify-between text-sm mt-2 pt-2 border-t border-black/5">
                            <span className="opacity-80">נותרו:</span>
                            <span className="font-bold text-lg">{info.daysUntilExpiry} ימים</span>
                        </div>
                    )}

                    {isActive && info.endDate && (
                        <div className="flex justify-between text-xs mt-1">
                            <span className="opacity-70">בתוקף עד:</span>
                            <span className="font-mono">{info.endDate.toLocaleDateString('he-IL')}</span>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="p-1 space-y-6 text-right" dir="rtl">
            <div>
                <h2 className="text-xl font-bold mb-1 text-[#323338] dark:text-gray-100 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-purple-600" />
                    ניהול מנוי
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    פרטי התוכניות שלך ותוקף המנויים
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {renderCard(personal, 'תוכנית אישית')}
                {renderCard(business, 'תוכנית עסקית')}
            </div>

            <div className="text-xs text-center text-gray-400 mt-4">
                החשבון משויך לכתובת: {data.userEmail}
            </div>
        </div>
    )
}
