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

interface IncomeTutorialProps {
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
        id: 'income-stats-cards',
        title: 'סיכום הכנסות',
        text: 'כאן ניתן לראות את סך ההכנסות לתקופה הנוכחית. עבור עוסקים, מוצג גם חישוב משוער של הנטו לאחר הפרשות למס.',
        placement: 'bottom',
        align: 'center',
        maxWidth: 300
    },
    {
        id: 'income-add-section',
        title: 'הוספת הכנסה חדשה',
        text: 'ניתן להוסיף הכנסה חדשה במהירות באמצעות הטופס. יש לבחור קטגוריה, סכום, תאריך ואמצעי תשלום. ניתן גם לשייך את ההכנסה ללקוח ספציפי.',
        placement: 'right', // On desktop, form is on left, so tooltip on right is good
        align: 'start',
        maxWidth: 300
    },
    {
        id: 'income-controls',
        title: 'חיפוש ומיון',
        text: 'ניתן לחפש הכנסות לפי תיאור או לקוח, ולמיין את הרשימה לפי תאריך, סכום, קטגוריה ועוד.',
        placement: 'bottom',
        align: 'end',
        maxWidth: 300
    },
    {
        id: 'income-list-container',
        title: 'רשימת הכנסות',
        text: 'כאן מופיעות כל ההכנסות. לחיצה על שורה מאפשרת עריכה מהירה, וניתן למחוק או לשנות סטטוס בקלות.',
        placement: 'top',
        align: 'center',
        maxWidth: 320
    }
]

export function IncomeTutorial({ isOpen, onClose }: IncomeTutorialProps) {
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

    // Calculate position (simplified for this context, can be enhanced with Popper.js or similar if needed)
    // For now, we rely on the component being fixed overlay and manually positioning relatively or centrally on mobile

    // Mobile View: Centered card at bottom
    if (isMobile) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50 pointer-events-auto"
                        onClick={onClose}
                    />

                    {/* Mobile Card */}
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
                            <div className="text-sm text-gray-400">
                                {currentStep + 1} מתוך {cards.length}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handlePrev}
                                    disabled={currentStep === 0}
                                >
                                    הקודם
                                </Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    size="sm"
                                    onClick={handleNext}
                                >
                                    {currentStep === cards.length - 1 ? 'סיים' : 'הבא'}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        )
    }

    // Desktop View: Highlight Element + Floating Card
    const targetElement = document.getElementById(currentCard.id)
    const rect = targetElement?.getBoundingClientRect()

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
                {/* Backdrop with hole cut out (simulated by 4 divs or SVG mask - using simple overlay for now) */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 pointer-events-auto"
                    onClick={onClose}
                />

                {/* Highlight Effect (Ring around target) */}
                {rect && (
                    <motion.div
                        layoutId="highlight-ring"
                        className="absolute border-2 border-white rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none z-40 transition-all duration-500 ease-in-out"
                        style={{
                            top: rect.top - 8,
                            left: rect.left - 8,
                            width: rect.width + 16,
                            height: rect.height + 16,
                        }}
                    />
                )}

                {/* Tooltip Card */}
                {rect && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="absolute z-50 pointer-events-auto"
                        style={{
                            top: currentCard.placement === 'bottom' ? rect.bottom + 24 :
                                currentCard.placement === 'top' ? rect.top - 200 : // Approx height check
                                    rect.top,
                            left: currentCard.placement === 'left' ? rect.left - 340 :
                                currentCard.placement === 'right' ? rect.right + 24 :
                                    rect.left + (rect.width / 2) - 150, // Center alignment default

                            // Adjustments for specific alignments
                            ...(currentCard.placement === 'bottom' && currentCard.align === 'end' ? { left: rect.right - 300 } : {}),
                            ...(currentCard.placement === 'bottom' && currentCard.align === 'start' ? { left: rect.left } : {}),
                        }}
                    >
                        <div
                            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-5 border border-gray-200 dark:border-slate-700 relative"
                            style={{ width: currentCard.maxWidth || 300 }}
                        >
                            {/* Arrow/Tail (Simplified, distinct for placement) */}
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
                                    <div className="flex gap-1">
                                        {cards.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-slate-600'
                                                    }`}
                                            />
                                        ))}
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
                                            className="h-8 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs"
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
