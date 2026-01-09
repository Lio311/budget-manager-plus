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
                // Check if already tracked this session
                const sessionKey = 'visitor_location_tracked'
                if (sessionStorage.getItem(sessionKey)) return

                // 1. Try Browser Geolocation first (Ask for permission)
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        async (position) => {
                            try {
                                const { latitude, longitude } = position.coords

                                // Reverse Geocoding (Free API, client-side)
                                const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                                const geoData = await geoRes.json()

                                const city = geoData.locality || geoData.city || geoData.principalSubdivision
                                const country = geoData.countryName

                                if (city) {
                                    await logVisitorLocation(city, country)
                                    sessionStorage.setItem(sessionKey, 'true')
                                    return
                                }
                            } catch (e) {
                                console.error('Geocoding failed, falling back to IP', e)
                                fallbackToIp()
                            }
                        },
                        (error) => {
                            console.log('Geolocation denied/error, falling back to IP', error)
                            fallbackToIp()
                        },
                        { timeout: 10000 }
                    )
                } else {
                    fallbackToIp()
                }

                // 2. IP Fallback Logic
                async function fallbackToIp() {
                    try {
                        const res = await fetch('https://ipapi.co/json/')
                        if (!res.ok) return
                        const data = await res.json()
                        if (data.city) {
                            await logVisitorLocation(data.city, data.country_name)
                            sessionStorage.setItem(sessionKey, 'true')
                        }
                    } catch (err) {
                        console.error('IP Tracking error:', err)
                    }
                }

            } catch (error) {
                console.error('Tracking fatal error:', error)
            }
        }

        trackLocation()
    }, [])

    return null
}
