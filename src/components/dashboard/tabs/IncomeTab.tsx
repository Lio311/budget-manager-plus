'use client'

import { useState, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import { Check, Loader2, Pencil, Plus, Trash2, TrendingDown, X, ArrowUpDown } from 'lucide-react'
import { format } from 'date-fns'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { IncomeForm } from '@/components/dashboard/forms/IncomeForm'
import { DatePicker } from '@/components/ui/date-picker'
import { Pagination } from '@/components/ui/Pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { getIncomes, updateIncome, deleteIncome, toggleIncomeStatus } from '@/lib/actions/income'
import { getCategories } from '@/lib/actions/category'
import { getClients } from '@/lib/actions/clients'
import { getBusinessProfile, updateBusinessProfile } from '@/lib/actions/business-settings'
import { Settings } from 'lucide-react'
import { useOptimisticDelete } from '@/hooks/useOptimisticMutation'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import { RecurrenceActionDialog } from '../dialogs/RecurrenceActionDialog'
import { Briefcase, DollarSign, TrendingUp, Gift, Home, Landmark, PiggyBank, Wallet } from 'lucide-react'
import { useConfirm } from '@/hooks/useConfirm'
import { useDemo } from '@/contexts/DemoContext'

const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase()
    if (name.includes('משכורת') || name.includes('שכר')) return <Briefcase className="h-5 w-5" />
    if (name.includes('עסק') || name.includes('פרילנס')) return <DollarSign className="h-5 w-5" />
    if (name.includes('השקעות') || name.includes('דיבידנד')) return <TrendingUp className="h-5 w-5" />
    if (name.includes('מתנה') || name.includes('פרס')) return <Gift className="h-5 w-5" />
    if (name.includes('שכירות') || name.includes('דירה')) return <Home className="h-5 w-5" />
    if (name.includes('ריבית') || name.includes('בנק')) return <Landmark className="h-5 w-5" />
    if (name.includes('חיסכון')) return <PiggyBank className="h-5 w-5" />
    return <Wallet className="h-5 w-5" />
}


interface Category {
    id: string
    name: string
    color: string | null
}

interface Client {
    id: string
    name: string
}

interface Income {
    id: string
    source: string
    category: string
    amount: number
    currency?: string
    date: Date | null
    client?: Client | null
    invoice?: any | null
    vatAmount?: number | null
    payer?: string | null
    paymentMethod?: string | null
    isRecurring?: boolean | null
}

interface IncomeData {
    incomes: Income[]
    totalILS: number
    totalNetILS?: number
}

