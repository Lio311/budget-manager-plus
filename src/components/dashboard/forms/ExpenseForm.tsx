'use client'

import { useState, useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Loader2, Plus, TrendingDown, RefreshCw, Settings
} from 'lucide-react'
import { format } from 'date-fns'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { RecurringEndDatePicker } from '@/components/ui/recurring-end-date-picker'
import { formatCurrency } from '@/lib/utils'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { PaymentMethodSelector } from '../PaymentMethodSelector'
import { useRef } from 'react'
import { addExpense, importExpenses, deleteAllMonthlyExpenses } from '@/lib/actions/expense'
import { Trash2 } from 'lucide-react'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { BankImportModal } from '../BankImportModal'
import { CategoryManagementDialog } from './CategoryManagementDialog'
import { useConfirm } from '@/hooks/useConfirm'
import { findMatchingCategory } from '@/lib/category-utils'

interface Category {
    id: string
    name: string
    color: string | null
    isDefault?: boolean
}

interface Supplier {
    id: string
    name: string
}

interface ExpenseFormProps {
    categories: Category[]
    suppliers: Supplier[]
    onCategoriesChange?: () => void
    isMobile?: boolean
    onSuccess?: () => void
}

export function ExpenseForm({ categories, suppliers, onCategoriesChange, isMobile, onSuccess }: ExpenseFormProps) {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0)
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()
    const confirm = useConfirm()
    const isBusiness = budgetType === 'BUSINESS'

    const [submitting, setSubmitting] = useState(false)

    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: '',
        currency: 'ILS',
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringEndDate: undefined as string | undefined,
        supplierId: '',
        amountBeforeVat: '',
        vatRate: '0.18',
        vatAmount: '',
        isDeductible: true,
        deductibleRate: '1.0',
        paymentMethod: ''
    })

    // Handle VAT Calculations (Backwards from Gross)
    const calculateFromGross = (gross: string, rate: string) => {
        const g = parseFloat(gross) || 0
        const r = parseFloat(rate) || 0
        // Gross = Net * (1 + r)
        // Net = Gross / (1 + r)
        const net = g / (1 + r)
        const vat = g - net
        return { net: net.toFixed(2), vat: vat.toFixed(2) }
    }

    useEffect(() => {
        if (isBusiness && newExpense.amount && newExpense.vatRate) {
            const { net, vat } = calculateFromGross(newExpense.amount, newExpense.vatRate)
            setNewExpense(prev => ({ ...prev, amountBeforeVat: net, vatAmount: vat }))
        }
    }, [newExpense.amount, newExpense.vatRate, isBusiness])



    // Deep Linking: Pre-fill form from URL parameters
    const searchParams = useSearchParams()
    const router = useRouter() // Need to import this

    useEffect(() => {
        if (!searchParams) return

        const paramAmount = searchParams.get('amount')
        const paramDesc = searchParams.get('description') || searchParams.get('merchant') || searchParams.get('title') || searchParams.get('desc')
        const paramCat = searchParams.get('category')
        const paramCurrency = searchParams.get('currency')
        const paramDate = searchParams.get('date')
        const paramAutoSubmit = searchParams.get('autoSubmit') === 'true'

        // Only proceed if we have at least amount or description
        if (paramAmount || paramDesc || paramCat) {
            const matchedCategory = findMatchingCategory(paramCat, categories)

            // Construct the new expense object
            const expenseFromUrl = {
                amount: paramAmount || '',
                description: paramDesc || '',
                category: matchedCategory || (categories.length > 0 ? categories[0].name : ''),
                currency: (paramCurrency && Object.keys(SUPPORTED_CURRENCIES).includes(paramCurrency)) ? paramCurrency : 'ILS',
                date: paramDate ? format(new Date(paramDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                isRecurring: false,
                recurringEndDate: undefined,
                supplierId: '',
                amountBeforeVat: '',
                vatRate: '0.18',
                vatAmount: '',
                isDeductible: true,
                deductibleRate: '1.0',
                paymentMethod: ''
            }

            setNewExpense(prev => ({
                ...prev,
                ...expenseFromUrl
            }))

            // Auto Submit Logic
            if (paramAutoSubmit && expenseFromUrl.amount && expenseFromUrl.category) {
                // We need to trigger the add function explicitly. 
                // Since handleAdd reads from `newExpense` state which might not be updated yet in this render cycle,
                // we'll use a timeout or pass the data directly. 
                // Better approach: Call a dedicated internal submit function with the data.

                // However, `handleAdd` relies on state. simplest way is to set state, then set a flag to submit on next effect, 
                // OR refactor handleAdd.
                // For safety and simplicity in this edit, I will trigger it via a refined effect or just wait for state update.
                // Let's use a "ready to submit" flag in state or ref.
                setPendingAutoSubmit(true)
            }

            // Cleanup URL params
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('amount')
            newUrl.searchParams.delete('description')
            newUrl.searchParams.delete('merchant')
            newUrl.searchParams.delete('title')
            newUrl.searchParams.delete('desc')
            newUrl.searchParams.delete('category')
            newUrl.searchParams.delete('currency')
            newUrl.searchParams.delete('date')
            newUrl.searchParams.delete('autoSubmit')
            newUrl.searchParams.delete('autoOpen')

            // Ensure we stay on the expenses tab
            newUrl.searchParams.set('tab', 'expenses')

            router.replace(newUrl.pathname + newUrl.search)
        }
    }, [searchParams, categories]) // Re-run when categories load to ensure matching works

    const [pendingAutoSubmit, setPendingAutoSubmit] = useState(false)

    useEffect(() => {
        if (pendingAutoSubmit && newExpense.amount && newExpense.category) {
            handleAdd()
            setPendingAutoSubmit(false)
        }
    }, [pendingAutoSubmit, newExpense])

    // Optimistic add for instant UI feedback
    const { execute: optimisticAddExpense } = useOptimisticMutation<any, any>(
        ['expenses', month, year, budgetType], // Matches parent's key
        (input) => addExpense(month, year, input, budgetType),
        {
            getOptimisticData: (current, input) => {
                if (!current) return current
                return {
                    ...current,
                    expenses: [
                        {
                            id: 'temp-' + Date.now(),
                            description: input.description,
                            amount: input.amount,
                            category: input.category,
                            currency: input.currency || budgetCurrency,
                            date: input.date ? new Date(input.date) : new Date(),
                            supplier: isBusiness && input.supplierId ? { id: input.supplierId, name: '...' } : null,
                            vatAmount: input.vatAmount || 0,
                            isDeductible: input.isDeductible ?? true,
                            paymentMethod: input.paymentMethod || '',
                            isRecurring: input.isRecurring || false
                        },
                        ...(current.expenses || [])
                    ]
                }
            },
            successMessage: 'הוצאה נוספה בהצלחה',
            errorMessage: 'שגיאה בהוספת ההוצאה'
        }
    )

    async function handleAdd() {
        if (!newExpense.amount || !newExpense.category) {
            toast({ title: 'שגיאה', description: 'נא למלא סכום וקטגוריה', variant: 'destructive' })
            return
        }

        if (newExpense.isRecurring && newExpense.recurringEndDate) {
            const start = new Date(newExpense.date)
            start.setHours(0, 0, 0, 0)
            const end = new Date(newExpense.recurringEndDate)
            end.setHours(0, 0, 0, 0)
            if (end < start) {
                toast({ title: 'שגיאה', description: 'תאריך סיום חייב להיות מאוחר יותר או שווה לתאריך ההוצאה', variant: 'destructive' })
                return
            }
        }

        try {
            const totalAmount = newExpense.amount

            // Calculate derived values for payload
            const { net, vat } = isBusiness
                ? calculateFromGross(totalAmount, newExpense.vatRate)
                : { net: totalAmount, vat: '0' }

            await optimisticAddExpense({
                description: newExpense.description || 'הוצאה ללא תיאור',
                amount: parseFloat(totalAmount),
                category: newExpense.category,
                currency: newExpense.currency as "ILS" | "USD" | "EUR" | "GBP",
                date: newExpense.date,
                isRecurring: newExpense.isRecurring,
                recurringEndDate: newExpense.recurringEndDate,
                supplierId: isBusiness ? newExpense.supplierId || undefined : undefined,
                amountBeforeVat: isBusiness ? parseFloat(net) : undefined,
                vatRate: isBusiness ? parseFloat(newExpense.vatRate) : undefined,
                vatAmount: isBusiness ? parseFloat(vat) : undefined,
                isDeductible: isBusiness ? newExpense.isDeductible : undefined,
                deductibleRate: isBusiness ? parseFloat(newExpense.deductibleRate) : undefined,
                paymentMethod: newExpense.paymentMethod || undefined
            })

            // Reset form
            setNewExpense({
                description: '',
                amount: '',
                category: categories.length > 0 ? categories[0].name : '',
                currency: budgetCurrency,
                date: format(new Date(), 'yyyy-MM-dd'),
                isRecurring: false,
                recurringEndDate: undefined,
                supplierId: '',
                amountBeforeVat: '',
                vatRate: '0.18',
                vatAmount: '',
                isDeductible: true,
                deductibleRate: '1.0',
                paymentMethod: ''
            })

            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            if (onSuccess) onSuccess()
        } catch (error) {
            // Error managed by hook
        }
    }

    const handleDeleteAll = async () => {
        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק את כל ההוצאות של אותו חודש?', 'מחיקת הוצאות')
        if (!confirmed) return

        try {
            const result = await deleteAllMonthlyExpenses(month, year, budgetType)
            if (result.success) {
                toast({ title: 'הצלחה', description: 'כל ההוצאות נמחקו בהצלחה' })
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')
                globalMutate(['expenses', month, year, budgetType])
                onSuccess?.()
            } else {
                toast({ title: 'שגיאה', description: result.error || 'שגיאה במחיקת ההוצאות', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'שגיאה', description: 'שגיאה במחיקת ההוצאות', variant: 'destructive' })
        }
    }

    const handleImportExpenses = async (data: any[]) => {
        const expensesToImport = data.map(row => ({
            description: row.description,
            amount: parseFloat(row.billingAmount),
            category: row.branchName || 'כללי',
            currency: 'ILS' as 'ILS' | 'USD' | 'EUR' | 'GBP',
            date: row.date,
            isRecurring: false,
            paymentMethod: row.paymentMethod || 'כרטיס אשראי'
        }))

        const result = await importExpenses(expensesToImport, budgetType)
        if (result.success) {
            toast({
                title: 'ייבוא הושלם',
                description: `נוספו ${result.count} הוצאות חדשות (${result.skipped || 0} כפילויות סוננו)`,
                variant: 'default',
                duration: 5000 // Show for 5 seconds
            })
            globalMutate(['expenses', month, year, budgetType])
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            if (onCategoriesChange) await onCategoriesChange()
            if (onSuccess) onSuccess()
        } else {
            throw new Error(result.error)
        }



    }

    return (
        <div>
            <div className="mb-4 flex items-center gap-2">
                <TrendingDown className={`h-5 w-5 ${isBusiness ? 'text-red-600' : 'text-[#e2445c]'}`} />
                <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">{isBusiness ? 'תיעוד הוצאה / עלות' : 'הוספת הוצאה'}</h3>
                <div className="mr-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDeleteAll}
                        title="מחק את כל ההוצאות לחודש זה"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <CategoryManagementDialog
                        categories={categories}
                        type="expense"
                        scope={budgetType}
                        onChange={() => {
                            if (onCategoriesChange) onCategoriesChange()
                        }}
                        trigger={
                            <Button variant="outline" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50" title="ניהול קטגוריות">
                                <Settings className="h-4 w-4" />
                            </Button>
                        }
                    />

                    <BankImportModal onImport={handleImportExpenses} />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תיאור ההוצאה</label>
                    <Input className={`h-10 border-gray-200 ${isBusiness ? 'focus:ring-orange-500/20' : 'focus:ring-red-500/20'}`} placeholder="מה קנית / שילמת?" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
                </div>

                {isBusiness && (
                    <div className="w-full">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">ספק</label>
                        <select
                            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                            value={newExpense.supplierId}
                            onChange={(e) => setNewExpense({ ...newExpense, supplierId: e.target.value })}
                        >
                            <option value="">ללא ספק ספציפי</option>
                            {suppliers.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex gap-2 w-full">
                    <div className="flex-1">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">קטגוריה</label>
                        <select
                            className={`w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm focus:ring-2 ${isBusiness ? 'focus:ring-orange-500/20' : 'focus:ring-red-500/20'} outline-none`}
                            value={newExpense.category}
                            onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                            style={{ position: 'relative' }}
                        >
                            <option value="" disabled>בחר קטגוריה</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-6">
                        <CategoryManagementDialog
                            categories={categories}
                            type="expense"
                            scope={budgetType}
                            onChange={() => {
                                if (onCategoriesChange) onCategoriesChange()
                            }}
                            trigger={
                                <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-lg border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800" title="ניהול קטגוריות">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            }
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                    <div className="col-span-1">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">מטבע</label>
                        <select
                            className="w-full p-2 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm outline-none"
                            value={newExpense.currency}
                            onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                        >
                            {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                <option key={code} value={code}>{code} ({symbol})</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">{isBusiness ? 'סכום לפני מע"מ' : 'סכום כולל'}</label>
                        <FormattedNumberInput className={`h-10 border-gray-200 ${isBusiness ? 'focus:ring-orange-500/20' : 'focus:ring-red-500/20'}`} placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                    </div>
                </div>

                <div className="w-full">
                    <PaymentMethodSelector
                        value={newExpense.paymentMethod}
                        onChange={(val) => setNewExpense({ ...newExpense, paymentMethod: val })}
                        color={isBusiness ? 'orange' : 'red'}
                    />
                </div>

                {isBusiness && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50">
                        <div>
                            <label className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase mb-1 block">מע"מ מוכר (18%)</label>
                            <div className="text-sm font-bold text-red-900 dark:text-red-300">{formatCurrency(parseFloat(newExpense.vatAmount) || 0, getCurrencySymbol(newExpense.currency))}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase mb-1 block">סכום כולל (לתשלום)</label>
                            <div className="text-sm font-bold text-red-900 dark:text-red-300">{formatCurrency((parseFloat(newExpense.amount) || 0) + (parseFloat(newExpense.vatAmount) || 0), getCurrencySymbol(newExpense.currency))}</div>
                        </div>
                    </div>
                )}

                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תאריך הוצאה</label>
                    <DatePicker
                        date={newExpense.date ? new Date(newExpense.date) : undefined}
                        setDate={(date) => setNewExpense({ ...newExpense, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                        fromDate={startOfMonth}
                        toDate={endOfMonth}
                    />
                </div>

                {isBusiness && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700">
                        <Checkbox id="is-deductible" checked={newExpense.isDeductible} onCheckedChange={(checked) => setNewExpense({ ...newExpense, isDeductible: checked as boolean })} className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
                        <label htmlFor="is-deductible" className="text-xs font-bold text-[#323338] dark:text-gray-100 cursor-pointer">הוצאה מוכרת לצורכי מס</label>
                    </div>
                )}

                <div className="flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 w-full">
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="recurring-expense"
                            checked={newExpense.isRecurring}
                            onCheckedChange={(checked) => {
                                const isRecurring = checked as boolean
                                setNewExpense(prev => ({
                                    ...prev,
                                    isRecurring,
                                    recurringEndDate: isRecurring ? prev.recurringEndDate : undefined
                                }))
                            }}
                            className={isBusiness ? 'data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600' : 'data-[state=checked]:bg-[#e2445c] data-[state=checked]:border-[#e2445c]'}
                        />
                        <label htmlFor="recurring-expense" className="text-sm font-medium cursor-pointer text-[#323338] dark:text-gray-100">הוצאה קבועה</label>
                    </div>
                    {newExpense.isRecurring && (
                        <div className="flex gap-4 flex-1">
                            <div className="space-y-2 w-full">
                                <label className="text-xs font-medium text-[#676879] dark:text-gray-300">תאריך סיום</label>
                                <RecurringEndDatePicker
                                    date={newExpense.recurringEndDate ? new Date(newExpense.recurringEndDate) : undefined}
                                    setDate={(date) => setNewExpense(prev => ({ ...prev, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : undefined }))}
                                    fromDate={startOfMonth}
                                    placeholder="בחר תאריך סיום"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Button onClick={handleAdd} className={`w-full h-11 rounded-lg text-white font-bold shadow-sm transition-all hover:shadow-md ${isBusiness ? 'bg-red-600 hover:bg-red-700' : 'bg-[#e2445c] hover:bg-[#d43f55]'}`} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : (isBusiness ? 'שמור הוצאה' : 'הוסף')}
                </Button>
            </div>
        </div>
    )
}
