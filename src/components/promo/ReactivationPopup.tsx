'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X, Gift, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { SignUpButton } from '@clerk/nextjs'

interface ReactivationPopupProps {
    shouldShow: boolean
}

export function ReactivationPopup({ shouldShow }: ReactivationPopupProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (shouldShow) {
            const hasSeenPopup = localStorage.getItem('hide_reactivation_popup')
            if (!hasSeenPopup) {
                // Delay to allow page to load a bit before popping up
                const timer = setTimeout(() => setIsOpen(true), 2000)
                return () => clearTimeout(timer)
            }
        }
    }, [shouldShow])

    const handleClose = () => {
        setIsOpen(false)
        localStorage.setItem('hide_reactivation_popup', 'true')
    }

    if (!shouldShow) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-lg md:max-w-2xl p-0 gap-0 overflow-hidden bg-transparent border-0 shadow-none">
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", duration: 0.6 }}
                            className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
                        >
                            {/* Close Button */}
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleClose}
                                className="absolute left-3 top-3 z-50 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-sm text-gray-500 hover:text-red-500 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </motion.button>

                            {/* Image Section */}
                            <div className="relative w-full aspect-video">
                                <Image
                                    src="/keseflow-pop.png"
                                    alt="Keseflow Offer"
                                    fill
                                    className="object-contain object-center"
                                    priority
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-90" />
                            </div>

                            {/* Content Section */}
                            <div className="relative px-6 pb-8 pt-2 text-center -mt-4 md:-mt-12">
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4 shadow-inner"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    <span>הטבה בלעדית לרגל ההשקה</span>
                                </motion.div>

                                <h2 className="text-3xl font-extrabold mb-3">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500">
                                        מבצע השקה
                                    </span>
                                </h2>

                                <div className="space-y-4 mb-8">
                                    <p className="text-gray-600 text-lg leading-relaxed">
                                        שמחים שהגעת אלינו! קבל/י
                                        <span className="px-1 font-bold text-green-600">חודשיים מתנה</span>
                                        לשימוש מלא במערכת.
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        ללא התחייבות • ללא פרטי אשראי
                                    </p>
                                </div>

                                <SignUpButton mode="modal">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleClose}
                                        className="w-full relative group overflow-hidden bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-green-200 hover:shadow-green-300 transition-all"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                                            אני רוצה את המתנה!
                                            <Gift className="w-5 h-5 animate-pulse" />
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    </motion.button>
                                </SignUpButton>

                                <div className="mt-4 space-y-1">
                                    <p className="text-[10px] text-gray-400 text-center">
                                        *בתוקף עד ה31.1.2026
                                    </p>
                                    <p className="text-[10px] text-gray-400 text-center">
                                        *החברה רשאית לעצור את המבצע בכל רגע נתון
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    )
}
