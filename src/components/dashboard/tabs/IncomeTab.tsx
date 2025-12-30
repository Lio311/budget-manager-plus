'use client'

import { useState, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import { Check, Loader2, Pencil, Plus, Trash2, TrendingDown, X } from 'lucide-react'
import { format } from 'date-fns'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { IncomeForm } from '@/components/dashboard/forms/IncomeForm'
import { DatePicker } from '@/components/ui/date-picker'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { getIncomes, updateIncome, deleteIncome } from '@/lib/actions/income'
import { getCategories } from '@/lib/actions/category'
import { getClients } from '@/lib/actions/clients'
import { useOptimisticDelete } from '@/hooks/useOptimisticMutation'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import { RecurrenceActionDialog } from '../dialogs/RecurrenceActionDialog'
import { Briefcase, DollarSign, TrendingUp, Gift, Home, Landmark, PiggyBank, Wallet } from 'lucide-react'

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
}

export function IncomeTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()

    const isBusiness = budgetType === 'BUSINESS'

    // --- Data Fetching ---

    const fetcherIncomes = async () => {
        const result = await getIncomes(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch incomes')
    }

    const { data, isLoading: loadingIncomes, mutate: mutateIncomes } = useSWR<IncomeData>(
        ['incomes', month, year, budgetType],
        fetcherIncomes,
        { revalidateOnFocus: false }
    )

    const incomes = data?.incomes || []
    const totalIncomeILS = data?.totalILS || 0

    const fetcherClients = async () => {
        const result = await getClients()
        if (result.success && result.data) return result.data
        return []
    }

    const { data: clientsData = [] } = useSWR<any[]>(
        isBusiness ? ['clients'] : null,
        fetcherClients
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

    useAutoPaginationCorrection(currentPage, incomes.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(incomes.length / itemsPerPage)

    const paginatedIncomes = incomes.slice(
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

        if (!confirm('האם אתה בטוח שברצונך למחוק הכנסה זו?')) return

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
            : 'bg-[#00c875] text-white border-transparent')

        if (c.includes('bg-') && c.includes('-100')) {
            c = c.replace(/bg-(\w+)-100/g, 'bg-$1-500')
                .replace(/text-(\w+)-700/g, 'text-white')
                .replace(/border-(\w+)-200/g, 'border-transparent')
        }
        return c
    }

    return (
        <div className="space-y-4 w-full max-w-full overflow-x-hidden pb-10 px-2 md:px-0">
            <div className={`monday-card border-l-4 p-5 flex flex-col justify-center gap-2 ${isBusiness ? 'border-l-blue-600' : 'border-l-[#00c875]'} dark:bg-slate-800`}>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{isBusiness ? 'סך מכירות/הכנסות חודשיות' : 'סך הכנסות חודשיות'}</h3>
                <div className={`text-3xl font-bold ${isBusiness ? 'text-green-600' : 'text-[#00c875]'} ${loadingIncomes ? 'animate-pulse' : ''}`}>
                    {loadingIncomes ? '...' : formatCurrency(totalIncomeILS, '₪')}
                </div>
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
                            <FloatingActionButton onClick={() => setIsMobileOpen(true)} colorClass={isBusiness ? 'bg-green-600' : 'bg-[#00c875]'} label="הוסף הכנסה" />
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
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">{isBusiness ? 'פירוט הכנסות ומכירות' : 'רשימת הכנסות'}</h3>
                        <span className="text-xs text-gray-400 font-medium">{incomes.length} שורות</span>
                    </div>

                    {incomes.length === 0 ? (
                        <div className="glass-panel text-center py-20 text-gray-400">
                            לא נמצאו נתונים לחודש זה
                        </div>
                    ) : (
                        paginatedIncomes.map((income: any) => (
                            <div key={income.id} className="glass-panel p-3 sm:p-4 group relative hover:border-green-200 transition-all border-l-4 border-l-blue-100 dark:border-l-blue-900/50">
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
                                            <Input type="number" value={editData.amount} onChange={e => setEditData({ ...editData, amount: e.target.value })} />
                                            <select className="p-2 border rounded-lg bg-white dark:bg-slate-800 dark:border-slate-700 text-sm dark:text-slate-100" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })}>
                                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                            <DatePicker date={editData.date ? new Date(editData.date) : undefined} setDate={(d) => setEditData({ ...editData, date: d ? format(d, 'yyyy-MM-dd') : '' })} />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>ביטול</Button>
                                            <Button size="sm" onClick={handleUpdate} className={`${isBusiness ? 'bg-green-600 hover:bg-green-700' : 'bg-[#00c875] hover:bg-[#00b268]'} text-white`}>שמור שינויים</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                            <div className="shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(income.category)} shadow-sm`}>
                                                    {getCategoryIcon(income.category)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0 gap-0.5">
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
                                                            <span className="">{income.paymentMethod}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 sm:gap-6 shrink-0 pl-1">
                                            {isBusiness && income.vatAmount > 0 && (
                                                <div className="hidden md:flex flex-col items-end text-[10px] text-gray-400 font-bold uppercase">
                                                    <span>מע"מ: {formatCurrency(income.vatAmount, getCurrencySymbol(income.currency))}</span>
                                                    <span>נקי: {formatCurrency(income.amount - income.vatAmount, getCurrencySymbol(income.currency))}</span>
                                                </div>
                                            )}
                                            <div className="text-right">
                                                <div className={`text-base sm:text-lg font-bold ${isBusiness ? 'text-green-600' : 'text-[#00c875]'}`}>
                                                    {formatCurrency(income.amount, getCurrencySymbol(income.currency || 'ILS'))}
                                                </div>
                                                {income.invoice && (
                                                    <div className="text-[10px] text-gray-400 font-medium hidden sm:block">#{income.invoice.invoiceNumber}</div>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(income)} className="h-7 w-7 sm:h-8 sm:w-8 text-green-500 hover:bg-green-50 rounded-full"><Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(income)} className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {totalPages > 1 && (
                        <div className="mt-4">
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
        </div>
    )
}
