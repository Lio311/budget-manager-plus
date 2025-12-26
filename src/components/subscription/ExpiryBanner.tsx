'use client'

import { useEffect, useState } from 'react'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'

export function ExpiryBanner() {
    const { userId } = useAuth()
    const [daysLeft, setDaysLeft] = useState<number | null>(null)
    const [planType, setPlanType] = useState<string>('PERSONAL')

    useEffect(() => {
        if (userId) {
            getSubscriptionStatus(userId).then((status) => {
                setDaysLeft(status.daysUntilExpiry)
                if (status.planType) {
                    setPlanType(status.planType)
                }
            })
        }
    }, [userId])

    if (!daysLeft || daysLeft > 30) return null

    const isUrgent = daysLeft <= 7
    const price = planType === 'BUSINESS' ? 129 : 89

    return (
        <div className={`p-4 ${isUrgent ? 'bg-red-100 border-red-500' : 'bg-yellow-100 border-yellow-500'} border-b-4`}>
            <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className={`font-bold ${isUrgent ? 'text-red-800' : 'text-yellow-800'}`}>
                        {isUrgent ? 'התראה אחרונה!' : 'תזכורת'}
                    </p>
                    <p className={isUrgent ? 'text-red-700' : 'text-yellow-700'}>
                        המנוי שלך יפוג בעוד {daysLeft} ימים. חדש עכשיו כדי לא לאבד את הנתונים!
                    </p>
                </div>
                <Link
                    href={`/subscribe?plan=${planType}`}
                    className={`px-6 py-2 rounded-lg font-bold text-white ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'
                        }`}
                >
                    חדש מנוי - ₪{price}
                </Link>
            </div>
        </div>
    )
}
