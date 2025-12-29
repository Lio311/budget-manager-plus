'use client'

import useSWR, { useSWRConfig } from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Check, Loader2, Pencil, X, TrendingDown, Wallet } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getDebts, deleteDebt, toggleDebtPaid, updateDebt } from '@/lib/actions/debts'
import { useToast } from '@/hooks/use-toast'
import { useOptimisticToggle, useOptimisticDelete } from '@/hooks/useOptimisticMutation'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { DebtForm } from '@/components/dashboard/forms/DebtForm'
import { Pagination } from '@/components/ui/Pagination'
import { DatePicker } from '@/components/ui/date-picker'
import { DEBT_TYPES, DEBT_TYPE_LABELS, CREDITOR_LABELS } from '@/lib/constants/debt-types'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'

import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'

interface Debt {
    id: string
    creditor: string
    debtType: string
    totalAmount: number
    currency: string
    monthlyPayment: number
    dueDay: number
    isPaid: boolean
    paymentMethod?: string | null
}

interface DebtsData {
    debts: Debt[]
    stats: {
        totalOwedByMeILS: number
        totalOwedToMeILS: number
        netDebtILS: number
        monthlyPaymentOwedByMeILS: number
        monthlyPaymentOwedToMeILS: number
        netMonthlyPaymentILS: number
        paidThisMonthILS: number
        unpaidThisMonthILS: number
    }
}

