'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'

function ProcessingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextUrl = searchParams.get('next') || '/dashboard'
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const duration = 10000 // 10 seconds
        const interval = 100 // Update every 100ms
        const steps = duration / interval
        const increment = 100 / steps

        const timer = setInterval(() => {
            setProgress(prev => {
                const newValue = prev + increment
                if (newValue >= 100) {
                    clearInterval(timer)
                    router.push(nextUrl)
                    return 100
                }
                return newValue
            })
        }, interval)

        return () => clearInterval(timer)
    }, [router, nextUrl])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white" dir="rtl">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md p-8 text-center space-y-8"
            >
                <div className="relative w-32 h-32 mx-auto mb-8">
                    <Image
                        src="/images/branding/K-LOGO.png"
                        alt="Kesefly"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <div className="space-y-4">
                    <h1 className="text-2xl font-bold text-gray-900">מכינים את החשבון שלך...</h1>
                    <p className="text-gray-500">אנחנו מגדירים את הסביבה האישית שלך, זה ייקח כמה שניות.</p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>התקדמות</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-gray-100" indicatorClassName="bg-emerald-500 transition-all duration-300 ease-linear" />
                </div>

                <div className="pt-8">
                    {/* Optional: Add nice tips or quotes here while waiting */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                        className="text-sm text-gray-400 italic"
                    >
                        "הצעד הראשון לביטחון כלכלי הוא שליטה בהוצאות."
                    </motion.p>
                </div>
            </motion.div>
        </div>
    )
}

export default function ProcessingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-pulse bg-gray-200 h-32 w-32 rounded-full"></div>
        </div>}>
            <ProcessingContent />
        </Suspense>
    )
}
