
'use client'

import { useState, useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { Loader2, Plus, PiggyBank } from 'lucide-react'
import { format } from 'date-fns'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { RecurringEndDatePicker } from '@/components/ui/recurring-end-date-picker'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES } from '@/lib/currency'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import { addSaving } from '@/lib/actions/savings'
import { addCategory } from '@/lib/actions/category'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'

interface Category {
    id: string
    name: string
    color: string | null
}

interface SavingFormProps {
    categories: Category[]
    onCategoriesChange?: () => void
    isMobile?: boolean
    onSuccess?: () => void
}

export function SavingForm({ categories, onCategoriesChange, isMobile, onSuccess }: SavingFormProps) {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0)
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()

    const [submitting, setSubmitting] = useState(false)
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    const [newSaving, setNewSaving] = useState({
        category: '',
        description: '', // Maps to name
        monthlyDeposit: '',
        currency: 'ILS',
        goal: '',        // Maps to notes
        date: new Date(),
        isRecurring: false,
        recurringEndDate: undefined as Date | undefined,
        paymentMethod: ''
    })

    // Set default category
    useEffect(() => {
        if (categories.length > 0 && !newSaving.category) {
            setNewSaving(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories, newSaving.category])

    // Optimistic add for instant UI feedback
    const { execute: optimisticAddSaving } = useOptimisticMutation<any, any>(
        ['savings', month, year, budgetType],
        (input) => addSaving(month, year, input, budgetType),
        {
            getOptimisticData: (current, input) => {
                if (!current) return current
                return {
                    ...current,
                    savings: [
                        {
                            id: 'temp-' + Date.now(),
                            category: input.category,
                            name: input.description,
                            monthlyDeposit: input.monthlyDeposit,
                            currency: input.currency || budgetCurrency,
                            notes: input.goal || '',
                            targetDate: input.date ? new Date(input.date) : null,
                            createdAt: new Date(),
                            paymentMethod: input.paymentMethod || '',
                            isRecurring: input.isRecurring || false
                        },
                        ...(current.savings || [])
                    ]
                }
            },
            successMessage: 'החיסכון נוסף בהצלחה',
            errorMessage: 'שגיאה בהוספת החיסכון'
        }
    )

    async function handleAdd() {
        if (!newSaving.category || !newSaving.description || !newSaving.monthlyDeposit) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות החובה', variant: 'destructive' })
            return
        }

        if (newSaving.isRecurring && newSaving.recurringEndDate) {
            const start = new Date(newSaving.date)
            start.setHours(0, 0, 0, 0)
            const end = new Date(newSaving.recurringEndDate)
            end.setHours(0, 0, 0, 0)
            if (end < start) {
                toast({ title: 'שגיאה', description: 'תאריך סיום חייב להיות מאוחר יותר או שווה לתאריך ההתחלה', variant: 'destructive' })
                return
            }
        }

        try {
            await optimisticAddSaving({
                category: newSaving.category,
                description: newSaving.description,
                monthlyDeposit: parseFloat(newSaving.monthlyDeposit),
                currency: newSaving.currency,
                goal: newSaving.goal || undefined,
                date: newSaving.date,
                isRecurring: newSaving.isRecurring,
                recurringStartDate: newSaving.isRecurring ? newSaving.date : undefined,
                recurringEndDate: newSaving.isRecurring ? newSaving.recurringEndDate : undefined,
                paymentMethod: newSaving.paymentMethod || undefined
            })

            // Reset form
            setNewSaving({
                category: categories.length > 0 ? categories[0].name : '',
                description: '',
                monthlyDeposit: '',
                currency: budgetCurrency,
                goal: '',
                date: new Date(),
                isRecurring: false,
                recurringEndDate: undefined,
                paymentMethod: ''
            })

            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            if (onSuccess) onSuccess()
        } catch (error) {
            // Error managed by hook
        }
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        // Force bold color for new categories if using presets
        let colorToSave = newCategoryColor
        if (colorToSave.includes('bg-') && colorToSave.includes('-100')) {
            colorToSave = colorToSave
                .replace(/bg-(\w+)-100/g, 'bg-$1-500')
                .replace(/text-(\w+)-700/g, 'text-white')
                .replace(/border-(\w+)-200/g, 'border-$1-600')
        }

        setSubmitting(true)
        try {
            const result = await addCategory({
                name: newCategoryName.trim(),
                type: 'saving',
                color: colorToSave,
                scope: budgetType
            })

            if (result.success) {
                toast({ title: 'הצלחה', description: 'קטגוריה נוספה בהצלחה' })
                setNewCategoryName('')
                setIsAddCategoryOpen(false)
                if (onCategoriesChange) await onCategoriesChange()

                // Update local state to select the new category
                const newCatName = newCategoryName.trim()
                setNewSaving(prev => ({ ...prev, category: newCatName }))
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף קטגוריה', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add category failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בשרת', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="mb-6 flex items-center gap-2">
                <PiggyBank className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">הוספת חיסכון</h3>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
                <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">קטגוריה</label>
                    <div className="flex gap-2">
                        <select
                            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-[#00c875]/20 focus:border-[#00c875] outline-none transition-all"
                            value={newSaving.category}
                            onChange={(e) => setNewSaving({ ...newSaving, category: e.target.value })}
                            disabled={submitting}
                        >
                            <option value="" disabled>בחר סוג</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                        <Popover open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-lg border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-4 z-50 rounded-xl shadow-xl" dir="rtl">
                                <div className="space-y-4">
                                    <h4 className="font-medium leading-none mb-4 text-[#323338] dark:text-gray-100">קטגוריה חדשה</h4>
                                    <div className="space-y-2">
                                        <Input
                                            className="h-10"
                                            placeholder="שם הקטגוריה"
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                        />
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {PRESET_COLORS.map((color) => (
                                            <div
                                                key={color.name}
                                                className={`h-8 w-8 rounded-full cursor-pointer transition-transform hover:scale-110 border-2 ${color.class.split(' ')[0]} ${newCategoryColor === color.class ? 'border-[#323338] scale-110' : 'border-transparent'}`}
                                                onClick={() => setNewCategoryColor(color.class)}
                                            />
                                        ))}
                                    </div>
                                    <Button onClick={handleAddCategory} className="w-full bg-[#00c875] hover:bg-[#00b065] text-white rounded-lg h-10" disabled={!newCategoryName || submitting}>שמור</Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">תיאור</label>
                    <Input
                        placeholder="תיאור"
                        className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875]"
                        value={newSaving.description}
                        onChange={(e) => setNewSaving({ ...newSaving, description: e.target.value })}
                    />
                </div>

                <div className="w-full space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">מטבע</label>
                    <select
                        className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm outline-none"
                        value={newSaving.currency}
                        onChange={(e) => setNewSaving({ ...newSaving, currency: e.target.value })}
                    >
                        {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                            <option key={code} value={code}>{code} ({symbol})</option>
                        ))}
                    </select>
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">הפקדה</label>
                        <Input
                            type="number"
                            placeholder="0.00"
                            className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875] w-full"
                            value={newSaving.monthlyDeposit}
                            onChange={(e) => setNewSaving({ ...newSaving, monthlyDeposit: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">יעד</label>
                        <FormattedNumberInput
                            placeholder="מטרה"
                            value={newSaving.goal}
                            onChange={(e) => setNewSaving({ ...newSaving, goal: e.target.value })}
                        />
                    </div>
                </div>

                <div className="w-full">
                    <PaymentMethodSelector
                        value={newSaving.paymentMethod}
                        onChange={(val) => setNewSaving({ ...newSaving, paymentMethod: val })}
                        color="blue"
                    />
                </div>

                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תאריך הפקדה</label>
                    <DatePicker
                        date={newSaving.date ? new Date(newSaving.date) : undefined}
                        setDate={(date) => setNewSaving({ ...newSaving, date: date || new Date() })}
                        fromDate={startOfMonth}
                        toDate={endOfMonth}
                    />
                </div>

                <div className="w-full flex items-start gap-4 p-4 mt-2 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 transition-all">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="recurring-saving"
                            checked={newSaving.isRecurring}
                            onCheckedChange={(checked) => setNewSaving({ ...newSaving, isRecurring: checked as boolean })}
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <label htmlFor="recurring-saving" className="text-sm font-medium cursor-pointer text-[#323338] dark:text-gray-100">
                            חיסכון קבוע
                        </label>
                    </div>

                    {newSaving.isRecurring && (
                        <div className="flex gap-4 flex-1">
                            <div className="space-y-2 w-full">
                                <label className="text-xs font-medium text-[#676879] dark:text-gray-300">תאריך סיום</label>
                                <RecurringEndDatePicker
                                    date={newSaving.recurringEndDate ? new Date(newSaving.recurringEndDate) : undefined}
                                    setDate={(date) => setNewSaving({ ...newSaving, recurringEndDate: date })}
                                    fromDate={startOfMonth}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleAdd}
                    className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all hover:shadow-md mt-2"
                    disabled={submitting}
                >
                    {submitting ? (
                        <Loader2 className="h-4 w-4 animate-rainbow-spin" />
                    ) : (
                        'הוסף'
                    )}
                </Button>
            </div>
        </div>
    )
}
