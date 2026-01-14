'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Progress } from '@/components/ui/progress'
import { startTrialForCurrentUser } from '@/lib/actions/subscription'

function ProcessingContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const nextUrl = searchParams.get('next') || '/dashboard'
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Background trial activation
        const checkAndStartTrial = async () => {
            const hasTrialParam = nextUrl.includes('trial=true') || searchParams.get('trial') === 'true'

            if (hasTrialParam) {
                console.log('Starting trial in background...')
                try {
                    await startTrialForCurrentUser('PERSONAL')
                    console.log('Background trial activation completed')
                } catch (error) {
                    console.error('Background trial activation failed:', error)
                }
            }
        }

        checkAndStartTrial()
    }, [nextUrl, searchParams])

    useEffect(() => {
        const duration = 5000 // 5 seconds
        const interval = 50 // Update every 50ms for smoother animation
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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-emerald-50 overflow-hidden relative" dir="rtl">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-emerald-300/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.3, 0.4, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-300/20 rounded-full blur-3xl"
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md p-8 text-center space-y-10 relative z-10"
            >
                {/* Logo with pulse effect */}
                <div className="relative w-32 h-32 mx-auto mb-8">
                    <motion.div
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="w-full h-full relative"
                    >
                        <Image
                            src="/images/branding/K-LOGO.png"
                            alt="Kesefly"
                            fill
                            className="object-contain drop-shadow-lg"
                            priority
                        />
                    </motion.div>
                </div>

                <div className="space-y-4">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-3xl font-bold text-gray-900 tracking-tight whitespace-nowrap"
                    >
                        מכינים את החשבון המדהים שלך...
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-gray-600"
                    >
                        אנחנו מגדירים את הסביבה האישית שלך, זה ממש תכף קורה
                    </motion.p>
                </div>

                <div className="space-y-3 relative">
                    <div className="flex justify-between text-sm text-gray-600 font-medium px-1">
                        <span>התקדמות</span>
                        <motion.span
                            key={Math.round(progress)}
                            initial={{ scale: 1.2, color: '#10b981' }}
                            animate={{ scale: 1, color: '#4b5563' }}
                        >
                            {Math.round(progress)}%
                        </motion.span>
                    </div>

                    <div className="h-4 bg-gray-100/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-200/50 shadow-inner">
                        <motion.div
                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ ease: "linear" }}
                        />
                    </div>
                </div>

                <div className="pt-8 min-h-[80px]">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 }}
                        className="text-lg font-medium text-emerald-600/80 italic"
                    >
                        "הצעד הראשון לביטחון כלכלי הוא שליטה בהוצאות"
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
