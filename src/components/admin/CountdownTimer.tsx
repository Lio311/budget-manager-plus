'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'

interface CountdownTimerProps {
    targetDate: Date
}

export function CountdownTimer({ targetDate }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState('')
    const [isExpired, setIsExpired] = useState(false)

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date()
            const difference = new Date(targetDate).getTime() - now.getTime()

            if (difference <= 0) {
                setIsExpired(true)
                setTimeLeft('Expired')
                return
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24))
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((difference % (1000 * 60)) / 1000)

            setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)

        return () => clearInterval(timer)
    }, [targetDate])

    if (isExpired) {
        return <span className="text-red-500 font-medium">Expired</span>
    }

    return (
        <span className="font-mono text-orange-600 font-medium">
            {timeLeft}
        </span>
    )
}
