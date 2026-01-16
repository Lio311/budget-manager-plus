
'use client'

import { useState, useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { useSearchParams } from 'next/navigation'
import {
    Loader2, Plus, TrendingDown, Settings, ChevronDown, TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDemo } from '@/contexts/DemoContext'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { RecurringEndDatePicker } from '@/components/ui/recurring-end-date-picker'
import { formatCurrency } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { addIncome, updateIncome } from '@/lib/actions/income'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { CategoryManagementDialog } from './CategoryManagementDialog'
import { SimpleClientSelector } from './SimpleClientSelector'
import { ProjectSelector } from './ProjectSelector'
import { addProject, getProjects } from '@/lib/actions/projects'
import useSWR from 'swr'

interface Category {
    id: string
    name: string
    color: string | null
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

interface IncomeFormProps {
    categories: Category[]
    clients: Client[]
    onCategoriesChange?: () => void
    isMobile?: boolean
    onSuccess?: () => void
    initialData?: any
}

export function IncomeForm({ categories, clients, onCategoriesChange, isMobile, onSuccess, initialData }: IncomeFormProps) {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0)
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()
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
    const [timeUnit, setTimeUnit] = useState<'minutes' | 'hours'>('minutes')
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

    const [newIncome, setNewIncome] = useState(initialData ? {
        source: initialData.source || '',
        category: initialData.category || '',
        amount: (budgetType === 'BUSINESS' && initialData.amountBeforeVat)
            ? initialData.amountBeforeVat.toString()
            : (initialData.amount?.toString() || ''),
        currency: initialData.currency || 'ILS',
        date: initialData.date ? format(new Date(initialData.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        isRecurring: initialData.isRecurring || false,
        recurringEndDate: initialData.recurringEndDate || undefined,
        clientId: initialData.clientId || '',
        projectId: initialData.projectId || '',
        amountBeforeVat: initialData.amountBeforeVat?.toString() || '',
        vatRate: initialData.vatRate?.toString() || '0.18',
        vatAmount: initialData.vatAmount?.toString() || '',
        paymentMethod: initialData.paymentMethod || '',
        payer: initialData.payer || '',
        workTime: initialData.workTime?.toString() || '',
        acceptedBy: initialData.acceptedBy || '',
        id: initialData.id // Store ID for update
    } : {
        source: '',
        category: '',
        amount: '',
        currency: 'ILS',
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringEndDate: undefined as string | undefined,
        clientId: '',
        projectId: '',
        amountBeforeVat: '',
        vatRate: '0.18',
        vatAmount: '',
        paymentMethod: '',
        payer: '',
        workTime: '',
        acceptedBy: ''
    })

    useEffect(() => {
        if (initialData) {
            // Open advanced if relevant
            if (initialData.isRecurring || initialData.clientId || initialData.payer || initialData.workTime) {
                setIsAdvancedOpen(true)
            }
        }
    }, [initialData])

    // Handle VAT Calculations
    const calculateFromNet = (net: string, rate: string) => {
        const n = parseFloat(net) || 0
        const r = parseFloat(rate) || 0
        const vat = n * r
        const total = n + vat
        return { total: total.toFixed(2), vat: vat.toFixed(2) }
    }

    // Read date from URL if provided
    const searchParams = useSearchParams()
    useEffect(() => {
        const paramDate = searchParams?.get('date')
        if (paramDate) {
            setNewIncome(prev => ({
                ...prev,
                date: format(new Date(paramDate), 'yyyy-MM-dd')
            }))
        }
    }, [searchParams])

    useEffect(() => {
        if (isBusiness && newIncome.amount && newIncome.vatRate) {
            const { total, vat } = calculateFromNet(newIncome.amount, newIncome.vatRate)
            setNewIncome(prev => ({ ...prev, amountBeforeVat: newIncome.amount, vatAmount: vat }))
        }
    }, [newIncome.amount, newIncome.vatRate, isBusiness])

    // Effect to auto-select first category when categories load if no category is selected
    useEffect(() => {
        if (!newIncome.category && categories.length > 0) {
            setNewIncome(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories])

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
                            amountBeforeVat: input.amountBeforeVat || (isBusiness ? (input.amount - (input.vatAmount || 0)) : input.amount),
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
        console.log('[IncomeForm] Submitting:', newIncome)
        const newErrors: Record<string, boolean> = {}
        if (!newIncome.source) newErrors.source = true
        if (!newIncome.amount) newErrors.amount = true
        if (!newIncome.category) newErrors.category = true

        if (Object.keys(newErrors).length > 0) {
            console.warn('[IncomeForm] Validation failed:', newErrors)
            setErrors(newErrors)
            toast({ title: 'שגיאה', description: 'נא למלא את שדות החובה המסומנים', variant: 'destructive' })

            const firstError = Object.keys(newErrors)[0]
            if (firstError === 'source') document.getElementById('income-source-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            else if (firstError === 'amount') document.getElementById('income-amount-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            else if (firstError === 'category') document.getElementById('income-category-trigger')?.scrollIntoView({ behavior: 'smooth', block: 'center' })

            return
        }
        setErrors({})

        if (newIncome.isRecurring && newIncome.recurringEndDate) {
            const start = new Date(newIncome.date || new Date())
            start.setHours(0, 0, 0, 0)
            const end = new Date(newIncome.recurringEndDate)
            end.setHours(0, 0, 0, 0)
            if (end < start) {
                toast({ title: 'שגיאה', description: 'תאריך סיום חייב להיות מאוחר יותר או שווה לתאריך ההכנסה', variant: 'destructive' })
                setSubmitting(false)
                return
            }
        }

        const incomeData = {
            source: newIncome.source,
            category: newIncome.category,
            amount: isBusiness
                ? (parseFloat(newIncome.amount) || 0) + (parseFloat(newIncome.vatAmount) || 0)
                : parseFloat(newIncome.amount),
            currency: newIncome.currency,
            date: newIncome.date,
            isRecurring: newIncome.isRecurring,
            recurringEndDate: newIncome.isRecurring ? newIncome.recurringEndDate : undefined,
            clientId: isBusiness ? (newIncome.clientId || undefined) : undefined,
            projectId: newIncome.projectId || undefined,
            amountBeforeVat: isBusiness ? (parseFloat(newIncome.amountBeforeVat) || undefined) : undefined,
            vatRate: isBusiness ? (parseFloat(newIncome.vatRate) || undefined) : undefined,
            vatAmount: isBusiness ? (parseFloat(newIncome.vatAmount) || undefined) : undefined,
            paymentMethod: newIncome.paymentMethod || undefined,
            payer: newIncome.payer || undefined,
            workTime: timeUnit === 'minutes' && newIncome.workTime
                ? (parseFloat(newIncome.workTime) / 60).toFixed(2)
                : (newIncome.workTime || undefined),
            acceptedBy: newIncome.acceptedBy || undefined
        }

        try {
            let result;
            if (initialData?.id) {
                // Update mode
                result = await updateIncome(initialData.id, incomeData, 'SINGLE')
            } else {
                // Create mode
                result = await addIncome(month, year, incomeData, budgetType) // Reverted to original addIncome signature
            }

            if (result.success) {
                toast({ title: initialData ? 'הכנסה עודכנה בהצלחה' : 'הכנסה נוספה בהצלחה' })

                // Clear form only on create
                if (!initialData) {
                    setNewIncome({
                        source: '',
                        category: categories.length > 0 ? categories[0].name : '',
                        amount: '',
                        currency: budgetCurrency,
                        date: format(new Date(), 'yyyy-MM-dd'),
                        isRecurring: false,
                        recurringEndDate: undefined,
                        clientId: '',
                        projectId: '',
                        amountBeforeVat: '',
                        vatRate: '0.18',
                        vatAmount: '',
                        paymentMethod: '',
                        payer: '',
                        workTime: '',
                        acceptedBy: ''
                    })
                }

                if (onSuccess) onSuccess()
                globalMutate(key => Array.isArray(key) && (key[0] === 'incomes' || key[0] === 'overview'))
            } else {
                toast({ title: 'שגיאה', description: result.error, variant: 'destructive' })
            }
        } catch (error) {
            console.error(error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בשמירת ההכנסה', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }



    return (
        <div>
            <div className="mb-4 flex items-center gap-2">
                <TrendingUp className={`h-5 w-5 ${isBusiness ? 'text-green-600' : 'text-[#00c875]'}`} />
                <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">{isBusiness ? 'תיעוד מכירה / הכנסה' : 'הוספת הכנסה'}</h3>
                <div className="mr-auto">
                    <CategoryManagementDialog
                        categories={categories}
                        type="income"
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
                </div>
            </div>

            <div className="flex flex-col gap-4">
                {/* Source Input */}
                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תיאור / מקור *</label>
                    <Input
                        id="income-source-input"
                        className={`h-10 focus:ring-green-500/20 ${errors.source ? 'border-red-500' : 'border-gray-200'}`}
                        placeholder={isBusiness ? "תיאור המכירה (למשל: ייעוץ עסקי)" : "שם המקור"}
                        value={newIncome.source}
                        onFocus={() => isDemo && interceptAction()}
                        onChange={(e) => {
                            setNewIncome({ ...newIncome, source: e.target.value })
                            if (e.target.value) setErrors(prev => ({ ...prev, source: false }))
                        }}
                    />
                </div>

                {isBusiness && (
                    <div className="w-full">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">לקוח</label>
                        <SimpleClientSelector
                            clients={clients}
                            selectedClientId={newIncome.clientId}
                            onClientIdChange={(id) => setNewIncome({ ...newIncome, clientId: id })}
                            placeholder="חפש לקוח..."
                        />
                    </div>
                )}

                {/* Category Select */}
                <div className="flex gap-2 w-full">
                    <div className="flex-1">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">קטגוריה *</label>
                        <Select
                            value={newIncome.category}
                            onValueChange={(value) => {
                                setNewIncome({ ...newIncome, category: value })
                                if (value) setErrors(prev => ({ ...prev, category: false }))
                            }}
                            onOpenChange={(open) => { if (open && isDemo) interceptAction() }}
                        >
                            <SelectTrigger id="income-category-trigger" className={`w-full text-right h-11 md:h-10 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 focus:ring-green-500/20 focus:border-green-500 rounded-lg ${errors.category ? '!border-red-500 dark:!border-red-500 ring-1 ring-red-500/20' : ''}`}>
                                <SelectValue placeholder="בחר קטגוריה" />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="text-right max-h-[200px]">
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name} className="pr-8">{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="pt-6">
                        <CategoryManagementDialog
                            categories={categories}
                            type="income"
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
                            value={newIncome.currency}
                            onValueChange={(value) => setNewIncome({ ...newIncome, currency: value })}
                            onOpenChange={(open) => { if (open && isDemo) interceptAction() }}
                        >
                            <SelectTrigger className="w-full h-10 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-gray-100 focus:ring-2 focus:ring-green-500/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir="rtl" className="text-right">
                                {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                    <SelectItem key={code} value={code} className="pr-8">{code} ({symbol})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">{isBusiness ? 'סכום לפני מע"מ *' : 'סכום כולל *'}</label>
                        <FormattedNumberInput
                            id="income-amount-input"
                            className={`h-10 ${errors.amount ? 'border-red-500' : 'border-gray-200'} ${isBusiness ? 'focus:ring-green-500/20' : 'focus:ring-green-500/20'}`}
                            placeholder="0.00"
                            value={newIncome.amount}
                            onFocus={() => isDemo && interceptAction()}
                            onChange={(e) => {
                                setNewIncome({ ...newIncome, amount: e.target.value })
                                if (e.target.value) setErrors(prev => ({ ...prev, amount: false }))
                            }}
                        />
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

                {/* Date Selection (Always Visible for both now) */}
                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תאריך קבלה</label>
                    <DatePicker
                        date={newIncome.date ? new Date(newIncome.date) : undefined}
                        setDate={(date) => {
                            if (isDemo) { interceptAction(); return; }
                            setNewIncome({ ...newIncome, date: date ? format(date, 'yyyy-MM-dd') : '' })
                        }}
                        fromDate={startOfMonth}
                        toDate={endOfMonth}
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

                        {/* Payer / Accepted By */}
                        <div className={`grid gap-3 w-full ${isBusiness ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                            {/* Payer Input */}
                            <div className="w-full">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">התקבל מ... (אופציונלי)</label>
                                <Input
                                    className="h-10 border-gray-200 focus:ring-green-500/20 bg-white dark:bg-slate-800"
                                    placeholder="שם המשלם"
                                    value={newIncome.payer}
                                    onFocus={() => isDemo && interceptAction()}
                                    onChange={(e) => setNewIncome({ ...newIncome, payer: e.target.value })}
                                />
                            </div>

                            {isBusiness && (
                                <div className="w-full">
                                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">התקבל על ידי (אופציונלי)</label>
                                    <Input className="h-10 border-gray-200 focus:ring-green-500/20" placeholder="שם העובד/מקבל" value={newIncome.acceptedBy} onChange={(e) => setNewIncome({ ...newIncome, acceptedBy: e.target.value })} />
                                </div>
                            )}
                        </div>

                        {/* Project Selector (Personal only) */}
                        {!isBusiness && (
                            <div className="w-full">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">שייך לפרויקט (אופציונלי)</label>
                                <ProjectSelector
                                    projects={projects}
                                    selectedProjectId={newIncome.projectId}
                                    onProjectIdChange={(id) => setNewIncome({ ...newIncome, projectId: id })}
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

                        {isBusiness && (
                            <div className="w-full">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold text-[#676879] dark:text-gray-300">זמן עבודה</label>

                                    {/* Custom Toggle */}
                                    <div className="bg-gray-100 dark:bg-slate-800 p-0.5 rounded-lg flex border border-gray-200 dark:border-slate-700">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (timeUnit === 'minutes') return
                                                setTimeUnit('minutes')
                                                // Convert Hours to Minutes
                                                const val = parseFloat(newIncome.workTime)
                                                if (!isNaN(val)) {
                                                    setNewIncome(prev => ({ ...prev, workTime: (val * 60).toFixed(0) }))
                                                }
                                            }}
                                            className={`px-3 py-0.5 text-xs font-medium rounded-md transition-all ${timeUnit === 'minutes'
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                                }`}
                                        >
                                            דקות
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (timeUnit === 'hours') return
                                                setTimeUnit('hours')
                                                // Convert Minutes to Hours
                                                const val = parseFloat(newIncome.workTime)
                                                if (!isNaN(val)) {
                                                    setNewIncome(prev => ({ ...prev, workTime: (val / 60).toFixed(2).replace(/\.00$/, '') }))
                                                }
                                            }}
                                            className={`px-3 py-0.5 text-xs font-medium rounded-md transition-all ${timeUnit === 'hours'
                                                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                                }`}
                                        >
                                            שעות
                                        </button>
                                    </div>
                                </div>
                                <Input
                                    type="number"
                                    step={timeUnit === 'hours' ? "0.1" : "1"}
                                    min="0"
                                    className="h-10 border-gray-200 focus:ring-green-500/20"
                                    placeholder={timeUnit === 'hours' ? "לדוגמה: 1.5" : "לדוגמה: 90"}
                                    value={newIncome.workTime}
                                    onChange={(e) => {
                                        // Allow decimals only if in hours mode
                                        const val = e.target.value;
                                        if (val === '' || (timeUnit === 'hours' ? /^\d*\.?\d*$/ : /^\d+$/).test(val)) {
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
                                onChange={(val) => {
                                    if (isDemo) { interceptAction(); return; }
                                    setNewIncome({ ...newIncome, paymentMethod: val })
                                }}
                                color="green"
                            />
                        </div>

                        {/* Recurring Checkbox */}
                        <div className={`flex items-start gap-4 p-4 border border-gray-100 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 w-full ${!isBusiness ? 'bg-white dark:bg-slate-800' : ''}`}>
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="recurring-income"
                                    checked={newIncome.isRecurring}
                                    onCheckedChange={(checked) => {
                                        const isRecurring = checked as boolean
                                        setNewIncome(prev => ({
                                            ...prev,
                                            isRecurring,
                                            recurringEndDate: isRecurring ? prev.recurringEndDate : undefined
                                        }))
                                    }}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                />
                                <label htmlFor="recurring-income" className="text-sm font-medium cursor-pointer text-[#323338] dark:text-gray-100">הכנסה קבועה</label>
                            </div>
                            {newIncome.isRecurring && (
                                <div className="flex gap-4 flex-1">
                                    <div className="space-y-2 w-full">
                                        <label className="text-xs font-medium text-[#676879] dark:text-gray-300">תאריך סיום</label>
                                        <RecurringEndDatePicker
                                            date={newIncome.recurringEndDate ? new Date(newIncome.recurringEndDate) : undefined}
                                            setDate={(date) => setNewIncome(prev => ({ ...prev, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : undefined }))}
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
                    className={`w-full ${isBusiness ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white transition-all duration-200 shadow-md hover:shadow-lg`}
                    disabled={submitting}
                >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (isMobile ? (initialData ? 'שמור שינויים' : 'הוסף') : (initialData ? 'עדכן הכנסה' : 'הוסף הכנסה'))}
                </Button>
            </div>
        </div>
    )
}
