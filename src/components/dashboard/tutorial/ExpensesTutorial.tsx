'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false)
    useEffect(() => {
        const media = window.matchMedia(query)
        if (media.matches !== matches) {
            setMatches(media.matches)
        }
        const listener = () => setMatches(media.matches)
        window.addEventListener('resize', listener)
        return () => window.removeEventListener('resize', listener)
    }, [matches, query])
    return matches
}

interface ExpensesTutorialProps {
    isOpen: boolean
    onClose: () => void
}

interface CardConfig {
    id: string
    title: string
    text: string
    placement: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
    maxWidth?: number
}

const cards: CardConfig[] = [
    {
        id: 'expenses-stats-cards',
        title: 'סיכום הוצאות',
        text: 'כאן מוצג סך ההוצאות החודשי. מעקב שוטף עוזר להימנע מחריגות מהתקציב.',
        placement: 'bottom',
        align: 'center',
        maxWidth: 300
    },
    {
        id: 'expenses-add-section',
        title: 'הוספת הוצאה חדשה',
        text: 'השתמש בטופס זה להוספת הוצאה חדשה. בחר קטגוריה מתאימה (כגון שכר דירה, מזון וכו\') ותעד כל הוצאה בזמן אמת.',
        placement: 'right', // Desktop: Form on left
        align: 'start',
        maxWidth: 300
    },
    {
        id: 'expenses-controls',
        title: 'חיפוש ומיון',
        text: 'ניתן לחפש הוצאות ספציפיות, לסנן לפי קטגוריות ולמיין את הרשימה כדי לראות את ההוצאות הגבוהות ביותר בראש.',
        placement: 'bottom',
        align: 'end',
        maxWidth: 300
    },
    {
        id: 'expenses-list-container',
        title: 'רשימת הוצאות',
        text: 'רשימה מרוכזת של כל ההוצאות. ניתן לערוך או למחוק הוצאות, ולצפות בפרטים נוספים כמו חשבוניות מצורפות.',
        placement: 'top',
        align: 'center',
        maxWidth: 320
    }
]

export function ExpensesTutorial({ isOpen, onClose }: ExpensesTutorialProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const isMobile = useMediaQuery('(max-width: 768px)')

    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0)
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen && cards[currentStep]) {
            const element = document.getElementById(cards[currentStep].id)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }
        }
    }, [isOpen, currentStep])

    if (!isOpen) return null

    const handleNext = () => {
        if (currentStep < cards.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            onClose()
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const currentCard = cards[currentStep]

    if (isMobile) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 pointer-events-auto"
                        onClick={onClose}
                    />
                    <motion.div
                        key="mobile-card"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-t-2xl p-6 shadow-xl z-50 m-4 pointer-events-auto"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{currentCard.title}</h3>
                            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 -mt-1 -mr-2">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm leading-relaxed">
                            {currentCard.text}
                        </p>
                        <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-400" dir="ltr">
                                {currentStep + 1} / {cards.length}
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentStep === 0}>
                                    הקודם
                                </Button>
                                <Button className="bg-[#323338] hover:bg-black text-white" size="sm" onClick={handleNext}>
                                    {currentStep === cards.length - 1 ? 'סיום' : 'הבא'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        )
    }

    const targetElement = document.getElementById(currentCard.id)
    const rect = targetElement?.getBoundingClientRect()

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 pointer-events-auto"
                    onClick={onClose}
                />

                {rect && (
                    <motion.div
                        layoutId="highlight-ring-expenses"
                        className="absolute border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none z-40 transition-all duration-500 ease-in-out"
                        style={{
                            top: rect.top + window.scrollY - 8,
                            left: rect.left + window.scrollX - 8,
                            width: rect.width + 16,
                            height: rect.height + 16,
                        }}
                    />
                )}

                {rect && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="absolute z-50 pointer-events-auto"
                        style={{
                            top: (currentCard.placement === 'bottom' ? rect.bottom + 24 :
                                currentCard.placement === 'top' ? rect.top - 200 :
                                    rect.top) + window.scrollY,
                            left: (currentCard.placement === 'left' ? rect.left - 340 :
                                currentCard.placement === 'right' ? rect.right + 24 :
                                    rect.left + (rect.width / 2) - 150) + window.scrollX,
                            ...(currentCard.placement === 'bottom' && currentCard.align === 'end' ? { left: rect.right - 300 + window.scrollX } : {}),
                            ...(currentCard.placement === 'bottom' && currentCard.align === 'start' ? { left: rect.left + window.scrollX } : {}),
                        }}
                    >
                        <div
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-5 border border-gray-200 dark:border-slate-700 relative"
                            style={{ width: currentCard.maxWidth || 300 }}
                        >
                            <div className={`absolute w-4 h-4 bg-white dark:bg-slate-800 transform rotate-45 border-l border-t border-gray-200 dark:border-slate-700
                                ${currentCard.placement === 'bottom' ? '-top-2 left-1/2 -ml-2' : ''}
                                ${currentCard.placement === 'top' ? '-bottom-2 left-1/2 -ml-2 border-l-0 border-t-0 border-r border-b' : ''}
                                ${currentCard.placement === 'right' ? 'top-6 -left-2' : ''}
                                ${currentCard.placement === 'left' ? 'top-6 -right-2 border-l-0 border-t-0 border-r border-b' : ''}
                            `} />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{currentCard.title}</h4>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 leading-relaxed">
                                    {currentCard.text}
                                </p>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-xs text-muted-foreground" dir="ltr">
                                        {currentStep + 1} / {cards.length}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handlePrev}
                                            disabled={currentStep === 0}
                                            className="h-8 w-8 p-0 rounded-full"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleNext}
                                            className="h-8 px-4 bg-[#323338] hover:bg-black text-white rounded-full text-xs"
                                        >
                                            {currentStep === cards.length - 1 ? 'סיום' : (
                                                <div className="flex items-center gap-1">
                                                    הבא
                                                    <ChevronLeft className="h-3 w-3" />
                                                </div>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </AnimatePresence>
    )
}
