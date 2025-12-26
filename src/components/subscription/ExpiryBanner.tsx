'use client'

import { useEffect, useState } from 'react'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { useAuth } from '@clerk/nextjs'
import { useBudget } from '@/contexts/BudgetContext'
import Link from 'next/link'

export function ExpiryBanner() {
    const { userId } = useAuth()
    const { budgetType } = useBudget()
    const [daysLeft, setDaysLeft] = useState<number | null>(null)
    const [status, setStatus] = useState<string>('none')

    useEffect(() => {
        if (userId) {
            getSubscriptionStatus(userId, budgetType).then((res) => {
                setDaysLeft(res.daysUntilExpiry)
                setStatus(res.status)
            })
        }
    }, [userId, budgetType])

    // Hide if no data, or if it expires far in the future
    if (daysLeft === null || daysLeft > 30) return null

    // Hide if it's already expired (handled by Paywall or redirect)
    if (daysLeft < 0) return null

    const isUrgent = daysLeft <= 7
    const price = budgetType === 'BUSINESS' ? 129 : 89
    const isTrial = status === 'trial'

    return (
        <div className={`p-4 ${isUrgent ? 'bg-red-100 border-red-500' : 'bg-yellow-100 border-yellow-500'} border-b-4`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className={`font-bold ${isUrgent ? 'text-red-800' : 'text-yellow-800'}`}>
                        {isTrial ? (isUrgent ? 'תקופת הניסיון מסתיימת!' : 'תקופת ניסיון') : (isUrgent ? 'התראה אחרונה!' : 'תזכורת')}
                    </p>
                    <p className={isUrgent ? 'text-red-700' : 'text-yellow-700'}>
                        המנוי {isTrial ? 'החינמי' : ''} שלך יפוג בעוד {daysLeft} ימים.
                        חדש עכשיו כדי {isTrial ? 'להמשיך להשתמש בשירות' : 'לא לאבד את הנתונים'}!
                    </p>
                </div>
                <Link
                    href={`/subscribe?plan=${budgetType}`}
                    className={`px-6 py-2 rounded-lg font-bold text-white shadow-md transition-all ${isUrgent ? 'bg-red-600 hover:bg-red-700 active:scale-95' : 'bg-yellow-600 hover:bg-yellow-700 active:scale-95'
                        }`}
                >
                    חדש מנוי {budgetType === 'BUSINESS' ? 'עסקי' : 'פרטי'} - ₪{price}
                </Link>
            </div>
        </div>
    )
}
