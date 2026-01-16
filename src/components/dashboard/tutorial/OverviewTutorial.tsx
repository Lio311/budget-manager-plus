'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Info, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
    rect: DOMRect
    style: React.CSSProperties
    arrowStyle: React.CSSProperties
}

export function OverviewTutorial({ isOpen, onClose }: TutorialProps) {
    const [tooltips, setTooltips] = useState<TooltipState[]>([])
    const [mounted, setMounted] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (isOpen) {
            calculatePositions()
            window.addEventListener('resize', calculatePositions)
            window.addEventListener('scroll', calculatePositions)
            // Always start at step 0 when opening
            setCurrentStep(0)
        } else {
            window.removeEventListener('resize', calculatePositions)
            window.removeEventListener('scroll', calculatePositions)
        }

        return () => {
            window.removeEventListener('resize', calculatePositions)
            window.removeEventListener('scroll', calculatePositions)
        }
    }, [isOpen])

    // Scroll effect for step change (All Devices)
    useEffect(() => {
        if (isOpen && tooltips.length > 0 && tooltips[currentStep]) {
            const current = tooltips[currentStep]
            const el = document.getElementById(current.config.id)

            if (el) {
                // Determine layout details to scroll intelligently
                const placement = current.config.placement || 'bottom'
                const isMobileView = window.innerWidth < 768

                // If placement is TOP, we need to ensure the space ABOVE the element is visible.
                // If placement is BOTTOM, we need space BELOW.

                // Standard block: 'center' works well for middle, but 'nearest' might be better for edges?
                // Actually, 'center' is usually safest, BUT if the tooltip is top and element is large, header might block it.
                // Let's do a refined scroll

                const rect = el.getBoundingClientRect()
                const absoluteTop = rect.top + window.scrollY

                // Estimate tooltip height (approx 150-200px) or use actual if we had it ref
                const offset = placement === 'top' ? 250 : -250 // Scroll up more for top placement, down for bottom

                // We want the element roughly in center, but biased by the offset
                // Actually, simpler: Scroll the element to center, then adjust by offset/2

                el.scrollIntoView({ behavior: 'smooth', block: 'center' })

                // Small timeout to allow basic scroll to happen, then adjust if needed? 
                // Or just use window.scrollTo with calculations.
                // let's stick to scrollIntoView for now, it's robust. 
                // If the user says it cuts off, maybe 'center' isn't checking the tooltip boundaries.
                // Let's try to scroll to the TOOLTIP's hypothetical top if placement is top.

                if (placement === 'top') {
                    const y = absoluteTop - 250 // Buffer for tooltip above
                    window.scrollTo({ top: Math.max(0, y - 100), behavior: 'smooth' })
                } else {
                    // Bottom placement - scroll so element and space below is viewable
                    const y = absoluteTop - 100 // Element top with some padding top
                    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
                }
            }
        }
    }, [currentStep, isOpen, tooltips.length])

    const calculatePositions = () => {
        const newTooltips: TooltipState[] = []

        const scrollX = window.scrollX
        const scrollY = window.scrollY
        const isMobileView = window.innerWidth < 768

        // Full Detailed Content
        const cards: CardConfig[] = [
            // Row 1: Metrics
            {
                id: 'overview-card-income',
                title: 'מכירות / הכנסות',
                text: 'כרטיסייה זו מציגה את סך המכירות וההכנסות של העסק לחודש הנוכחי.',
                placement: 'bottom',
                align: 'start',
                maxWidth: 300
            },
            {
                id: 'overview-card-expenses',
                title: 'הוצאות תפעול',
                text: 'כרטיסייה זו מציגה את סך ההוצאות השוטפות של העסק (לא כולל מע"מ אם העסק עוסק מורשה/חברה).',
                placement: 'bottom',
                align: 'center',
                maxWidth: 300
            },
            {
                id: 'overview-card-profit',
                title: 'רווח נקי',
                text: 'כרטיסייה זו נועדה להציג את סה"כ הכנסות העסק פחות אחוז מס הכנסה המשולם פחות ההוצאות של העסק. אחוז מס ההכנסה מוגדר כברירת מחדל על 0, אך ניתן לשנות אותו על ידי לחיצה על כפתור ההגדרות.',
                placement: 'bottom',
                align: 'center',
                maxWidth: 320
            },
            {
                id: 'overview-card-balance',
                title: 'שווי העסק / יתרה',
                text: 'כרטיסייה זו מציגה את היתרה הסופית המשוערת, בהתחשב בכל התנועות הכספיות.',
                placement: 'bottom',
                align: 'end',
                maxWidth: 300
            },

            // Row 4: Tools (Settings & AI)
            {
                id: 'overview-settings-btn',
                title: 'הגדרות המערכת',
                text: 'כפתור זה פותח את חלונית ההגדרות, המכילה 3 לשוניות: ״פרטי העסק״ (עדכון לוגו, שם העסק), ״הגדרות כספיות״ (קביעת יתרה התחלתית להון עצמי, הגדרת אחוז מס הכנסה מופרש), ו״ייצוא נתונים״ (הורדת דוחות אקסל/CSV).',
                placement: 'bottom',
                align: 'end',
                maxWidth: 280
            },
            {
                id: 'overview-ai-btn',
                title: 'יועץ פיננסי (AI)',
                text: 'כפתור זה פותח צ\'אט עם יועץ פיננסי חכם המבוסס על בינה מלאכותית. היועץ רואה את כל הנתונים המוצגים בעמוד ויכול לענות על שאלות, לנתח את המצב הפיננסי, ולהציע תובנות לשיפור הרווחיות.',
                placement: 'bottom',
                align: 'end',
                maxWidth: 300
            },

            // Row 2: Middle Graphs
            {
                id: 'overview-graph-budget',
                title: 'התפלגות תקציב',
                text: 'גרף עוגה המציג חלוקה ויזואלית בין הכנסות להוצאות, ומאפשר להבין במהירות את היחס הפיננסי.',
                placement: 'top',
                align: 'center',
                maxWidth: 300
            },
            {
                id: 'overview-graph-expenses',
                title: 'הוצאות לפי קטגוריה',
                text: 'גרף עמודות המפרט את ההוצאות לפי סוגים (לדוגמה: שיווק, ציוד, משכורות), ומסייע בזיהוי מוקדי ההוצאה העיקריים.',
                placement: 'top',
                align: 'center',
                maxWidth: 300
            },

            // Row 3: Bottom Graphs
            {
                id: 'overview-graph-networth',
                title: 'שווי העסק לאורך זמן',
                text: 'גרף שטח המציג את התפתחות שווי העסק או ההון העצמי. ניתן ללחוץ על כפתור ההגדרות (גלגל השיניים) בפינה השמאלית של הכרטיסייה כדי להגדיר יתרה התחלתית ולדייק את החישוב.',
                placement: 'top',
                align: 'start',
                maxWidth: 320
            },
            {
                id: 'overview-graph-status',
                title: 'מצב תקציב חודשי',
                text: 'כרטיסייה זו מרכזת מדדים קריטיים: הוצאות מול הכנסות, סטטוס גבייה מלקוחות, ומכירות לפני מע"מ. כמו כן, מוצג כאן חישוב שכר שעתי (הכנסות חלקי שעות עבודה), ונתוני מע"מ (החזרי מע"מ ומע"מ לתשלום) כדי לתקף את תזרים המזומנים הצפוי.',
                placement: 'top',
                align: 'end',
                maxWidth: 320
            }
        ]

        cards.forEach(config => {
            const el = document.getElementById(config.id)
            if (el) {
                const rect = el.getBoundingClientRect()
                const absLeft = rect.left + scrollX
                const absTop = rect.top + scrollY
                const absRight = rect.right + scrollX
                const absBottom = rect.bottom + scrollY

                let style: React.CSSProperties = {}
                let arrowStyle: React.CSSProperties = {}

                // Allow slightly wider text boxes on desktop now that we are step-by-step
                const width = isMobileView ? 280 : (config.maxWidth || 300)
                const placement = isMobileView ? (config.placement === 'top' ? 'top' : 'bottom') : (config.placement || 'bottom')
                const align = isMobileView ? 'center' : (config.align || 'center')

                const gap = 0

                // Calculate Text Box Position
                if (placement === 'bottom') {
                    style.top = absBottom + gap
                    style.marginTop = '15px'

                    if (align === 'center') style.left = absLeft + (rect.width / 2) - (width / 2)
                    if (align === 'start') style.left = absRight - width + 10
                    if (align === 'end') style.left = absLeft - 10

                    // Arrow (Points UP)
                    arrowStyle = {
                        top: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(45deg)',
                        borderTop: '1px solid #e2e8f0',
                        borderLeft: '1px solid #e2e8f0'
                    }
                    if (align === 'start') arrowStyle.left = `${width - 30}px`, arrowStyle.transform = 'translateX(0) rotate(45deg)'
                    if (align === 'end') arrowStyle.left = '20px', arrowStyle.transform = 'translateX(0) rotate(45deg)'

                } else if (placement === 'top') {
                    style.top = absTop - gap
                    style.transform = 'translateY(-100%)'
                    style.marginTop = '-15px'

                    if (align === 'center') style.left = absLeft + (rect.width / 2) - (width / 2)
                    if (align === 'start') style.left = absRight - width + 10
                    if (align === 'end') style.left = absLeft - 10

                    // Arrow (Points DOWN)
                    arrowStyle = {
                        bottom: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%) rotate(225deg)',
                        borderTop: '1px solid #e2e8f0',
                        borderLeft: '1px solid #e2e8f0'
                    }
                    if (align === 'start') arrowStyle.left = `${width - 30}px`, arrowStyle.transform = 'translateX(0) rotate(225deg)'
                    if (align === 'end') arrowStyle.left = '20px', arrowStyle.transform = 'translateX(0) rotate(225deg)'
                }

                // Screen Edge Clamping (Crucial for preventing overflow)
                // We apply this for both Mobile AND Desktop to ensure robustness
                let leftVal = parseFloat(style.left?.toString() || '0')
                const maxLeft = window.innerWidth - width - 20
                const minLeft = 20

                if (leftVal < minLeft) {
                    const diff = minLeft - leftVal
                    leftVal = minLeft
                    // Adjust arrow to compensate
                    // We need to parse current arrow left
                    // Simple approach: if we shift box right, shift arrow left by same amount
                    // ... This is complex to parse back.
                    // Easier: Just recalculate arrow relative to the new box left.
                    const centerOfElement = absLeft + (rect.width / 2)
                    const newArrowLeft = centerOfElement - leftVal
                    arrowStyle.left = `${Math.max(10, Math.min(newArrowLeft, width - 10))}px`
                    arrowStyle.transform = placement === 'top'
                        ? 'translateX(-50%) rotate(225deg)'
                        : 'translateX(-50%) rotate(45deg)'

                } else if (leftVal > maxLeft) {
                    const diff = leftVal - maxLeft
                    leftVal = maxLeft
                    const centerOfElement = absLeft + (rect.width / 2)
                    const newArrowLeft = centerOfElement - leftVal
                    arrowStyle.left = `${Math.max(10, Math.min(newArrowLeft, width - 10))}px`
                    arrowStyle.transform = placement === 'top'
                        ? 'translateX(-50%) rotate(225deg)'
                        : 'translateX(-50%) rotate(45deg)'
                }

                style.left = leftVal

                newTooltips.push({
                    config,
                    rect,
                    style: {
                        position: 'absolute',
                        width: `${width}px`,
                        ...style
                    },
                    arrowStyle: {
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        background: 'inherit',
                        zIndex: 10,
                        ...arrowStyle
                    }
                })
            }
        })

        setTooltips(newTooltips)
    }

    const handleNext = () => {
        if (currentStep < tooltips.length - 1) {
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

    const handleBackdropClick = (e: React.MouseEvent) => {
        // If clicking strictly on backdrop (not bubbling from tooltip), step forward? 
        // Or just close? User requested "Next" buttons, usually backdrop click closes.
        // Let's keep close on backdrop.
        onClose()
    }

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="absolute inset-0 z-[9999] isolate w-full min-h-screen h-full pointer-events-none">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in pointer-events-auto"
                onClick={handleBackdropClick}
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
                {tooltips.map((t, i) => {
                    // Show only current step
                    if (i !== currentStep) return null

                    return (
                        <div key={t.config.id}>
                            {/* Highlight Cutout */}
                            <div
                                className="absolute rounded-xl border-2 border-white/50 box-content shadow-[0_0_0_9999px_rgba(0,0,0,0.7)] pointer-events-none transition-all duration-500 ease-in-out"
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
                                className="pointer-events-auto transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-100 dark:border-gray-700 p-4 text-right animate-in fade-in slide-in-from-bottom-4"
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

                                    {/* Navigation Bar */}
                                    <div className="flex items-center justify-between mt-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                                        <span className="text-xs text-muted-foreground" dir="ltr">
                                            {currentStep + 1} / {tooltips.length}
                                        </span>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={handlePrev}
                                                disabled={currentStep === 0}
                                                className="h-8 px-2"
                                            >
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleNext}
                                                className="h-8 px-3 bg-[#323338] hover:bg-black text-white"
                                            >
                                                {currentStep === tooltips.length - 1 ? 'סיום' : 'הבא'}
                                                {currentStep !== tooltips.length - 1 && <ChevronLeft className="w-4 h-4 mr-1" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>,
        document.body
    )
}
