'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, CheckCircle2, TrendingUp, Shield } from 'lucide-react'
import confetti from 'canvas-confetti'
import { markOnboardingSeen } from '@/lib/actions/user'
import Image from 'next/image'

interface OnboardingPopupProps {
    isOpen: boolean
    onClose: () => void
}

export function OnboardingPopup({ isOpen, onClose }: OnboardingPopupProps) {
    const [step, setStep] = useState(0)

    useEffect(() => {
        if (isOpen) {
            // Updated confetti config for a more impressive effect
            const duration = 2 * 1000
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
    }, [isOpen])

    const handleClose = async () => {
        await markOnboardingSeen()
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl rounded-3xl" dir="rtl">

                {/* Header Background */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-32 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <div className="bg-white p-3 rounded-full shadow-lg z-10 animate-in zoom-in duration-500">
                        <Image
                            src="/images/branding/K-LOGO.png"
                            alt="Logo"
                            width={60}
                            height={60}
                            className="h-10 w-auto"
                        />
                    </div>
                </div>

                <div className="px-8 pb-8 pt-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            ברוכים הבאים למערכת!
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            אנחנו שמחים שהצטרפתם. הנה כמה דברים שכדאי לדעת כדי להתחיל:
                        </p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-4 p-4 bg-blue-50 dark:bg-slate-800/50 rounded-xl border border-blue-100 dark:border-slate-700">
                            <div className="bg-blue-100 dark:bg-slate-700 p-2 rounded-lg">
                                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">מעקב תקציב חכם</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    צפו בהכנסות וההוצאות שלכם בזמן אמת וקבלו תובנות לשיפור.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-emerald-50 dark:bg-slate-800/50 rounded-xl border border-emerald-100 dark:border-slate-700">
                            <div className="bg-emerald-100 dark:bg-slate-700 p-2 rounded-lg">
                                <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">ניהול בטוח</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    המידע שלכם מאובטח ומוגן, ואתם בשליטה מלאה על הנתונים.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-indigo-50 dark:bg-slate-800/50 rounded-xl border border-indigo-100 dark:border-slate-700">
                            <div className="bg-indigo-100 dark:bg-slate-700 p-2 rounded-lg">
                                <CheckCircle2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">התחילו בקלות</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    הכנסו ללשונית "הוצאות" או "הכנסות" כדי להוסיף את הפעולה הראשונה שלכם.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleClose}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6 text-lg rounded-xl shadow-lg transition-transform hover:-translate-y-1"
                    >
                        מתחילים! 🚀
                    </Button>
                </div>

                <div className="absolute top-4 left-4">
                    <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
