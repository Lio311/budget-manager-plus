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

export function ClientsTutorial({ isOpen, onClose }: TutorialProps) {
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

    // Scroll effect for step change
    useEffect(() => {
        if (isOpen && tooltips.length > 0 && tooltips[currentStep]) {
            const current = tooltips[currentStep]
            const el = document.getElementById(current.config.id)

            if (el) {
                const rect = el.getBoundingClientRect()
                const absoluteTop = rect.top + window.scrollY
                const placement = current.config.placement || 'bottom'

                el.scrollIntoView({ behavior: 'smooth', block: 'center' })

                if (placement === 'top') {
                    const y = absoluteTop - 250
                    window.scrollTo({ top: Math.max(0, y - 100), behavior: 'smooth' })
                } else {
                    const y = absoluteTop - 100
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

        const cards: CardConfig[] = [
            {
                id: 'clients-add-btn',
                title: 'הוספת לקוח חדש',
                text: 'כפתור זה פותח טופס להוספת לקוח חדש למערכת. ניתן להזין פרטים אישיים, פרטי התקשרות, כתובת, ופרטי בנק. כמו כן, ניתן לשייך את הלקוח לחבילת שירות או מנוי קבוע.',
                placement: 'bottom',
                align: 'end',
                maxWidth: 300
            },
            {
                id: 'clients-settings-btn',
                title: 'הגדרות תצוגה ומנויים',
                text: 'כאן ניתן להגדיר את מספר הימים לקבלת התראה לפני סיום מנוי, וכן לנהל את רשימת החבילות והשירותים המוצעים ללקוחות.',
                placement: 'bottom',
                align: 'end',
                maxWidth: 300
            },
            {
                id: 'clients-import-btn',
                title: 'ייבוא לקוחות',
                text: 'אם יש לך רשימת לקוחות קיימת בקובץ Excel או CSV, ניתן לייבא אותה בלחיצת כפתור אחת אל תוך המערכת.',
                placement: 'bottom',
                align: 'end',
                maxWidth: 300
            },
            {
                id: 'clients-search-bar',
                title: 'חיפוש וסינון',
                text: 'שורת חיפוש מהירה למציאת לקוח לפי שם, טלפון או אימייל. התוצאות מתעדכנות בזמן אמת.',
                placement: 'bottom',
                align: 'start',
                maxWidth: 300
            },
            {
                id: 'clients-sort-controls',
                title: 'מיון וסדר תצוגה',
                text: 'ניתן למיין את רשימת הלקוחות לפי פרמטרים שונים: שם, תוקף מנוי, רווחיות, סטטוס תשלום ועוד. כמו כן, ניתן להחליף את כיוון המיון (עולה/יורד).',
                placement: 'bottom',
                align: 'start',
                maxWidth: 300
            },
            {
                id: 'clients-view-toggle',
                title: 'תצוגת רשימה / כרטיסים',
                text: 'בחירה בין תצוגת כרטיסים ויזואלית (Grid) המציגה תקציר לכל לקוח, לבין תצוגת רשימה (Table) מפורטת וקומפקטית יותר.',
                placement: 'bottom',
                align: 'start',
                maxWidth: 300
            },
            {
                id: 'clients-list-container',
                title: 'רשימת הלקוחות - פעולות',
                text: 'בתוך כל כרטיס או שורה של לקוח, ניתן לבצע פעולות מהירות: צפייה בהיסטוריית תשלומים, חידוש מנוי, עריכת פרטי הלקוח, ומחיקה.',
                placement: 'top',
                align: 'center',
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

                const width = isMobileView ? 280 : (config.maxWidth || 300)
                const placement = isMobileView ? (config.placement === 'top' ? 'top' : 'bottom') : (config.placement || 'bottom')
                const align = isMobileView ? 'center' : (config.align || 'center')

                const gap = 10

                if (placement === 'bottom') {
                    style.top = absBottom + gap
                    style.marginTop = '15px'

                    if (align === 'center') style.left = absLeft + (rect.width / 2) - (width / 2)
                    if (align === 'start') style.left = absRight - width + 10
                    if (align === 'end') style.left = absLeft - 10

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

                // Screen Edge Clamping
                let leftVal = parseFloat(style.left?.toString() || '0')
                const maxLeft = window.innerWidth - width - 20
                const minLeft = 20

                if (leftVal < minLeft) {
                    const diff = minLeft - leftVal
                    leftVal = minLeft
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

    if (!mounted || !isOpen) return null

    return createPortal(
        <div className="absolute inset-0 z-[9999] isolate w-full min-h-screen h-full pointer-events-none">
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 animate-in fade-in pointer-events-auto"
                onClick={onClose}
            />

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

            <div className="absolute inset-0 w-full h-full">
                {tooltips.map((t, i) => {
                    if (i !== currentStep) return null

                    return (
                        <div key={t.config.id}>
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

                            <div
                                className="pointer-events-auto transition-all duration-300 ease-in-out bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-100 dark:border-gray-700 p-4 text-right animate-in fade-in slide-in-from-bottom-4"
                                style={t.style}
                                dir="rtl"
                            >
                                <div className="bg-white dark:bg-slate-800" style={t.arrowStyle} />

                                <div className="relative z-20">
                                    <div className="flex items-center gap-2 mb-2 text-[#323338] dark:text-gray-100 font-bold border-b pb-2 border-slate-100 dark:border-slate-700">
                                        <Info className="w-4 h-4" />
                                        <span>{t.config.title}</span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        {t.config.text}
                                    </p>

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
