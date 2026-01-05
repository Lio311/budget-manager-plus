'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, PartyPopper } from 'lucide-react'
import confetti from 'canvas-confetti'
import { differenceInDays } from 'date-fns'

interface WelcomePopupProps {
    isOpen: boolean
    onClose: () => void
    trialEndsAt?: Date | null
    activeSubscription?: {
        endDate: Date | null
        planType: 'PERSONAL' | 'BUSINESS'
    } | null
    userName?: string
}

export function WelcomePopup({ isOpen, onClose, trialEndsAt, activeSubscription, userName }: WelcomePopupProps) {
    const [message, setMessage] = useState('')
    const [subMessage, setSubMessage] = useState('')

    useEffect(() => {
        if (isOpen) {
            // Determine the message based on subscription status
            const now = new Date()
            let shouldFireConfetti = true

            if (activeSubscription?.endDate) {
                // Active Subscription
                const daysLeft = differenceInDays(new Date(activeSubscription.endDate), now)
                setMessage('ברוכים השבים! שמחים שבחרת לנהל את הכסף שלך בצורה חכמה.')
                setSubMessage(`למנוי זה נותרו עוד ${Math.max(0, daysLeft)} ימים עד שיהיה צורך בחידוש מנוי.`)
            } else if (trialEndsAt) {
                // Trial Period
                const daysLeft = differenceInDays(new Date(trialEndsAt), now)
                if (daysLeft > 0) {
                    setMessage('ברוכים השבים! אתם בתקופת ניסיון.')
                    setSubMessage(`נותרו עוד ${daysLeft} ימים לתקופת הניסיון, לאחר מכן יש להסדיר תשלום.`)
                } else {
                    // Trial Expired
                    setMessage('תקופת הניסיון הסתיימה.')
                    setSubMessage(`יש להסדיר תשלום כדי להמשיך לנהל את הכסף בצורה חכמה.`)
                    shouldFireConfetti = false
                }
            } else {
                // No subscription / Fallback
                setMessage('ברוכים השבים!')
                setSubMessage('שמחים שבחרת לנהל את הכסף שלך בצורה חכמה.')
            }

            if (shouldFireConfetti) {
                const duration = 3 * 1000
                const animationEnd = Date.now() + duration
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

                const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now()

                    if (timeLeft <= 0) {
                        return clearInterval(interval)
                    }

                    const particleCount = 50 * (timeLeft / duration)
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                    })
                    confetti({
                        ...defaults,
                        particleCount,
                        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                    })
                }, 250)

                return () => clearInterval(interval)
            }
        }
    }, [isOpen, trialEndsAt, activeSubscription])

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md text-center bg-white dark:bg-slate-900 border-none shadow-2xl p-0 overflow-hidden rounded-3xl" dir="rtl">

                {/* Decorative Header */}
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-32 relative flex items-center justify-center">

                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm animate-in zoom-in duration-500">
                        <PartyPopper className="w-12 h-12 text-white" />
                    </div>

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                <div className="px-8 pb-8 pt-6 space-y-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-normal">
                        {message}
                    </h2>

                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-800">
                        <p className="text-gray-600 dark:text-gray-300 text-lg">
                            {subMessage}
                        </p>
                    </div>

                    <div className="pt-2">
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium font-handwriting text-xl">
                            המשך יום נעים!
                        </p>
                    </div>

                    <Button
                        onClick={onClose}
                        className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl py-6 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                    >
                        תודה, הבנתי
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
