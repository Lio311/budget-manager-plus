'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Clock } from 'lucide-react'
import { getFinancialAdvice } from '@/lib/actions/ai'
import { toast } from 'sonner'
import Image from 'next/image'

interface FinancialAdvisorButtonProps {
    financialData: any
    isOpen?: boolean
    onOpenChange?: (open: boolean) => void
}

const SparkleIcon = ({ className }: { className?: string }) => (
    <Image
        src="/images/icons/google-gemini.png"
        alt="Gemini AI"
        width={20}
        height={20}
        className={className}
    />
)

export function FinancialAdvisorButton({ financialData, isOpen: controlledOpen, onOpenChange: setControlledOpen }: FinancialAdvisorButtonProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [advice, setAdvice] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [isCached, setIsCached] = useState(false)
    const [expiresIn, setExpiresIn] = useState<string>('')

    const isControlled = controlledOpen !== undefined
    const isOpen = isControlled ? controlledOpen : internalOpen

    const handleGetAdvice = async () => {
        setLoading(true)
        setAdvice('')
        setIsCached(false)
        setExpiresIn('')

        try {
            const result = await getFinancialAdvice(financialData)

            if (result.success && result.advice) {
                setAdvice(result.advice)
                setIsCached(result.cached || false)
                setExpiresIn(result.expiresIn || '')
            } else {
                toast.error(result.error || 'שגיאה בקבלת ייעוץ')
            }
        } catch (error) {
            toast.error('שגיאה בחיבור לשירות הייעוץ')
        } finally {
            setLoading(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        if (isControlled) {
            setControlledOpen?.(open)
        } else {
            setInternalOpen(open)
        }

        if (open && !advice && !loading) {
            handleGetAdvice()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative overflow-hidden group border-purple-200 dark:border-purple-800"
                    title="ייעוץ פיננסי AI"
                >
                    <SparkleIcon className="h-4 w-4" />
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/40 dark:to-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right flex items-center gap-2">
                        <SparkleIcon className="h-5 w-5" />
                        ייעוץ פיננסי מבוסס AI
                    </DialogTitle>
                    <div className="sr-only">
                        ניתוח פיננסי אוטומטי המבוסס על נתוני ההכנסות וההוצאות שלך
                    </div>
                </DialogHeader>

                {isCached && expiresIn && (
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-lg border border-blue-100 dark:border-blue-800">
                        <Clock className="h-4 w-4" />
                        <span>ניתוח שמור מהיום - יפוג בעוד {expiresIn}</span>
                    </div>
                )}

                <div className="mt-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
                            <p className="text-sm text-muted-foreground">מנתח את הנתונים הפיננסיים שלך...</p>
                            <p className="text-xs text-gray-400">זה עשוי לקחת כ-10 שניות</p>
                        </div>
                    ) : (
                        <div className="mt-4">
                            {advice ? (
                                <div className="space-y-4">
                                    <div className="prose prose-sm max-w-none text-right" dir="rtl">
                                        <div className="text-base md:text-lg leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-100 content-visibility-auto">
                                            {advice}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-base">
                                    <Button
                                        variant="outline"
                                        onClick={handleGetAdvice}
                                        className="gap-2 border-dashed"
                                    >
                                        <SparkleIcon className="h-4 w-4" />
                                        לחץ לקבלת ייעוץ פיננסי מותאם אישית
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                    <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200 text-right leading-relaxed">
                        <strong>שים לב:</strong> ייעוץ זה מסופק ע"י בינה מלאכותית ומהווה המלצות כלליות בלבד. מומלץ להתייעץ עם יועץ פיננסי מוסמך.
                        {!isCached && advice && (
                            <span className="block mt-1.5 text-[10px] text-blue-600 dark:text-blue-400">
                                הניתוח נשמר ל-24 שעות
                            </span>
                        )}
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
