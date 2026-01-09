'use client'

import { useEffect, useRef } from 'react'
import { logVisitorLocation } from '@/lib/actions/tracking'

export function VisitorLocationTracker() {
    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        const trackLocation = async () => {
            try {
                // Check if already tracked this session to avoid spamming
                const sessionKey = 'visitor_location_tracked'
                if (sessionStorage.getItem(sessionKey)) return

                const res = await fetch('https://ipapi.co/json/')
                if (!res.ok) return

                const data = await res.json()
                if (data.city) {
                    await logVisitorLocation(data.city, data.country_name)
                    sessionStorage.setItem(sessionKey, 'true')
                }
            } catch (error) {
                // Silent fail
                console.error('Tracking error:', error)
            }
        }

        trackLocation()
    }, [])

    return null
}
