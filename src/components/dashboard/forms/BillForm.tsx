'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
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

interface BillFormProps {
    onSuccess?: () => void
    isMobile?: boolean
}

export function BillForm({ onSuccess, isMobile = false }: BillFormProps) {
    const { month, year, budgetType } = useBudget()
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()

    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState<{
        name: string
        amount: string
        currency: string
        dueDay: string
        paymentMethod: string
        isRecurring: boolean
        frequency: 'MONTHLY' | 'BI_MONTHLY'
        recurringEndDate?: string
    }>({
        name: '',
        amount: '',
        currency: 'ILS',
        dueDay: '',
        paymentMethod: '',
        isRecurring: false,
        frequency: 'MONTHLY',
        recurringEndDate: undefined
    })

    async function handleSubmit() {
        if (!formData.name || !formData.amount || !formData.dueDay) {
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל השדות',
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
            const result = await addBill(month, year, {
                name: formData.name,
                amount: parseFloat(formData.amount),
                currency: formData.currency,
                dueDay: parseInt(formData.dueDay),
                paymentMethod: formData.paymentMethod || undefined,
                isRecurring: formData.isRecurring,
                recurringEndDate: formData.recurringEndDate,
                frequency: formData.frequency
            }, budgetType)

            if (result.success) {
                toast({
                    title: 'הצלחה',
                    description: 'החשבון נוסף בהצלחה'
                })
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

                // Trigger revalidation for bills and overview
                globalMutate(['bills', month, year, budgetType])
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')

                // Call success callback (e.g., close modal)
                if (onSuccess) onSuccess()
            } else {
                toast({
                    title: 'שגיאה',
                    description: result.error || 'לא ניתן להוסיף חשבון',
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">שם החשבון</label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="לדוגמה: ארנונה"
                    className="h-10 text-right"
                />
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">סכום</label>
                    <FormattedNumberInput
                        placeholder="0.00"
                        value={formData.amount}
                        onValueChange={(values) => setFormData({ ...formData, amount: values.value })}
                        className="h-10 text-right"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">יום בחודש לתשלום</label>
                <Input
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    placeholder="1-31"
                    className="h-10 text-right"
                />
            </div>

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
                    onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked as boolean })}
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
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">תוקף עד <span className="text-red-500">*</span></label>
                            <DatePicker
                                date={formData.recurringEndDate ? new Date(formData.recurringEndDate) : undefined}
                                setDate={(date) => setFormData({ ...formData, recurringEndDate: date ? date.toISOString() : undefined })}
                                placeholder="בחר תאריך סיום"
                                className="w-full h-9 bg-white"
                            />
                        </div>
                    </div>
                )
            }

            <Button
                className="w-full bg-orange-500 hover:bg-orange-600 h-10 shadow-sm mt-2 font-medium"
                onClick={handleSubmit}
                disabled={submitting}
            >
                {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : "הוסף"}
            </Button>
        </div >
    )
}
