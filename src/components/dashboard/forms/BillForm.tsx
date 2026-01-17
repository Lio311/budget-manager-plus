'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { addBill } from '@/lib/actions/bill'
import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { useSWRConfig } from 'swr'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'

import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { RecurringEndDatePicker } from '@/components/ui/recurring-end-date-picker'

interface BillFormProps {
    onSuccess?: () => void
    isMobile?: boolean
    initialData?: any
}

export function BillForm({ onSuccess, isMobile = false, initialData }: BillFormProps) {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0)
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()

    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, boolean>>({})
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

    const [formData, setFormData] = useState<{
        name: string
        amount: string
        currency: string
        dueDay: string
        paymentMethod: string
        isRecurring: boolean
        frequency: 'MONTHLY' | 'BI_MONTHLY'
        recurringEndDate?: string
    }>(initialData ? {
        name: initialData.name || '',
        amount: initialData.amount?.toString() || '',
        currency: initialData.currency || 'ILS',
        dueDay: initialData.dueDay?.toString() || initialData.dueDate ? new Date(initialData.dueDate).getDate().toString() : '',
        paymentMethod: initialData.paymentMethod || '',
        isRecurring: initialData.isRecurring || false,
        frequency: initialData.frequency || 'MONTHLY',
        recurringEndDate: initialData.recurringEndDate || undefined
    } : {
        name: '',
        amount: '',
        currency: 'ILS',
        dueDay: '',
        paymentMethod: '',
        isRecurring: false,
        frequency: 'MONTHLY',
        recurringEndDate: undefined
    })

    useEffect(() => {
        if (initialData) {
            if (initialData.isRecurring || initialData.paymentMethod) {
                setIsAdvancedOpen(true)
            }
        }
    }, [initialData])

    // Read date from URL if provided (set dueDay from date)
    const searchParams = useSearchParams()
    useEffect(() => {
        const paramDate = searchParams?.get('date')
        if (paramDate) {
            const date = new Date(paramDate)
            const day = date.getDate()
            setFormData(prev => ({
                ...prev,
                dueDay: day.toString()
            }))
        }
    }, [searchParams])

    async function handleSubmit() {
        const newErrors: Record<string, boolean> = {}
        if (!formData.name) newErrors.name = true
        if (!formData.amount) newErrors.amount = true
        if (!formData.dueDay) newErrors.dueDay = true

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל שדות החובה המסומנים',
                variant: 'destructive'
            })
            return
        }

        const dueDay = parseInt(formData.dueDay)
        if (dueDay < 1 || dueDay > 31) {
            toast({
                title: 'שגיאה',
                description: 'יום תשלום חייב להיות בין 1 ל-31',
                variant: 'destructive'
            })
            return
        }

        if (formData.isRecurring && !formData.recurringEndDate) {
            toast({
                title: 'שגיאה',
                description: 'יש לבחור תאריך סיום לחשבון קבוע',
                variant: 'destructive'
            })
            return
        }

        setSubmitting(true)
        try {
            let result;
            const billData = {
                name: formData.name,
                amount: parseFloat(formData.amount),
                currency: formData.currency,
                dueDay: parseInt(formData.dueDay),
                paymentMethod: formData.paymentMethod || undefined,
                isRecurring: formData.isRecurring,
                recurringEndDate: formData.recurringEndDate,
                frequency: formData.frequency
            }

            if (initialData?.id) {
                // Update mode
                result = await import('@/lib/actions/bill').then(mod => mod.updateBill(initialData.id, billData))
            } else {
                // Create mode
                result = await addBill(month, year, billData, budgetType)
            }

            if (result.success) {
                toast({
                    title: 'הצלחה',
                    description: initialData ? 'החשבון עודכן בהצלחה' : 'החשבון נוסף בהצלחה'
                })

                if (!initialData) {
                    setFormData({
                        name: '',
                        amount: '',
                        currency: 'ILS',
                        dueDay: '',
                        paymentMethod: '',
                        isRecurring: false,
                        frequency: 'MONTHLY',
                        recurringEndDate: undefined
                    })
                }

                // Trigger revalidation for bills and overview
                globalMutate(['bills', month, year, budgetType])
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')

                // Call success callback (e.g., close modal)
                if (onSuccess) onSuccess()
            } else {
                toast({
                    title: 'שגיאה',
                    description: result.error || (initialData ? 'לא ניתן לעדכן חשבון' : 'לא ניתן להוסיף חשבון'),
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error('Add bill failed:', error)
            toast({
                title: 'שגיאה',
                description: 'אירעה שגיאה בלתי צפויה',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">שם החשבון *</label>
                <Input
                    value={formData.name}
                    onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (e.target.value) setErrors(prev => ({ ...prev, name: false }))
                    }}
                    placeholder="לדוגמה: ארנונה"
                    className={`h-10 text-right focus:ring-orange-500/20 focus:border-orange-500 ${errors.name ? '!border-red-500 dark:!border-red-500 ring-1 ring-red-500/20' : 'border-gray-200 dark:border-slate-700'}`}
                />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">מטבע</label>
                    <select
                        className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 text-sm outline-none"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                        {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                            <option key={code} value={code}>{code} ({symbol})</option>
                        ))}
                    </select>
                </div>
                <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">סכום *</label>
                    <FormattedNumberInput
                        placeholder="סכום"
                        className={`h-10 focus:ring-orange-500/20 focus:border-orange-500 ${errors.amount ? '!border-red-500 dark:!border-red-500 ring-1 ring-red-500/20' : 'border-gray-200 dark:border-slate-700'}`}
                        value={formData.amount}
                        onChange={(e) => {
                            setFormData({ ...formData, amount: e.target.value })
                            if (e.target.value) setErrors(prev => ({ ...prev, amount: false }))
                        }}
                        disabled={submitting}
                        dir="ltr"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">יום בחודש לתשלום *</label>
                <Input
                    type="number"
                    min="1"
                    max="31"
                    onWheel={(e) => e.currentTarget.blur()}
                    value={formData.dueDay}
                    onChange={(e) => {
                        setFormData({ ...formData, dueDay: e.target.value })
                        if (e.target.value) setErrors(prev => ({ ...prev, dueDay: false }))
                    }}
                    placeholder="1-31"
                    className={`h-10 text-right ${errors.dueDay ? 'border-red-500' : ''}`}
                />
            </div>

            <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-full py-2"
            >
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAdvancedOpen ? 'rotate-180' : ''}`} />
                הגדרות מתקדמות (מומלץ)
            </button>

            {isAdvancedOpen && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700/50">
                    <div className="w-full">
                        <PaymentMethodSelector
                            value={formData.paymentMethod}
                            onChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                            color="orange"
                        />
                    </div>

                    <div className="flex items-center space-x-2 space-x-reverse pt-2 border-t border-gray-100 dark:border-slate-700">
                        <Checkbox
                            id="recurring"
                            checked={formData.isRecurring}
                            onCheckedChange={(checked) => {
                                const isRecurring = checked as boolean
                                setFormData(prev => ({
                                    ...prev,
                                    isRecurring,
                                    recurringEndDate: isRecurring ? prev.recurringEndDate : undefined
                                }))
                            }}
                        />
                        <label
                            htmlFor="recurring"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            חשבון קבוע / חוזר
                        </label>
                    </div>

                    {
                        formData.isRecurring && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg animate-in slide-in-from-top-2">
                                <div className="space-y-1">
                                    <label className="text-xs text-gray-500 dark:text-gray-400">תדירות</label>
                                    <select
                                        className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-md h-9 text-sm outline-none bg-white dark:bg-slate-800 dark:text-gray-100"
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'MONTHLY' | 'BI_MONTHLY' })}
                                    >
                                        <option value="MONTHLY">כל חודש</option>
                                        <option value="BI_MONTHLY">דו-חודשי (כל חודשיים)</option>
                                    </select>
                                </div>
                                <div className="flex gap-4 flex-1">
                                    <div className="space-y-2 w-full">
                                        <label className="text-xs font-medium text-[#676879] dark:text-gray-300">תאריך סיום</label>
                                        <RecurringEndDatePicker
                                            date={formData.recurringEndDate ? new Date(formData.recurringEndDate) : undefined}
                                            setDate={(date) => setFormData(prev => ({ ...prev, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : undefined }))}
                                            fromDate={startOfMonth}
                                            placeholder="בחר תאריך סיום"
                                            className="w-full h-9 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            )}

            <Button
                className="w-full h-10 shadow-sm mt-2 font-medium transition-all bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSubmit}
                disabled={submitting}
            >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (initialData ? 'שמור שינויים' : 'הוסף')}
            </Button>
        </div >
    )
}
