
'use client'

import { useState, useEffect } from 'react'
import { useSWRConfig } from 'swr'
import {
    Loader2, Plus, TrendingDown
} from 'lucide-react'
import { format } from 'date-fns'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { formatCurrency } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import { addIncome } from '@/lib/actions/income'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { addCategory } from '@/lib/actions/category'

interface Category {
    id: string
    name: string
    color: string | null
}

interface Client {
    id: string
    name: string
}

interface IncomeFormProps {
    categories: Category[]
    clients: Client[]
    onCategoriesChange?: () => void
    isMobile?: boolean
    onSuccess?: () => void
}

export function IncomeForm({ categories, clients, onCategoriesChange, isMobile, onSuccess }: IncomeFormProps) {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0)
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()
    const isBusiness = budgetType === 'BUSINESS'

    const [submitting, setSubmitting] = useState(false)
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    const [newIncome, setNewIncome] = useState({
        source: '',
        category: '',
        amount: '',
        currency: 'ILS',
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringEndDate: '',
        clientId: '',
        amountBeforeVat: '',
        vatRate: '0.18',
        vatAmount: '',
        paymentMethod: '',
        payer: '',
        workTime: '',
        acceptedBy: ''
    })

    // Handle VAT Calculations
    const calculateFromNet = (net: string, rate: string) => {
        const n = parseFloat(net) || 0
        const r = parseFloat(rate) || 0
        const vat = n * r
        const total = n + vat
        return { total: total.toFixed(2), vat: vat.toFixed(2) }
    }

    useEffect(() => {
        if (isBusiness && newIncome.amount && newIncome.vatRate) {
            const { total, vat } = calculateFromNet(newIncome.amount, newIncome.vatRate)
            setNewIncome(prev => ({ ...prev, amountBeforeVat: newIncome.amount, vatAmount: vat }))
        }
    }, [newIncome.amount, newIncome.vatRate, isBusiness])

    // Optimistic add for instant UI feedback
    const { execute: optimisticAddIncome } = useOptimisticMutation<any, any>(
        ['incomes', month, year, budgetType],
        (input) => addIncome(month, year, input, budgetType),
        {
            getOptimisticData: (current, input) => {
                if (!current) return current
                return {
                    ...current,
                    incomes: [
                        {
                            id: 'temp-' + Date.now(),
                            source: input.source,
                            category: input.category,
                            amount: input.amount,
                            currency: input.currency || budgetCurrency,
                            date: input.date ? new Date(input.date) : new Date(),
                            client: isBusiness && input.clientId ? { id: input.clientId, name: '...' } : null,
                            vatAmount: input.vatAmount || 0,
                            payer: input.payer || '',
                            paymentMethod: input.paymentMethod || '',
                            isRecurring: input.isRecurring || false
                        },
                        ...(current.incomes || [])
                    ]
                }
            },
            successMessage: 'ההכנסה נוספה בהצלחה',
            errorMessage: 'שגיאה בהוספת ההכנסה'
        }
    )

    async function handleAdd() {
        if (!newIncome.source || !newIncome.amount || !newIncome.category) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות', variant: 'destructive' })
            return
        }

        if (newIncome.isRecurring && newIncome.recurringEndDate) {
            const start = new Date(newIncome.date || new Date())
            start.setHours(0, 0, 0, 0)
            const end = new Date(newIncome.recurringEndDate)
            end.setHours(0, 0, 0, 0)
            if (end < start) {
                toast({ title: 'שגיאה', description: 'תאריך סיום חייב להיות מאוחר יותר או שווה לתאריך ההכנסה', variant: 'destructive' })
                return
            }
        }

        try {
            await optimisticAddIncome({
                source: newIncome.source,
                category: newIncome.category,
                amount: parseFloat(newIncome.amount),
                currency: newIncome.currency,
                date: newIncome.date || undefined,
                isRecurring: newIncome.isRecurring,
                recurringEndDate: newIncome.isRecurring ? newIncome.recurringEndDate : undefined,
                clientId: isBusiness ? newIncome.clientId || undefined : undefined,
                amountBeforeVat: isBusiness ? parseFloat(newIncome.amountBeforeVat) : undefined,
                vatRate: isBusiness ? parseFloat(newIncome.vatRate) : undefined,
                vatAmount: isBusiness ? parseFloat(newIncome.vatAmount) : undefined,
                paymentMethod: newIncome.paymentMethod || undefined,
                payer: newIncome.payer || undefined,
                workTime: newIncome.workTime || undefined,
                acceptedBy: newIncome.acceptedBy || undefined
            })

            // Reset form
            setNewIncome({
                source: '',
                category: categories.length > 0 ? categories[0].name : '',
                amount: '',
                currency: budgetCurrency,
                date: format(new Date(), 'yyyy-MM-dd'),
                isRecurring: false,
                recurringEndDate: '',
                clientId: '',
                amountBeforeVat: '',
                vatRate: '0.18',
                vatAmount: '',
                paymentMethod: '',
                payer: '',
                workTime: '',
                acceptedBy: ''
            })

            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            if (onSuccess) onSuccess()
        } catch (error) {
            // Error managed by hook
        }
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        setSubmitting(true)
        try {
            const result = await addCategory({
                name: newCategoryName.trim(),
                type: 'income',
                color: newCategoryColor,
                scope: budgetType
            })

            if (result.success) {
                toast({ title: 'הצלחה', description: 'קטגוריה נוספה בהצלחה' })
                setNewCategoryName('')
                setIsAddCategoryOpen(false)
                if (onCategoriesChange) await onCategoriesChange()

                const newCatName = newCategoryName.trim()
                setNewIncome(prev => ({ ...prev, category: newCatName }))
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף קטגוריה', variant: 'destructive' })
            }
        } catch (error: any) {
            console.error('Add category failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בשרת', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="mb-4 flex items-center gap-2">
                <TrendingDown className={`h-5 w-5 rotate-180 ${isBusiness ? 'text-green-600' : 'text-[#00c875]'}`} />
                <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">{isBusiness ? 'תיעוד מכירה / הכנסה' : 'הוספת הכנסה'}</h3>
            </div>

            <div className="flex flex-col gap-4">
                {/* Source Input */}
                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תיאור / מקור</label>
                    <Input className="h-10 border-gray-200 focus:ring-blue-500/20" placeholder={isBusiness ? "תיאור המכירה (למשל: ייעוץ עסקי)" : "שם המקור"} value={newIncome.source} onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })} />
                </div>

                {isBusiness && (
                    <div className="w-full">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">לקוח</label>
                        <select
                            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={newIncome.clientId}
                            onChange={(e) => setNewIncome({ ...newIncome, clientId: e.target.value })}
                        >
                            <option value="">ללא לקוח ספציפי</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>{client.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Category Select */}
                <div className="flex gap-2 w-full">
                    <div className="flex-1">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">קטגוריה</label>
                        <select
                            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                            value={newIncome.category}
                            onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })}
                        >
                            <option value="" disabled>בחר קטגוריה</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-6">
                        <Popover open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-lg border-gray-200 hover:bg-gray-50"><Plus className="h-4 w-4" /></Button>
                            </PopoverTrigger>

                            <PopoverContent className="w-80 p-4 z-50 rounded-xl shadow-xl" dir="rtl">
                                <div className="space-y-4">
                                    <h4 className="font-medium mb-4 text-[#323338] dark:text-gray-100">קטגוריה חדשה</h4>
                                    <Input className="h-10" placeholder="שם הקטגוריה" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                                    <div className="grid grid-cols-5 gap-2">
                                        {PRESET_COLORS.map(color => (
                                            <div key={color.name} className={`h-8 w-8 rounded-full cursor-pointer transition-transform hover:scale-110 border-2 ${color.class.split(' ')[0]} ${newCategoryColor === color.class ? 'border-[#323338] scale-110' : 'border-transparent'} `} onClick={() => setNewCategoryColor(color.class)} />
                                        ))}
                                    </div>
                                    <Button onClick={handleAddCategory} className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg h-10" disabled={!newCategoryName || submitting}>שמור</Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                    <div className="col-span-1">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">מטבע</label>
                        <select
                            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm outline-none"
                            value={newIncome.currency}
                            onChange={(e) => setNewIncome({ ...newIncome, currency: e.target.value })}
                        >
                            {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                <option key={code} value={code}>{code} ({symbol})</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">{isBusiness ? 'סכום לפני מע"מ' : 'סכום כולל'}</label>
                        <FormattedNumberInput className={`h-10 border-gray-200 ${isBusiness ? 'focus:ring-blue-500/20' : 'focus:ring-green-500/20'}`} placeholder="0.00" value={newIncome.amount} onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })} />
                    </div>
                </div>

                {isBusiness && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-green-50/50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/50">
                        <div>
                            <label className="text-[10px] font-bold text-green-800 dark:text-green-400 uppercase mb-1 block">מע"מ (18%)</label>
                            <div className="text-sm font-bold text-green-900 dark:text-green-300">{formatCurrency(parseFloat(newIncome.vatAmount) || 0, getCurrencySymbol(newIncome.currency))}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-green-800 dark:text-green-400 uppercase mb-1 block">סכום כולל</label>
                            <div className="text-sm font-bold text-green-900 dark:text-green-300">{formatCurrency((parseFloat(newIncome.amount) || 0) + (parseFloat(newIncome.vatAmount) || 0), getCurrencySymbol(newIncome.currency))}</div>
                        </div>
                    </div>
                )}

                {/* Three fields in one row for Business, or just Payer for Personal */}
                {/* Three fields in one row for Business, or just Payer for Personal */}
                <div className={`grid gap-3 w-full ${isBusiness ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* Payer Input */}
                    <div className="w-full">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">התקבל מ... (אופציונלי)</label>
                        <Input
                            className="h-10 border-gray-200 focus:ring-blue-500/20"
                            placeholder="שם המשלם"
                            value={newIncome.payer}
                            onChange={(e) => setNewIncome({ ...newIncome, payer: e.target.value })}
                        />
                    </div>

                    {isBusiness && (
                        <div className="w-full">
                            <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">התקבל על ידי (אופציונלי)</label>
                            <Input className="h-10 border-gray-200 focus:ring-blue-500/20" placeholder="שם העובד/מקבל" value={newIncome.acceptedBy} onChange={(e) => setNewIncome({ ...newIncome, acceptedBy: e.target.value })} />
                        </div>
                    )}
                </div>

                {isBusiness && (
                    <div className="w-full">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">זמן עבודה (דקות בלבד)</label>
                        <Input
                            type="number"
                            min="0"
                            className="h-10 border-gray-200 focus:ring-blue-500/20"
                            placeholder="לדוגמה: 90"
                            value={newIncome.workTime}
                            onChange={(e) => {
                                // Strict validation: allow only positive integers
                                const val = e.target.value;
                                if (val === '' || /^\d+$/.test(val)) {
                                    setNewIncome({ ...newIncome, workTime: val });
                                }
                            }}
                        />
                    </div>
                )}

                {/* Payment Method Selector */}
                <div className="w-full">
                    <PaymentMethodSelector
                        value={newIncome.paymentMethod}
                        onChange={(val) => setNewIncome({ ...newIncome, paymentMethod: val })}
                        color={isBusiness ? 'blue' : 'green'}
                    />
                </div>

                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תאריך קבלה</label>
                    <DatePicker
                        date={newIncome.date ? new Date(newIncome.date) : undefined}
                        setDate={(date) => setNewIncome({ ...newIncome, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                        fromDate={startOfMonth}
                        toDate={endOfMonth}
                    />
                </div>

                {/* Recurring Checkbox */}
                <div className="flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 w-full">
                    <div className="flex items-center gap-2">
                        <Checkbox id="recurring-income" checked={newIncome.isRecurring} onCheckedChange={(checked) => setNewIncome({ ...newIncome, isRecurring: checked as boolean })} className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600" />
                        <label htmlFor="recurring-income" className="text-sm font-medium cursor-pointer text-[#323338] dark:text-gray-100">הכנסה קבועה</label>
                    </div>
                    {newIncome.isRecurring && (
                        <div className="flex gap-4 flex-1">
                            <div className="space-y-2 w-full">
                                <label className="text-xs font-medium text-[#676879] dark:text-gray-300">תאריך סיום</label>
                                <DatePicker
                                    date={newIncome.recurringEndDate ? new Date(newIncome.recurringEndDate) : undefined}
                                    setDate={(date) => setNewIncome({ ...newIncome, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    fromDate={startOfMonth}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Button onClick={handleAdd} className={`w-full h-11 rounded-lg text-white font-bold shadow-sm transition-all hover:shadow-md ${isBusiness ? 'bg-green-600 hover:bg-green-700' : 'bg-[#00c875] hover:bg-[#00b268]'}`} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : (isBusiness ? 'שמור הכנסה' : 'הוסף')}
                </Button>
            </div>
        </div>
    )
}