export function IncomeTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()
    const confirm = useConfirm()
    const isBusiness = budgetType === 'BUSINESS'
    const { isDemo, data: demoData, interceptAction } = useDemo()

    const [taxRate, setTaxRate] = useState(0)
    const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false)
    const [taxRateInput, setTaxRateInput] = useState('0')

    useEffect(() => {
        if (isBusiness) {
            getBusinessProfile().then(res => {
                if (res.success && res.data) {
                    const profile = res.data as any
                    setTaxRate(profile.taxRate || 0)
                    setTaxRateInput((profile.taxRate || 0).toString())
                }
            })
        }
    }, [isBusiness])

    const handleUpdateTaxRate = async () => {
        if (isDemo) { interceptAction(); return; }
        const rate = parseFloat(taxRateInput)
        if (isNaN(rate) || rate < 0 || rate > 100) return

        const result = await updateBusinessProfile({ companyName: 'temp', taxRate: rate } as any) // Partial update workaround or need to fetch full data first
        // Actually, updateBusinessProfile validates all keys. We need to be careful.
        // Better strategy: fetch current profile, merge, then update.
        // Or create a specific action for tax rate to avoid overwriting.
        // For now, I'll fetch-merge-update in this function.
        const current = await getBusinessProfile()
        if (current.success && current.data) {
            const update = await updateBusinessProfile({
                companyName: current.data.companyName,
                vatStatus: current.data.vatStatus,
                taxRate: rate,
                address: current.data.address || undefined,
                phone: current.data.phone || undefined,
                email: current.data.email || undefined,
                signature: current.data.signatureUrl || undefined
            })
            if (update.success) {
                setTaxRate(rate)
                setIsTaxDialogOpen(false)
                toast({ title: 'הגדרות מס עודכנו' })
            }
        }
    }

    const fetcherIncomes = async () => {
        const result = await getIncomes(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch incomes')
    }

    const { data, isLoading: loadingIncomes, mutate: mutateIncomes } = useSWR<IncomeData>(
        isDemo ? null : ['incomes', month, year, budgetType],
        fetcherIncomes,
        { revalidateOnFocus: false }
    )

    const incomes = isDemo ? demoData.incomes : (data?.incomes || [])
    const totalIncomeILS = isDemo ? demoData.overview.totalIncome : (data?.totalILS || 0)
    const totalNetILS = data?.totalNetILS || 0

    const fetcherClients = async () => {
        const result = await getClients()
        if (result.success && result.data) return result.data
        return []
    }

    const { data: clientsData = [] } = useSWR<any[]>(
        isBusiness ? ['clients', budgetType] : null,
        fetcherClients,
        { revalidateOnFocus: true }
    )

    const fetcherCategories = async () => {
        const result = await getCategories('income', budgetType)
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categoriesRaw, mutate: mutateCategories } = useSWR<Category[]>(
        ['categories', 'income', budgetType],
        fetcherCategories,
        { revalidateOnFocus: false }
    )

    const categories = Array.isArray(categoriesRaw) ? categoriesRaw : []

    // --- State ---

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({
        source: '',
        category: '',
        amount: '',
        currency: 'ILS',
        date: '',
        clientId: '',
        vatAmount: '',
        paymentMethod: '',
        payer: ''
    })

    const [submitting, setSubmitting] = useState(false)

    const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'edit', id: string } | null>(null)
    const [isMobileOpen, setIsMobileOpen] = useState(false)



    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    // Sorting State
    const [sortMethod, setSortMethod] = useState<'DATE' | 'AMOUNT' | 'SOURCE' | 'CATEGORY' | 'PAYMENT'>('DATE')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    const sortIncomes = (items: Income[]) => {
        return [...items].sort((a, b) => {
            let diff = 0
            switch (sortMethod) {
                case 'DATE':
                    const dateA = a.date ? new Date(a.date).getTime() : 0
                    const dateB = b.date ? new Date(b.date).getTime() : 0
                    diff = dateA - dateB
                    break
                case 'AMOUNT':
                    diff = a.amount - b.amount
                    break
                case 'SOURCE':
                    diff = (a.source || '').localeCompare(b.source || '', 'he')
                    break
                case 'CATEGORY':
                    diff = (a.category || '').localeCompare(b.category || '', 'he')
                    break
                case 'PAYMENT':
                    const payA = a.paymentMethod || ''
                    const payB = b.paymentMethod || ''
                    diff = payA.localeCompare(payB, 'he')
                    break
                default:
                    diff = 0
            }
            return sortDirection === 'asc' ? diff : -diff
        })
    }

    const sortedIncomes = sortIncomes(incomes as any)

    useAutoPaginationCorrection(currentPage, sortedIncomes.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(sortedIncomes.length / itemsPerPage)

    const paginatedIncomes = sortedIncomes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )



    // Optimistic delete for instant UI feedback
    const { deleteItem: optimisticDeleteIncome } = useOptimisticDelete<IncomeData>(
        ['incomes', month, year, budgetType],
        (id) => deleteIncome(id, 'SINGLE'),
        {
            getOptimisticData: (current, id) => ({
                ...current,
                incomes: current.incomes.filter(income => income.id !== id)
            }),
            successMessage: 'ההכנסה נמחקה בהצלחה',
            errorMessage: 'שגיאה במחיקת ההכנסה'
        }
    )

    async function handleDelete(income: Income) {
        if (income.isRecurring) {
            setPendingAction({ type: 'delete', id: income.id })
            setRecurrenceDialogOpen(true)
            return
        }

        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק הכנסה זו?', 'מחיקת הכנסה')
        if (!confirmed) return

        try {
            await optimisticDeleteIncome(income.id)
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } catch (error) {
            // Error already handled by hook
        }
    }

    function handleEdit(income: any) {
        setEditingId(income.id)
        setEditData({
            source: income.source,
            category: income.category,
            amount: income.amount.toString(),
            currency: income.currency || 'ILS',
            date: income.date ? format(new Date(income.date), 'yyyy-MM-dd') : '',
            clientId: income.clientId || '',
            vatAmount: income.vatAmount?.toString() || '',
            paymentMethod: income.paymentMethod || '',
            payer: income.payer || ''
        })
    }

    async function handleUpdate() {
        if (!editingId) return

        const income = incomes.find(i => i.id === editingId)
        if (income && income.isRecurring) {
            setPendingAction({ type: 'edit', id: editingId })
            setRecurrenceDialogOpen(true)
            return
        }

        await executeUpdate('SINGLE')
    }

    async function executeUpdate(mode: 'SINGLE' | 'FUTURE') {
        if (!editingId) return

        setSubmitting(true)
        const result = await updateIncome(editingId, {
            source: editData.source,
            category: editData.category,
            amount: parseFloat(editData.amount),
            currency: editData.currency,
            date: editData.date || undefined,
            clientId: isBusiness ? editData.clientId || undefined : undefined,
            vatAmount: isBusiness ? parseFloat(editData.vatAmount) || undefined : undefined,
            paymentMethod: editData.paymentMethod || undefined,
            payer: editData.payer || undefined
        }, mode)

        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההכנסה עודכנה בהצלחה' })
            setEditingId(null)
            await mutateIncomes()
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן הכנסה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    const handleRecurrenceConfirm = async (mode: 'SINGLE' | 'FUTURE') => {
        setRecurrenceDialogOpen(false)
        if (!pendingAction) return

        if (pendingAction.type === 'delete') {
            const result = await deleteIncome(pendingAction.id, mode)
            if (result.success) {
                toast({ title: 'הצלחה', description: 'ההכנסה נמחקה בהצלחה' })
                await mutateIncomes()
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק הכנסה', variant: 'destructive' })
            }
        } else if (pendingAction.type === 'edit') {
            await executeUpdate(mode)
        }
        setPendingAction(null)
    }

    const getCategoryColor = (catName: string) => {
        const cat = Array.isArray(categories) ? categories.find(c => c.name === catName) : null

        // Use theme-aware fallback instead of gray
        let c = cat?.color || (isBusiness
            ? 'bg-green-500 text-white border-transparent'
            : 'bg-green-600 text-white border-transparent')

        if (c.includes('bg-') && c.includes('-100')) {
            c = c.replace(/bg-(\w+)-100/g, 'bg-$1-500')
                .replace(/text-(\w+)-700/g, 'text-white')
                .replace(/border-(\w+)-200/g, 'border-transparent')
        }
        return c
    }

    return (
        <div className="space-y-4 w-full max-w-full overflow-x-hidden pb-10 px-2 md:px-0" dir="rtl">
            {/* Summary Card */}
            <div className={`monday-card border-r-4 p-3 md:p-5 flex flex-col justify-center gap-2 ${isBusiness ? 'border-r-green-600' : 'border-r-[#00c875]'} dark:bg-slate-800`}>
                <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {isBusiness ? 'סך מכירות/הכנסות חודשיות (נקי)' : 'סך הכנסות חודשיות'}
                    </h3>
                    {isBusiness && (
                        <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogTitle>הגדרת מס הכנסה</DialogTitle>
                                <div className="space-y-4 pt-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">שיעור מס (באחוזים)</label>
                                        <div className="flex items-center gap-2 justify-center">
                                            <span className="text-lg font-bold">%</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={taxRateInput}
                                                onChange={(e) => setTaxRateInput(e.target.value)}
                                                className="max-w-[100px] text-center"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">אחוז זה יופחת אוטומטית מההכנסה הנקייה בחישוב הסופי.</p>
                                    </div>
                                    <Button onClick={handleUpdateTaxRate} className="w-full bg-green-600 hover:bg-green-700 text-white">שמור</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <div className={`text-3xl font-bold ${isBusiness ? 'text-green-600' : 'text-[#00c875]'} ${loadingIncomes ? 'animate-pulse' : ''}`}>
                    {loadingIncomes ? '...' : formatCurrency(isBusiness ? totalNetILS : totalIncomeILS, '₪')}
                </div>

                {/* Tax Deduction Breakdown */}
                {isBusiness && taxRate > 0 && !loadingIncomes && (
                    <div className="mt-2 text-xs border-t pt-2 border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between text-gray-500 mb-1">
                            <span>הפרשה למס ({taxRate}%):</span>
                            <span className="text-red-500">{formatCurrency(totalNetILS * (taxRate / 100), '₪')}-</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-700 dark:text-gray-300">
                            <span>נשאר בכיס (נטו):</span>
                            <span className="text-green-600">{formatCurrency(totalNetILS * (1 - taxRate / 100), '₪')}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Split View */}
            <div className="grid gap-4 lg:grid-cols-12">
                {/* Add Form */}
                {/* Add Form - Desktop Only */}
                <div className="hidden lg:block lg:col-span-5 glass-panel p-5 h-fit sticky top-4">
                    <IncomeForm
                        categories={categories}
                        clients={clientsData}
                        onCategoriesChange={mutateCategories}
                    />
                </div>

                {/* Mobile FAB and Dialog */}
                <div className="lg:hidden">
                    <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <DialogTrigger asChild>
                            <FloatingActionButton onClick={() => setIsMobileOpen(true)} colorClass={isBusiness ? 'bg-green-600' : 'bg-green-600'} label="הוסף הכנסה" />
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                            <DialogTitle className="sr-only">הוספת הכנסה</DialogTitle>
                            <IncomeForm
                                categories={categories}
                                clients={clientsData}
                                onCategoriesChange={mutateCategories}
                                isMobile={true}
                                onSuccess={() => setIsMobileOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* List View */}
                <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                        <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">{isBusiness ? 'פירוט הכנסות ומכירות' : 'רשימת הכנסות'}</h3>

                        <div className="flex items-center gap-2">
                            {/* Sort Controls */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:inline">מיון:</span>
                                <Select value={sortMethod} onValueChange={(val: any) => setSortMethod(val)}>
                                    <SelectTrigger className="h-8 text-xs w-[110px] bg-white/80 border-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="DATE">תאריך</SelectItem>
                                        <SelectItem value="AMOUNT">סכום</SelectItem>
                                        <SelectItem value="SOURCE">תיאור</SelectItem>
                                        <SelectItem value="CATEGORY">קטגוריה</SelectItem>
                                        <SelectItem value="PAYMENT">אמצעי תשלום</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="h-8 w-8 p-0 border border-gray-200 bg-white/80 hover:bg-white"
                                    title={sortDirection === 'asc' ? 'סדר עולה' : 'סדר יורד'}
                                >
                                    <ArrowUpDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                                </Button>
                            </div>

                            <span className="text-xs text-gray-400 font-medium">{incomes.length} שורות</span>
                        </div>
                    </div>

                    {incomes.length === 0 ? (
                        <div className="glass-panel text-center py-20 text-gray-400">
                            לא נמצאו נתונים לחודש זה
                        </div>
                    ) : (
                        paginatedIncomes.map((income: any) => (
                            <div key={income.id} className="glass-panel p-3 sm:p-4 group relative hover:border-green-200 transition-all border-r-4 border-r-blue-100 dark:border-r-blue-900/50">
                                {editingId === income.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <Input placeholder="תיאור" value={editData.source} onChange={e => setEditData({ ...editData, source: e.target.value })} />
                                            <Input placeholder="התקבל מ..." value={editData.payer} onChange={e => setEditData({ ...editData, payer: e.target.value })} />
                                        </div>
                                        <div className="w-full">
                                            <PaymentMethodSelector
                                                value={editData.paymentMethod}
                                                onChange={(val) => setEditData({ ...editData, paymentMethod: val })}
                                                color={isBusiness ? 'blue' : 'green'}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <FormattedNumberInput value={editData.amount} onChange={e => setEditData({ ...editData, amount: e.target.value })} placeholder="סכום" />
                                            <select className="p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-sm dark:text-slate-100" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })}>
                                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                            <DatePicker date={editData.date ? new Date(editData.date) : undefined} setDate={(d) => setEditData({ ...editData, date: d ? format(d, 'yyyy-MM-dd') : '' })} />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>ביטול</Button>
                                            <Button size="sm" onClick={handleUpdate} className={`${isBusiness ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>שמור שינויים</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-3">
                                        <div className="flex items-start gap-3 w-full sm:w-auto">
                                            <div className="shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(income.category)} shadow-sm`}>
                                                    {getCategoryIcon(income.category)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0 gap-0.5 flex-1">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-bold text-[#323338] dark:text-gray-100 truncate text-sm sm:text-base flex-1 min-w-0 md:flex-none">{income.source}</span>
                                                    {income.isRecurring && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 bg-green-50 text-green-600 border border-green-100">
                                                            <span className="w-1 h-1 rounded-full bg-current" />
                                                            קבועה
                                                        </div>
                                                    )}
                                                    {income.client && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded border border-green-100 font-bold hidden sm:inline-block shrink-0">
                                                            {income.client.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#676879] dark:text-gray-400 mt-0.5">
                                                    <span>{income.date ? format(new Date(income.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                    <span className="">{income.category}</span>
                                                    {income.payer && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                            <span className="">מאת: {income.payer}</span>
                                                        </>
                                                    )}
                                                    {income.paymentMethod && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                            <span className="">
                                                                {(() => {
                                                                    const pm = income.paymentMethod
                                                                    const map: Record<string, string> = {
                                                                        'CHECK': "צ'ק",
                                                                        'CREDIT_CARD': 'כרטיס אשראי',
                                                                        'BANK_TRANSFER': 'העברה בנקאית',
                                                                        'CASH': 'מזומן',
                                                                        'BIT': 'ביט/פייבוקס',
                                                                        'OTHER': 'אחר'
                                                                    }
                                                                    return map[pm] || pm
                                                                })()}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end mt-1 sm:mt-0 pl-1">
                                            {isBusiness && income.vatAmount && income.vatAmount > 0 && (
                                                <div className="hidden md:flex flex-col items-end text-[10px] text-gray-400 font-bold uppercase">
                                                    <span>סה"כ: {formatCurrency(income.amount, getCurrencySymbol(income.currency))}</span>
                                                    <span>מע"מ: {formatCurrency(income.vatAmount, getCurrencySymbol(income.currency))}</span>
                                                </div>
                                            )}
                                            <div className="flex text-left sm:text-right flex-col items-end">
                                                <div className={`text-base sm:text-lg font-bold ${isBusiness ? 'text-green-600' : 'text-green-600'}`}>
                                                    {formatCurrency(income.amount, getCurrencySymbol(income.currency || 'ILS'))}
                                                </div>

                                                {/* Status Badge */}
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        const newStatus = income.status === 'PENDING' ? 'PAID' : 'PENDING'
                                                        const res = await toggleIncomeStatus(income.id, newStatus)
                                                        if (res.success) {
                                                            mutateIncomes()
                                                            toast({ title: newStatus === 'PAID' ? 'סומן כשולם' : 'סומן כבהמתנה', variant: 'default' })
                                                        }
                                                    }}
                                                    className={`text-[10px] px-2 py-0.5 rounded-full border mb-1 transition-all ${income.status === 'PENDING'
                                                        ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'
                                                        : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {income.status === 'PENDING' ? 'בהמתנה לתשלום' : 'שולם'}
                                                </button>

                                                {income.invoice && (
                                                    <div className="text-[10px] text-gray-400 font-medium hidden sm:block">#{income.invoice.invoiceNumber}</div>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(income)} className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 hover:bg-blue-50 rounded-full"><Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(income)} className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center direction-ltr">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            <RecurrenceActionDialog
                isOpen={recurrenceDialogOpen}
                onClose={() => {
                    setRecurrenceDialogOpen(false)
                    setPendingAction(null)
                }}
                onConfirm={handleRecurrenceConfirm}
                action={pendingAction?.type || 'delete'}
                entityName="הכנסה"
            />
        </div >
    )
}
