'use client'

import { useState, useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { useSearchParams, useRouter } from 'next/navigation'
import {
    Loader2, Plus, TrendingDown, RefreshCw, Settings, ChevronDown
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRef } from 'react'
import { addExpense, updateExpense, importExpenses, deleteAllMonthlyExpenses } from '@/lib/actions/expense'
import { Trash2 } from 'lucide-react'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { BankImportModal } from '../BankImportModal'
import { CategoryManagementDialog } from './CategoryManagementDialog'
import { useConfirm } from '@/hooks/useConfirm'
import { findMatchingCategory } from '@/lib/category-utils'
import { useDemo } from '@/contexts/DemoContext'
import { SimpleClientSelector } from './SimpleClientSelector'
import { ProjectSelector } from './ProjectSelector'
import { addProject } from '@/lib/actions/projects'
import useSWR from 'swr'
import { getProjects } from '@/lib/actions/projects'

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

interface Client {
    id: string
    name: string
}

interface Project {
    id: string
    name: string
    color: string | null
}

interface ExpenseFormProps {
    categories: Category[]
    suppliers: Supplier[]
    clients?: Client[]
    onCategoriesChange?: () => void
    isMobile?: boolean
    onSuccess?: () => void
    initialData?: any
}

export function ExpenseForm({ categories, suppliers, clients = [], onCategoriesChange, isMobile, onSuccess, initialData }: ExpenseFormProps) {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0)
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()

    const confirm = useConfirm()
    const isBusiness = budgetType === 'BUSINESS'
    const { isDemo, interceptAction } = useDemo()

    // Fetch projects for personal budgets
    const { data: projectsData, mutate: mutateProjects } = useSWR(
        !isBusiness ? ['projects', budgetType] : null,
        () => getProjects('PERSONAL')
    )
    const projects = projectsData?.data || []

    const [submitting, setSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, boolean>>({})
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

    const [newExpense, setNewExpense] = useState(initialData ? {
        description: initialData.description || '',
        amount: initialData.amount?.toString() || '',
        category: initialData.category || '',
        currency: initialData.currency || 'ILS',
        date: initialData.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        isRecurring: initialData.isRecurring || false,
        recurringEndDate: initialData.recurringEndDate || undefined,
        supplierId: initialData.supplierId || '',
        clientId: initialData.clientId || '',
        projectId: initialData.projectId || '',
        amountBeforeVat: initialData.amountBeforeVat?.toString() || '',
        vatRate: initialData.vatRate?.toString() || '0.18',
        vatAmount: initialData.vatAmount?.toString() || '',
        isDeductible: initialData.isDeductible ?? true,
        deductibleRate: initialData.deductibleRate?.toString() || '1.0',
        paymentMethod: initialData.paymentMethod || '',
        paidBy: initialData.paidBy || '',
        id: initialData.id // Store ID for update
    } : {
        description: '',
        amount: '',
        category: '',
        currency: 'ILS',
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringEndDate: undefined as string | undefined,
        supplierId: '',
        clientId: '',
        projectId: '',
        amountBeforeVat: '',
        vatRate: '0.18',
        vatAmount: '',
        isDeductible: true,
        deductibleRate: '1.0',
        paymentMethod: '',
        paidBy: ''
    })

    useEffect(() => {
        if (initialData) {
            // Open advanced if advanced fields are populated
            if (initialData.isRecurring || initialData.supplierId || initialData.clientId || initialData.isDeductible === false || (initialData.vatRate && initialData.vatRate !== 0.17)) {
                setIsAdvancedOpen(true)
            }
        }
    }, [initialData])

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
        if (isBusiness && newExpense.amount) {
            let currentRate = parseFloat(newExpense.vatRate) || 0

            // AUTO-FIX: If detected as deductible (checked) but rate is 0, force standard 18% VAT
            // This fixes key issue where imported/scanned expenses with 0 VAT stayed 0 even when edited
            if (newExpense.isDeductible && currentRate === 0) {
                setNewExpense(prev => ({ ...prev, vatRate: '0.18' }))
                return // Will re-run effect with correct rate
            }

            if (currentRate > 0) {
                const { net, vat } = calculateFromGross(newExpense.amount, newExpense.vatRate)
                // Avoid infinite loops by checking if values actually changed
                if (net !== newExpense.amountBeforeVat || vat !== newExpense.vatAmount) {
                    setNewExpense(prev => ({ ...prev, amountBeforeVat: net, vatAmount: vat }))
                }
            }
        }
    }, [newExpense.amount, newExpense.vatRate, newExpense.isDeductible, isBusiness])

    // Effect to auto-select first category when categories load if no category is selected
    useEffect(() => {
        if (!newExpense.category && categories.length > 0) {
            setNewExpense(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories])


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

        // Only proceed if we have at least amount, description, category or date
        if (paramAmount || paramDesc || paramCat || paramDate) {
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
        if (isDemo) { interceptAction(); return; }

        const newErrors: Record<string, boolean> = {}
        if (!newExpense.amount) newErrors.amount = true
        if (!newExpense.category) newErrors.category = true
        if (!newExpense.description || !newExpense.description.trim()) newErrors.description = true

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast({ title: 'שגיאה', description: 'נא למלא את שדות החובה המסומנים', variant: 'destructive' })

            // Scroll to error
            const firstError = Object.keys(newErrors)[0]
            if (firstError === 'description') document.getElementById('description-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            else if (firstError === 'amount') document.getElementById('amount-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            else if (firstError === 'category') document.getElementById('category-trigger')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

            return
        }
        setErrors({})

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

        const expenseData = {
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            category: newExpense.category,
            currency: newExpense.currency,
            date: newExpense.date,
            isRecurring: newExpense.isRecurring,
            recurringEndDate: newExpense.recurringEndDate,
            supplierId: newExpense.supplierId || undefined,
            clientId: newExpense.clientId || undefined,
            projectId: newExpense.projectId || undefined,
            amountBeforeVat: parseFloat(newExpense.amountBeforeVat) || undefined,
            vatRate: parseFloat(newExpense.vatRate) || undefined,
            vatAmount: parseFloat(newExpense.vatAmount) || undefined,
            isDeductible: newExpense.isDeductible,
            deductibleRate: parseFloat(newExpense.deductibleRate) || 1.0,
            paymentMethod: newExpense.paymentMethod || undefined,
            paidBy: newExpense.paidBy || undefined
        }

        try {
            let result;
            if (initialData?.id) {
                // Update mode
                result = await updateExpense(initialData.id, expenseData, 'SINGLE')
            } else {
                // Create mode
                result = await addExpense(month, year, expenseData, budgetType)
            }

            if (result.success) {
                toast({ title: initialData ? 'הוצאה עודכנה בהצלחה' : 'הוצאה נוספה בהצלחה' })

                // Clear form only on create
                if (!initialData) {
                    setNewExpense({
                        description: '',
                        amount: '',
                        category: '',
                        currency: 'ILS',
                        date: format(new Date(), 'yyyy-MM-dd'),
                        isRecurring: false,
                        recurringEndDate: undefined,
                        supplierId: '',
                        clientId: '',
                        projectId: '',
                        amountBeforeVat: '',
                        vatRate: '0.18',
                        vatAmount: '',
                        isDeductible: true,
                        deductibleRate: '1.0',
                        paymentMethod: '',
                        paidBy: ''
                    })
                }

                if (onSuccess) onSuccess()

                // Refresh data
                globalMutate(key => Array.isArray(key) && (key[0] === 'expenses' || key[0] === 'overview'))
            } else {
                toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
            }
        } catch (error) {
            console.error(error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בשמירת ההוצאה', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteAll = async () => {
        if (isDemo) { interceptAction(); return; }

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
            paymentMethod: row.paymentMethod || 'כרטיס אשראי',
            vatAmount: row.vatAmount,
            amountBeforeVat: row.amountBeforeVat,
            vatRate: row.vatRate,
            isDeductible: row.isDeductible,
            deductibleRate: row.deductibleRate,
            // VAT Logic for Business
            ...(isBusiness ? (() => {
                // If VAT exists from scan, use it
                if (row.vatAmount !== undefined && row.vatAmount > 0) {
                    return {
                        vatAmount: parseFloat(row.vatAmount),
                        vatRate: 0.18, // Assume 18%
                        amountBeforeVat: parseFloat(row.billingAmount) - parseFloat(row.vatAmount),
                        isDeductible: true,
                        deductibleRate: 1.0
                    }
                }
                // Fallback: Calculate 18% from Total
                const gross = parseFloat(row.billingAmount) || 0
                // Default 18% VAT (gross / 1.18 = net)
                const net = gross / 1.18
                const vat = gross - net
                return {
                    amountBeforeVat: parseFloat(net.toFixed(2)),
                    vatAmount: parseFloat(vat.toFixed(2)),
                    vatRate: 0.18,
                    isDeductible: true,
                    deductibleRate: 1.0
                }
            })() : {})
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
                <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">{isBusiness ? 'תיעוד הוצאה' : 'הוספת הוצאה'}</h3>
                <div className="mr-auto flex items-center gap-2">
                    <Button
                        id="expenses-delete-all-btn"
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
                            if (isDemo) { interceptAction(); return; }
                            if (onCategoriesChange) onCategoriesChange()
                        }}
                        trigger={
                            <Button id="expenses-settings-btn" variant="outline" size="icon" className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50" title="ניהול קטגוריות">
                                <Settings className="h-4 w-4" />
                            </Button>
                        }
                    />

                    <BankImportModal onImport={handleImportExpenses} triggerId="expenses-import-btn" />
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תיאור ההוצאה *</label>
                    <Input
                        id="description-input"
                        className={`h-10 ${errors.description ? 'border-red-500' : 'border-gray-200'} ${isBusiness ? 'focus:ring-red-500/20' : 'focus:ring-red-500/20'}`}
                        placeholder={isBusiness ? "עבור מה התשלום? (למשל: ציוד משרדי)" : "תיאור ההוצאה"}
                        value={newExpense.description}
                        onFocus={() => isDemo && interceptAction()}
                        onChange={(e) => {
                            setNewExpense({ ...newExpense, description: e.target.value })
                            if (e.target.value) setErrors(prev => ({ ...prev, description: false }))
                        }}
                    />
                </div>

                <div className="flex gap-2 w-full">
                    <div className="flex-1">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">קטגוריה *</label>
                        <Select
                            value={newExpense.category}
                            onValueChange={(value) => {
                                setNewExpense({ ...newExpense, category: value })
                                if (value) setErrors(prev => ({ ...prev, category: false }))
                            }}
                            onOpenChange={(open) => { if (open && isDemo) interceptAction() }}
                        >
                            <SelectTrigger id="category-trigger" className={`w-full h-10 border bg-white dark:bg-slate-800 dark:text-gray-100 focus:ring-2 ${errors.category ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-slate-700'} ${isBusiness ? 'focus:ring-red-500/20' : 'focus:ring-red-500/20'}`}>
                                <SelectValue placeholder="בחר קטגוריה" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-lg border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 bg-white dark:bg-slate-800" title="ניהול קטגוריות" onClick={() => isDemo && interceptAction()}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            }
                        />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                    <div className="col-span-1">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">מטבע</label>
                        <Select
                            value={newExpense.currency}
                            onValueChange={(value) => setNewExpense({ ...newExpense, currency: value })}
                            onOpenChange={(open) => { if (open && isDemo) interceptAction() }}
                        >
                            <SelectTrigger className="w-full h-10 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-gray-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                    <SelectItem key={code} value={code}>{code} ({symbol})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">{isBusiness ? 'סכום (כולל מע"מ) *' : 'סכום כולל *'}</label>
                        <FormattedNumberInput
                            id="amount-input"
                            className={`h-10 ${errors.amount ? 'border-red-500' : 'border-gray-200'} ${isBusiness ? 'focus:ring-red-500/20' : 'focus:ring-red-500/20'}`}
                            placeholder="0.00"
                            value={newExpense.amount}
                            onFocus={() => isDemo && interceptAction()}
                            onChange={(e) => {
                                setNewExpense({ ...newExpense, amount: e.target.value })
                                if (e.target.value) setErrors(prev => ({ ...prev, amount: false }))
                            }}
                        />
                    </div>
                </div>

                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תאריך הוצאה</label>
                    <DatePicker
                        date={newExpense.date ? new Date(newExpense.date) : undefined}
                        setDate={(date) => {
                            if (isDemo) { interceptAction(); return; }
                            setNewExpense({ ...newExpense, date: date ? format(date, 'yyyy-MM-dd') : '' })
                        }}
                        fromDate={startOfMonth}
                        toDate={endOfMonth}
                    />
                </div>

                {isBusiness && newExpense.isDeductible && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-red-50/50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/50">
                        <div>
                            <label className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase mb-1 block">מע"מ מוכר (18%)</label>
                            <div className="text-sm font-bold text-red-900 dark:text-red-300">{formatCurrency(parseFloat(newExpense.vatAmount) || 0, getCurrencySymbol(newExpense.currency))}</div>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-red-800 dark:text-red-400 uppercase mb-1 block">סכום לפני מע"מ</label>
                            <div className="text-sm font-bold text-red-900 dark:text-red-300">{formatCurrency(parseFloat(newExpense.amountBeforeVat) || 0, getCurrencySymbol(newExpense.currency))}</div>
                        </div>
                    </div>
                )}

                {isBusiness && (
                    <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-gray-100 dark:border-slate-700">
                        <Checkbox id="is-deductible" checked={newExpense.isDeductible} onCheckedChange={(checked) => {
                            if (isDemo) { interceptAction(); return; }
                            setNewExpense({ ...newExpense, isDeductible: checked as boolean })
                        }} className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600" />
                        <label htmlFor="is-deductible" className="text-xs font-bold text-[#323338] dark:text-gray-100 cursor-pointer">הוצאה מוכרת לצורכי מס</label>
                    </div>
                )}

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
                        {isBusiness && (
                            <div className="w-full">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">ספק</label>
                                <Select
                                    value={newExpense.supplierId}
                                    onValueChange={(value) => setNewExpense({ ...newExpense, supplierId: value })}
                                    onOpenChange={(open) => { if (open && isDemo) interceptAction() }}
                                >
                                    <SelectTrigger className="w-full h-10 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-red-500/20">
                                        <SelectValue placeholder="ללא ספק ספציפי" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NO_SUPPLIER">ללא ספק ספציפי</SelectItem>
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Client Selector (Visible for everyone or just Business? Usually Business) */}
                        {isBusiness && (
                            <div className="w-full">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">שייך ללקוח (אופציונלי)</label>
                                <SimpleClientSelector
                                    clients={clients}
                                    selectedClientId={newExpense.clientId}
                                    onClientIdChange={(id) => setNewExpense({ ...newExpense, clientId: id })}
                                    placeholder="חפש לקוח..."
                                />
                            </div>
                        )}

                        {/* Project Selector (Personal only) */}
                        {!isBusiness && (
                            <div className="w-full">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">שייך לפרויקט (אופציונלי)</label>
                                <ProjectSelector
                                    projects={projects}
                                    selectedProjectId={newExpense.projectId}
                                    onProjectIdChange={(id) => setNewExpense({ ...newExpense, projectId: id })}
                                    onAddProject={async (name, color) => {
                                        const result = await addProject({ name, color }, 'PERSONAL')
                                        if (result.success) {
                                            mutateProjects()
                                            toast({ title: 'פרויקט נוסף בהצלחה' })
                                        } else {
                                            toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
                                        }
                                    }}
                                    placeholder="חפש פרויקט..."
                                />
                            </div>
                        )}

                        <div className="w-full">
                            <PaymentMethodSelector
                                value={newExpense.paymentMethod}
                                onChange={(val) => {
                                    if (isDemo) { interceptAction(); return; }
                                    setNewExpense({ ...newExpense, paymentMethod: val })
                                }}
                                color={isBusiness ? 'red' : 'red'}
                            />
                        </div>

                        {/* Paid By Field */}
                        {isBusiness && (
                            <div className="w-full">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">שולם על ידי (אופציונלי)</label>
                                <Input
                                    type="text"
                                    value={newExpense.paidBy}
                                    onChange={(e) => setNewExpense({ ...newExpense, paidBy: e.target.value })}
                                    placeholder="שם המשלם"
                                    className="h-10 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-red-500/20"
                                />
                            </div>
                        )}

                        <div className={`flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 w-full ${!isBusiness ? 'bg-white dark:bg-slate-800' : ''}`}>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="recurring-expense"
                                    checked={newExpense.isRecurring}
                                    onCheckedChange={(checked) => {
                                        if (isDemo) { interceptAction(); return; }
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
                    </div>
                )}


                <Button
                    onClick={handleAdd}
                    className={`w-full ${isBusiness ? 'bg-red-600 hover:bg-red-700' : 'bg-[#e2445c] hover:bg-[#d03d54]'} text-white transition-all duration-200 shadow-md hover:shadow-lg`}
                    disabled={submitting}
                >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isMobile ? (initialData ? 'שמור שינויים' : 'הוסף') : (initialData ? 'עדכן הוצאה' : 'הוסף הוצאה'))}
                </Button>
            </div>
        </div >
    )
}
