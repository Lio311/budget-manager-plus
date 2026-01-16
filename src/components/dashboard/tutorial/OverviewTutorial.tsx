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
            calculatePositions()
            window.addEventListener('resize', calculatePositions)
            window.addEventListener('scroll', calculatePositions)
        }

        return () => {
            window.removeEventListener('resize', calculatePositions)
            window.removeEventListener('scroll', calculatePositions)
        }
    }, [isOpen])

    const calculatePositions = () => {
        const newPositions: TooltipPosition[] = []

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
            },
            {
                id: 'overview-graph-networth',
                title: 'שווי העסק לאורך זמן',
                text: 'גרף שטח המציג את התפתחות שווי העסק או ההון העצמי על פני החודשים האחרונים.'
            },
            {
                id: 'overview-graph-status',
                title: 'מצב תקציב חודשי',
                text: 'מדדי התקדמות המציגים את ניצול התקציב, סטטוס גבייה מלקוחות, ומכירות לפני מע"מ ביחס ליעדים.'
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
            {/* Backdrop - Fixed to cover viewport completely, ensuring dark overlay everywhere */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in pointer-events-auto"
                onClick={onClose}
            />

            {/* Close Button - Fixed */}
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

            {/* Highlights and Tooltips */}
            <div className="absolute inset-0 w-full h-full">
                {positions.map((pos, index) => {
                    // Staggering Logic for Top Row (indices 0-3 are likely the top cards)
                    // We can simply alternate the vertical offset slightly for even/odd cards in the top row
                    // to prevent them from looking like a single crowded block.
                    // Or, we can check if it's one of the first 4 cards.
                    const isTopRow = index < 4;
                    const staggerOffset = isTopRow && (index % 2 !== 0) ? 70 : 0; // Push odd cards down further

                    // Reduced width from 280 to 240 to help with crowding
                    const tooltipWidth = 240;

                    return (
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
                                    left: pos.x + (pos.width / 2) - (tooltipWidth / 2),
                                    top: pos.y + pos.height + 30 + staggerOffset,
                                }}
                            >
                                <div
                                    className={`relative bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-4 rounded-lg shadow-2xl animate-in slide-in-from-top-2 duration-300 text-right border border-gray-100 dark:border-gray-700`}
                                    style={{ width: tooltipWidth }}
                                    dir="rtl"
                                >
                                    {/* Arrow - Adjusted height based on stagger */}
                                    <div
                                        className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-slate-800 rotate-45 border-t border-l border-gray-100 dark:border-gray-700"
                                        style={{ top: -8 - (staggerOffset > 0 ? 0 : 0) }}
                                    // Note: If we staggered the tooltip DOWN, the arrow should ideally extend UP, but simple arrow works if the gap isn't too huge.
                                    // Actually if we move the tooltip down, the arrow needs to be at the top of the tooltip.
                                    // But visually connecting across a large gap (70px) might look weird.
                                    // A better approach for "spread" might be to just keep them close but ensure width is small enough.
                                    // Let's rely on the width reduction (280 -> 240) which is significant (40px per card * 4 = 160px saved total).
                                    // And the stagger will visually break the line.
                                    />

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
                    )
                })}
            </div>

            {/* Footer instruction */}
            <div className="fixed bottom-10 left-0 right-0 text-center text-white/80 text-sm pointer-events-none z-50">
                לחץ בכל מקום על המסך כדי לסגור
            </div>
        </div>,
        document.body
    )
}
