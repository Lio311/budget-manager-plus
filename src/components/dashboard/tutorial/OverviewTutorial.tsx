'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TutorialProps {
    isOpen: boolean
    onClose: () => void
}

interface TooltipPosition {
    id: string
    x: number
    y: number
    width: number
    height: number
    text: string
    title: string
}

export function OverviewTutorial({ isOpen, onClose }: TutorialProps) {
    const [positions, setPositions] = useState<TooltipPosition[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        if (isOpen) {
            // We want to allow scrolling, so we DO NOT lock body overflow.
            calculatePositions()
            window.addEventListener('resize', calculatePositions)
            // Recalculate positions on scroll to keep highlights accurate if they were fixed, 
            // but since we will use absolute positioning relative to the document, we just need initial calc + resize.
            // Actually, getBoundingClientRect is relative to viewport. So if we use absolute positioning with top = rect.top + scrollY,
            // we need to recalculate if the DOM shifts, but scrolling itself handled by the absolute positioning logic.
            // Wait, if elements move due to layout changes, we need to know.
            // But simple scrolling with 'absolute' overlay works if top is fixed to document coordinates.
            window.addEventListener('scroll', calculatePositions)
        }

        return () => {
            window.removeEventListener('resize', calculatePositions)
            window.removeEventListener('scroll', calculatePositions)
        }
    }, [isOpen])

    const calculatePositions = () => {
        const newPositions: TooltipPosition[] = []

        // Offset to allow scrolling calculations
        const scrollX = window.scrollX
        const scrollY = window.scrollY

        const cards = [
            {
                id: 'overview-card-income',
                title: 'מכירות / הכנסות',
                text: 'כרטיסייה זו מציגה את סך המכירות וההכנסות של העסק לחודש הנוכחי.'
            },
            {
                id: 'overview-card-expenses',
                title: 'הוצאות תפעול',
                text: 'כרטיסייה זו מציגה את סך ההוצאות השוטפות של העסק (לא כולל מע"מ אם העסק עוסק מורשה/חברה).'
            },
            {
                id: 'overview-card-profit',
                title: 'רווח נקי',
                text: 'כרטיסייה זו נועדה להציג את סה"כ הכנסות העסק פחות אחוז מס הכנסה המשולם פחות ההוצאות של העסק. אחוז מס ההכנסה מוגדר כברירת מחדל על 0, אך ניתן לשנות אותו על ידי לחיצה על כפתור ההגדרות.'
            },
            {
                id: 'overview-card-balance',
                title: 'שווי העסק / יתרה',
                text: 'כרטיסייה זו מציגה את היתרה הסופית המשוערת, בהתחשב בכל התנועות הכספיות.'
            },
            {
                id: 'overview-graph-budget',
                title: 'התפלגות תקציב',
                text: 'גרף עוגה המציג חלוקה ויזואלית בין הכנסות להוצאות, ומאפשר להבין במהירות את היחס הפיננסי.'
            },
            {
                id: 'overview-graph-expenses',
                title: 'הוצאות לפי קטגוריה',
                text: 'גרף עמודות המפרט את ההוצאות לפי סוגים (לדוגמה: שיווק, ציוד, משכורות), ומסייע בזיהוי מוקדי ההוצאה העיקריים.'
            }
        ]

        cards.forEach(cardInfo => {
            const el = document.getElementById(cardInfo.id)
            if (el) {
                const rect = el.getBoundingClientRect()
                newPositions.push({
                    id: cardInfo.id,
                    x: rect.left + scrollX,
                    y: rect.top + scrollY,
                    width: rect.width,
                    height: rect.height,
                    title: cardInfo.title,
                    text: cardInfo.text
                })
            }
        })

        setPositions(newPositions)
    }

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="absolute inset-0 z-[9999] isolate w-full min-h-screen h-full pointer-events-none">
            {/* Backdrop - Absolute to cover full document height */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in pointer-events-auto"
                onClick={onClose}
                // Ensure backdrop covers everything even if scrolled
                style={{ height: 'max(100vh, 100%)' }}
            />

            {/* Close Button - Fixed so it stays visible while scrolling */}
            <div className="fixed top-4 left-4 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20 rounded-full w-12 h-12 pointer-events-auto"
                    onClick={onClose}
                >
                    <X className="w-6 h-6" />
                </Button>
            </div>

            {/* Highlights and Tooltips - Correct z-index handling */}
            <div className="absolute inset-0 w-full h-full">
                {positions.map((pos) => (
                    <div key={pos.id} className="absolute" style={{ left: 0, top: 0 }}>
                        {/* Highlight Cutout */}
                        <div
                            className="absolute rounded-xl border-2 border-white/50 box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none transition-all duration-200"
                            style={{
                                left: pos.x,
                                top: pos.y,
                                width: pos.width,
                                height: pos.height,
                                boxShadow: '0 0 30px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.2)'
                            }}
                        />

                        {/* Tooltip */}
                        <div
                            className="absolute z-50 pointer-events-auto transition-all duration-200"
                            style={{
                                left: pos.x + (pos.width / 2) - 140, // Center roughly (width 280)
                                // Added extra spacing (50px instead of 20px) to prevent crowding
                                top: pos.y + pos.height + 50,
                            }}
                        >
                            <div className="relative bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-lg shadow-2xl w-[280px] animate-in slide-in-from-top-2 duration-300 text-right border border-gray-100 dark:border-gray-700" dir="rtl">
                                {/* Arrow - pointing up to the card */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 rotate-45 border-t border-l border-gray-100 dark:border-gray-700" />

                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-2 text-[#323338] dark:text-gray-100 font-bold border-b pb-2 border-gray-100 dark:border-gray-700">
                                        <Info className="w-4 h-4" />
                                        <span>{pos.title}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        {pos.text}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer instruction - Fixed at bottom of viewport */}
            <div className="fixed bottom-10 left-0 right-0 text-center text-white/80 text-sm pointer-events-none z-50">
                לחץ בכל מקום על המסך כדי לסגור
            </div>
        </div>,
        document.body
    )
}
