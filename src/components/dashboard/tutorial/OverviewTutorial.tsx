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
            // Lock body scroll
            document.body.style.overflow = 'hidden'
            calculatePositions()
            window.addEventListener('resize', calculatePositions)
        } else {
            document.body.style.overflow = ''
        }

        return () => {
            document.body.style.overflow = ''
            window.removeEventListener('resize', calculatePositions)
        }
    }, [isOpen])

    const calculatePositions = () => {
        const newPositions: TooltipPosition[] = []

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
            }
        ]

        cards.forEach(cardInfo => {
            const el = document.getElementById(cardInfo.id)
            if (el) {
                const rect = el.getBoundingClientRect()
                newPositions.push({
                    id: cardInfo.id,
                    x: rect.left,
                    y: rect.top,
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
        <div className="fixed inset-0 z-[9999] isolate">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in"
                onClick={onClose}
            />

            {/* Close Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 left-4 z-50 text-white hover:bg-white/20 rounded-full w-12 h-12"
                onClick={onClose}
            >
                <X className="w-6 h-6" />
            </Button>

            {/* Highlights and Tooltips - Correct z-index handling */}
            <div className="absolute inset-0 pointer-events-none">
                {positions.map((pos) => (
                    <div key={pos.id}>
                        {/* Highlight Cutout (Visual Hack using box-shadow or just overlaying a transparent div with border) */}
                        <div
                            className="absolute rounded-xl border-2 border-white/50 box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                            style={{
                                left: pos.x,
                                top: pos.y,
                                width: pos.width,
                                height: pos.height,
                                // Need to counteract the backdrop in that specific area? 
                                // Actually better to just render tooltips on top of the plain backdrop.
                                // The backdrop above is full screen. We can just highlight by placing a glowing border.
                                boxShadow: '0 0 30px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.2)'
                            }}
                        />

                        {/* Tooltip */}
                        <div
                            className="absolute z-50 pointer-events-auto"
                            style={{
                                left: pos.x + (pos.width / 2) - 140, // Center roughly (width 280)
                                top: pos.y + pos.height + 20, // Below
                            }}
                        >
                            <div className="relative bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-lg shadow-2xl w-[280px] animate-in slide-in-from-top-2 duration-300 text-right" dir="rtl">
                                {/* Arrow */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 rotate-45" />

                                <div className="relative">
                                    <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400 font-bold">
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

            <div className="absolute bottom-10 left-0 right-0 text-center text-white/80 text-sm pointer-events-none">
                לחץ בכל מקום על המסך כדי לסגור
            </div>
        </div>,
        document.body
    )
}
