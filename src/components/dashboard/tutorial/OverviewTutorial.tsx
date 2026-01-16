'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TutorialProps {
    isOpen: boolean
    onClose: () => void
}

type Placement = 'top' | 'bottom' | 'left' | 'right'
type Alignment = 'start' | 'center' | 'end'

interface CardConfig {
    id: string
    title: string
    text: string
    placement?: Placement
    align?: Alignment
    maxWidth?: number
}

interface TooltipState {
    config: CardConfig
    rect: DOMRect // We store the original rect to recalculate positions dynamically if needed, or just pre-calculated coords
    // Pre-calculated absolute positions for the tooltip box
    style: React.CSSProperties
    arrowStyle: React.CSSProperties
}

export function OverviewTutorial({ isOpen, onClose }: TutorialProps) {
    const [tooltips, setTooltips] = useState<TooltipState[]>([])
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            calculatePositions()
            window.addEventListener('resize', calculatePositions)
            window.addEventListener('scroll', calculatePositions)
        } else {
            window.removeEventListener('resize', calculatePositions)
            window.removeEventListener('scroll', calculatePositions)
        }

        return () => {
            window.removeEventListener('resize', calculatePositions)
            window.removeEventListener('scroll', calculatePositions)
        }
    }, [isOpen])

    const calculatePositions = () => {
        const newTooltips: TooltipState[] = []

        const scrollX = window.scrollX
        const scrollY = window.scrollY
        const viewportWidth = window.innerWidth

        // Configuration for each card
        const cards: CardConfig[] = [
            // Row 1: Metrics
            {
                id: 'overview-card-income', // Rightmost
                title: 'מכירות / הכנסות',
                text: 'כרטיסייה זו מציגה את סך המכירות וההכנסות של העסק לחודש הנוכחי.',
                placement: 'bottom',
                align: 'start', // Align Right (in RTL start is Right)
                maxWidth: 220
            },
            {
                id: 'overview-card-expenses',
                title: 'הוצאות תפעול',
                text: 'כרטיסייה זו מציגה את סך ההוצאות השוטפות של העסק (לא כולל מע"מ).',
                placement: 'bottom',
                align: 'center',
                maxWidth: 220
            },
            {
                id: 'overview-card-profit',
                title: 'רווח נקי',
                text: 'סה"כ הכנסות פחות הוצאות ופחות הפרשת מס הכנסה (ניתן להגדרה).',
                placement: 'bottom',
                align: 'center',
                maxWidth: 220
            },
            {
                id: 'overview-card-balance', // Leftmost
                title: 'שווי העסק / יתרה',
                text: 'היתרה הסופית המשוערת. כוללת את כל התנועות הכספיות.',
                placement: 'bottom',
                align: 'end', // Align Left
                maxWidth: 220
            },

            // Row 2: Middle Graphs
            {
                id: 'overview-graph-budget', // Right
                title: 'התפלגות תקציב',
                text: 'חלוקה ויזואלית בין הכנסות להוצאות להבנת היחס הפיננסי.',
                placement: 'top', // Show above to not crowd the bottom graphs? Or bottom?
                // Let's try 'top' for these middle graphs if there is space, otherwise bottom.
                // Actually user said "Not everything has to be this angle".
                // Let's put these on the SIDE if desktop?
                // Visual Right (Budget) -> Left side of screen. 
                // Visual Left (Expenses) -> Right side of screen.
                // Let's stick to Top/Bottom for safety but use Top for these to vary it.
                align: 'center',
                maxWidth: 250
            },
            {
                id: 'overview-graph-expenses', // Left
                title: 'הוצאות לפי קטגוריה',
                text: 'פירוט הוצאות לפי סוגים לזיהוי מוקדים עיקריים.',
                placement: 'top',
                align: 'center',
                maxWidth: 250
            },

            // Row 3: Bottom Graphs
            {
                id: 'overview-graph-networth', // Right
                title: 'שווי העסק לאורך זמן',
                text: 'התפתחות ההון העצמי. השתמש בגלגל השיניים להגדרת יתרה התחלתית.',
                placement: 'top', // Show above so it doesn't fall off screen
                align: 'start',
                maxWidth: 260
            },
            {
                id: 'overview-graph-status', // Left
                title: 'מצב תקציב חודשי',
                text: 'מדדי ביצוע, שכר שעתי, ונתוני מע"מ (החזר/תשלום).',
                placement: 'top', // Show above
                align: 'end',
                maxWidth: 260
            }
        ]

        cards.forEach(config => {
            const el = document.getElementById(config.id)
            if (el) {
                const rect = el.getBoundingClientRect()
                // Absolute coords on document
                const absLeft = rect.left + scrollX
                const absTop = rect.top + scrollY
                const absRight = rect.right + scrollX
                const absBottom = rect.bottom + scrollY

                let style: React.CSSProperties = {}
                let arrowStyle: React.CSSProperties = {}

                // Defaults
                const placement = config.placement || 'bottom'
                const align = config.align || 'center'
                const width = config.maxWidth || 240
                const gap = 0 // Tight connection requested

                // Calculate Text Box Position
                if (placement === 'bottom') {
                    style.top = absBottom + gap
                    style.marginTop = '10px' // Arrow size compensation

                    if (align === 'center') style.left = absLeft + (rect.width / 2) - (width / 2)
                    if (align === 'start') style.left = absRight - width // Align Right edge (RTL start)? No, RTL start is Right visually, so 'left' css property accounts for x axis.
                    // Let's solve 'left' CSS property math: 
                    // Align 'start' (Right in RTL) -> The box right edge should match element right edge.
                    // box.left = element.right - box.width
                    if (align === 'start') style.left = absRight - width + 10 // Shift slightly in
                    // Align 'end' (Left in RTL) -> Box left edge matches element left edge
                    if (align === 'end') style.left = absLeft - 10

                    // Arrow (Points UP)
                    arrowStyle = {
                        top: '-6px', // Overlap border slightly
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        borderTop: '1px solid #e2e8f0', // Color match border
                        borderLeft: '1px solid #e2e8f0'
                    }
                    if (align === 'start') arrowStyle.left = `${width - 30}px`, arrowStyle.transform = 'translateX(0) rotate(45deg)'
                    if (align === 'end') arrowStyle.left = '20px', arrowStyle.transform = 'translateX(0) rotate(45deg)'

                } else if (placement === 'top') {
                    style.top = absTop - gap
                    style.transform = 'translateY(-100%)' // Shift up by its own height
                    style.marginTop = '-10px' // Gap

                    if (align === 'center') style.left = absLeft + (rect.width / 2) - (width / 2)
                    if (align === 'start') style.left = absRight - width + 10
                    if (align === 'end') style.left = absLeft - 10

                    // Arrow (Points DOWN)
                    arrowStyle = {
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(225deg)', // Point down
                        borderTop: '1px solid #e2e8f0',
                        borderLeft: '1px solid #e2e8f0'
                    }
                    if (align === 'start') arrowStyle.left = `${width - 30}px`, arrowStyle.transform = 'translateX(0) rotate(225deg)'
                    if (align === 'end') arrowStyle.left = '20px', arrowStyle.transform = 'translateX(0) rotate(225deg)'
                }

                newTooltips.push({
                    config,
                    rect, // Raw rect if needed
                    style: {
                        position: 'absolute',
                        width: `${width}px`,
                        ...style
                    },
                    arrowStyle: {
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        background: 'inherit', // Match bg
                        zIndex: 10,
                        ...arrowStyle
                    }
                })
            }
        })

        setTooltips(newTooltips)
    }

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="absolute inset-0 z-[9999] isolate w-full min-h-screen h-full pointer-events-none">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in pointer-events-auto"
                onClick={onClose}
            />

            {/* Close Button */}
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

            {/* Render Tooltips */}
            <div className="absolute inset-0 w-full h-full">
                {tooltips.map((t, i) => (
                    <div key={t.config.id}>
                        {/* Highlight Cutout */}
                        <div
                            className="absolute rounded-xl border-2 border-white/50 box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none transition-all duration-200"
                            style={{
                                left: t.rect.left + window.scrollX,
                                top: t.rect.top + window.scrollY,
                                width: t.rect.width,
                                height: t.rect.height,
                                boxShadow: '0 0 30px rgba(255,255,255,0.1), 0 0 0 1px rgba(255,255,255,0.2)'
                            }}
                        />

                        {/* The Tooltip Box */}
                        <div
                            className="pointer-events-auto transition-all duration-200 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-100 dark:border-gray-700 p-4 text-right"
                            style={t.style}
                            dir="rtl"
                        >
                            {/* Arrow */}
                            <div className="bg-white dark:bg-slate-800" style={t.arrowStyle} />

                            {/* Content */}
                            <div className="relative z-20">
                                <div className="flex items-center gap-2 mb-2 text-[#323338] dark:text-gray-100 font-bold border-b pb-2 border-slate-100 dark:border-slate-700">
                                    <Info className="w-4 h-4" />
                                    <span>{t.config.title}</span>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                    {t.config.text}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer instruction */}
            <div className="fixed bottom-10 left-0 right-0 text-center text-white/80 text-sm pointer-events-none z-50">
                לחץ בכל מקום על המסך כדי לסגור
            </div>
        </div>,
        document.body
    )
}