export function DebtsTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const fetcher = async () => {
        const result = await getDebts(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch debts')
    }

    const { data: debtsData, isLoading: loading, mutate } = useSWR<DebtsData>(['debts', month, year, budgetType], fetcher, {
        revalidateOnFocus: false,
        onError: (err) => {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון הלוואות',
                variant: 'destructive',
                duration: 1000
            })
        }
    })

    const debts = debtsData?.debts || []
    const stats = debtsData?.stats || {
        totalOwedByMeILS: 0,
        totalOwedToMeILS: 0,
        netDebtILS: 0,
        monthlyPaymentOwedByMeILS: 0,
        monthlyPaymentOwedToMeILS: 0,
        netMonthlyPaymentILS: 0,
        paidThisMonthILS: 0,
        unpaidThisMonthILS: 0
    }

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    useAutoPaginationCorrection(currentPage, debts.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(debts.length / itemsPerPage)

    const paginatedDebts = debts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset pagination when month/year changes
    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<{ creditor: string; debtType: string; totalAmount: string; currency: string; monthlyPayment: string; dueDay: string; paymentMethod: string }>({
        creditor: '',
        debtType: DEBT_TYPES.OWED_BY_ME,
        totalAmount: '',
        currency: 'ILS',
        monthlyPayment: '',
        dueDay: '',
        paymentMethod: ''
    })

    // Optimistic delete for instant UI feedback
    const { deleteItem: optimisticDeleteDebt } = useOptimisticDelete<DebtsData>(
        ['debts', month, year, budgetType],
        deleteDebt,
        {
            getOptimisticData: (current, id) => ({
                ...current,
                debts: current.debts.filter(debt => debt.id !== id)
            }),
            successMessage: 'ההלוואה נמחקה בהצלחה',
            errorMessage: 'שגיאה במחיקת ההלוואה'
        }
    )

    const handleDelete = async (id: string) => {
        try {
            await optimisticDeleteDebt(id)
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } catch (error) {
            // Error already handled by hook
        }
    }

    // Optimistic toggle for instant UI feedback
    const { toggle: optimisticTogglePaid } = useOptimisticToggle<DebtsData>(
        ['debts', month, year, budgetType],
        toggleDebtPaid,
        {
            getOptimisticData: (current, id, newValue) => ({
                ...current,
                debts: current.debts.map(debt =>
                    debt.id === id ? { ...debt, isPaid: newValue } : debt
                )
            }),
            successMessage: undefined,
            errorMessage: 'שגיאה בעדכון סטטוס החוב'
        }
    )

    const togglePaid = async (id: string, currentStatus: boolean) => {
        try {
            await optimisticTogglePaid(id, currentStatus)
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } catch (error) {
            // Error already handled by hook
        }
    }

    function handleEdit(debt: Debt) {
        setEditingId(debt.id)
        setEditData({
            creditor: debt.creditor,
            debtType: debt.debtType,
            totalAmount: debt.totalAmount.toString(),
            currency: debt.currency || 'ILS', // Backup default
            monthlyPayment: debt.monthlyPayment.toString(),
            dueDay: debt.dueDay.toString(),
            paymentMethod: debt.paymentMethod || ''
        })
    }

    function handleCancelEdit() {
        setEditingId(null)
        setEditData({ creditor: '', debtType: DEBT_TYPES.OWED_BY_ME, totalAmount: '', currency: 'ILS', monthlyPayment: '', dueDay: '', paymentMethod: '' })
    }

    async function handleUpdate() {
        if (!editingId || !editData.creditor || !editData.totalAmount || !editData.monthlyPayment || !editData.dueDay) {
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל השדות',
                variant: 'destructive',
                duration: 1000
            })
            return
        }

        const dueDay = parseInt(editData.dueDay)
        if (dueDay < 1 || dueDay > 31) {
            toast({
                title: 'שגיאה',
                description: 'יום תשלום חייב להיות בין 1 ל-31',
                variant: 'destructive',
                duration: 1000
            })
            return
        }

        setSubmitting(true)
        const result = await updateDebt(editingId, {
            creditor: editData.creditor,
            debtType: editData.debtType,
            totalAmount: parseFloat(editData.totalAmount),
            currency: editData.currency,
            monthlyPayment: parseFloat(editData.monthlyPayment),
            dueDay,
            paymentMethod: editData.paymentMethod || undefined
        })

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'ההלוואה עודכנה בהצלחה',
                duration: 1000
            })
            setEditingId(null)
            setEditData({ creditor: '', debtType: DEBT_TYPES.OWED_BY_ME, totalAmount: '', currency: 'ILS', monthlyPayment: '', dueDay: '', paymentMethod: '' })
            await mutate()
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן הלוואה',
                variant: 'destructive',
                duration: 1000
            })
        }
        setSubmitting(false)
    }

    return (
        <div className="space-y-4 p-1" dir="rtl">
            {/* Summary Cards */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                <div className="monday-card p-4 border-l-4 border-l-[#00c875]">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">יתרה כוללת (נטו)</h3>
                    <div className={`text-2xl font-bold ${loading ? 'animate-pulse text-purple-600' : stats.netDebtILS > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {loading ? '...' : formatCurrency(Math.abs(stats.netDebtILS), '₪')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {loading ? '' : stats.netDebtILS > 0 ? 'הלוואות שלי' : 'חייבים לי'}
                    </p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-[#0073ea]">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">תשלום חודשי (נטו)</h3>
                    <div className={`text-2xl font-bold ${loading ? 'animate-pulse text-purple-600' : 'text-slate-900'}`}>
                        {loading ? '...' : formatCurrency(stats.netMonthlyPaymentILS, '₪')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">התחייבות חודשית</p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-red-500">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">נותר לתשלום החודש</h3>
                    <div className={`text-2xl font-bold ${loading ? 'animate-pulse text-purple-600' : 'text-slate-900'}`}>
                        {loading ? '...' : formatCurrency(stats.unpaidThisMonthILS, '₪')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {loading ? '' : `${formatCurrency(stats.paidThisMonthILS, '₪')} שולם`}
                    </p>
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Add Debt Form - Desktop Only */}
                <div className="hidden md:block glass-panel p-5 h-fit">
                    <DebtForm />
                </div>

                {/* Mobile FAB and Dialog */}
                <div className="md:hidden">
                    <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <DialogTrigger asChild>
                            <FloatingActionButton
                                onClick={() => setIsMobileOpen(true)}
                                colorClass="bg-purple-600"
                                label="הוסף הלוואה"
                            />
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                            <DebtForm isMobile={true} onSuccess={() => setIsMobileOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Debts List */}
                <div className="glass-panel p-5 block">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <h3 className="text-lg font-bold text-[#323338]">רשימת הלוואות</h3>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="text-center py-10 text-gray-400">טוען...</div>
                        ) : debts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8 italic">אין הלוואות רשומות</p>
                        ) : (
                            <>
                                {paginatedDebts.map((debt) => (
                                    <div
                                        key={debt.id}
                                        className={`group relative flex flex-col sm:flex-row items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${debt.isPaid ? 'bg-green-50/50 border-green-200' : ''}`}
                                    >
                                        {editingId === debt.id ? (
                                            <div className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                                                {/* Row 1: Creditor Name - Full Width */}
                                                <div className="w-full">
                                                    <Input
                                                        placeholder="שם המלווה"
                                                        className="h-9"
                                                        value={editData.creditor}
                                                        onChange={(e) => setEditData({ ...editData, creditor: e.target.value })}
                                                        disabled={submitting}
                                                    />
                                                </div>

                                                {/* Row 2: Currency, Total Amount, Monthly Payment, Due Day */}
                                                <div className="flex flex-wrap gap-2 w-full">
                                                    <select
                                                        className="p-2 border rounded-lg h-9 bg-white text-sm min-w-[80px] flex-1"
                                                        value={editData.currency}
                                                        onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                                                        disabled={submitting}
                                                    >
                                                        {Object.keys(SUPPORTED_CURRENCIES).map(code => (
                                                            <option key={code} value={code}>{code}</option>
                                                        ))}
                                                    </select>
                                                    <Input
                                                        type="number"
                                                        placeholder="סכום כולל"
                                                        className="h-9 min-w-[80px] flex-1"
                                                        value={editData.totalAmount}
                                                        onChange={(e) => setEditData({ ...editData, totalAmount: e.target.value })}
                                                        disabled={submitting}
                                                        dir="ltr"
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="תשלום חודשי"
                                                        className="h-9 min-w-[80px] flex-1"
                                                        value={editData.monthlyPayment}
                                                        onChange={(e) => setEditData({ ...editData, monthlyPayment: e.target.value })}
                                                        disabled={submitting}
                                                        dir="ltr"
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="יום חיוב"
                                                        min="1"
                                                        max="31"
                                                        className="h-9 min-w-[60px] flex-1"
                                                        value={editData.dueDay}
                                                        onChange={(e) => setEditData({ ...editData, dueDay: e.target.value })}
                                                        disabled={submitting}
                                                        dir="ltr"
                                                    />
                                                </div>

                                                {/* Row 3: Payment Method - Full Width */}
                                                <div className="w-full">
                                                    <PaymentMethodSelector
                                                        value={editData.paymentMethod}
                                                        onChange={(val) => setEditData({ ...editData, paymentMethod: val })}
                                                    />
                                                </div>

                                                {/* Row 4: Buttons */}
                                                <div className="flex justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                                        ביטול
                                                    </Button>
                                                    <Button size="sm" onClick={handleUpdate} className="bg-purple-600 hover:bg-purple-700 text-white">
                                                        שמור שינויים
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-start gap-3 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => togglePaid(debt.id, debt.isPaid)}
                                                        className={`mt-1 w-6 h-6 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${debt.isPaid ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'
                                                            }`}
                                                    >
                                                        {debt.isPaid && <Check className="h-4 w-4 text-white" />}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${debt.debtType === DEBT_TYPES.OWED_BY_ME
                                                                ? 'bg-red-500 text-white border-transparent'
                                                                : 'bg-blue-500 text-white border-transparent'
                                                                }`}>
                                                                {DEBT_TYPE_LABELS[debt.debtType as keyof typeof DEBT_TYPE_LABELS]}
                                                            </span>
                                                            <p className={`font-bold text-base truncate ${debt.isPaid ? 'line-through text-muted-foreground' : 'text-slate-900'}`}>
                                                                {debt.creditor}
                                                            </p>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-1 mt-1 text-xs text-muted-foreground">
                                                            <span className="truncate text-slate-500">סה"כ: {formatCurrency(debt.totalAmount, getCurrencySymbol(debt.currency))}</span>
                                                            <span className="text-slate-500">יום חיוב: {debt.dueDay}</span>
                                                            {debt.paymentMethod && (
                                                                <span className="text-slate-500">
                                                                    • {debt.paymentMethod}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 pl-1">
                                                    <div className="text-right sm:text-left">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">תשלום החודש</p>
                                                        <span className={`text-lg font-black ${debt.isPaid ? 'text-green-600' : 'text-purple-600'}`}>
                                                            {formatCurrency(debt.monthlyPayment, getCurrencySymbol(debt.currency))}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(debt)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 rounded-full"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(debt.id)}
                                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-full"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

