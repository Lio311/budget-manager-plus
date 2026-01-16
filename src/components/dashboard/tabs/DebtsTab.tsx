'use client'

import useSWR, { useSWRConfig } from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Plus, Trash2, Check, Loader2, Pencil, X, TrendingDown, Wallet, ArrowUpDown, Info } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getDebts, deleteDebt, toggleDebtPaid, updateDebt } from '@/lib/actions/debts'
import { useToast } from '@/hooks/use-toast'
import { useOptimisticToggle, useOptimisticDelete } from '@/hooks/useOptimisticMutation'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { DebtForm } from '@/components/dashboard/forms/DebtForm'
import { Pagination } from '@/components/ui/Pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { DEBT_TYPES, DEBT_TYPE_LABELS, CREDITOR_LABELS } from '@/lib/constants/debt-types'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'

import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import { useDemo } from '@/contexts/DemoContext'
import { DebtsTutorial } from '@/components/dashboard/tutorial/DebtsTutorial'

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
    const { isDemo, data: demoData, interceptAction } = useDemo()
    const [showTutorial, setShowTutorial] = useState(false)

    const fetcher = async () => {
        const result = await getDebts(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch debts')
    }

    const { data: debtsData, isLoading: loading, mutate } = useSWR<DebtsData>(isDemo ? null : ['debts', month, year, budgetType], fetcher, {
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

    const debts = isDemo ? demoData.debts : (debtsData?.debts || [])
    const stats = isDemo ? {
        totalOwedByMeILS: demoData.overview.debts, // simplified for demo
        totalOwedToMeILS: 0,
        netDebtILS: demoData.overview.debts,
        monthlyPaymentOwedByMeILS: 1200, // approximation based on demo data
        monthlyPaymentOwedToMeILS: 0,
        netMonthlyPaymentILS: 1200,
        paidThisMonthILS: 500,
        unpaidThisMonthILS: 700
    } : (debtsData?.stats || {
        totalOwedByMeILS: 0,
        totalOwedToMeILS: 0,
        netDebtILS: 0,
        monthlyPaymentOwedByMeILS: 0,
        monthlyPaymentOwedToMeILS: 0,
        netMonthlyPaymentILS: 0,
        paidThisMonthILS: 0,
        unpaidThisMonthILS: 0
    })

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    // Sorting State
    const [sortMethod, setSortMethod] = useState<'DUE_DAY' | 'AMOUNT' | 'MONTHLY' | 'CREDITOR' | 'STATUS' | 'PAYMENT'>('DUE_DAY')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const sortDebts = (items: Debt[]) => {
        return [...items].sort((a, b) => {
            let diff = 0
            switch (sortMethod) {
                case 'DUE_DAY':
                    diff = a.dueDay - b.dueDay
                    break
                case 'AMOUNT':
                    diff = a.totalAmount - b.totalAmount
                    break
                case 'MONTHLY':
                    diff = a.monthlyPayment - b.monthlyPayment
                    break
                case 'CREDITOR':
                    diff = (a.creditor || '').localeCompare(b.creditor || '', 'he')
                    break
                case 'STATUS':
                    diff = (a.isPaid === b.isPaid) ? 0 : (a.isPaid ? 1 : -1)
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

    const sortedDebts = sortDebts(debts)

    useAutoPaginationCorrection(currentPage, sortedDebts.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(sortedDebts.length / itemsPerPage)

    const paginatedDebts = sortedDebts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Reset pagination when month/year changes
    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const [editingDebt, setEditingDebt] = useState<Debt | null>(null)

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
        setEditingDebt(debt)
    }

    return (
        <div className="space-y-4 p-1" dir="rtl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-[#323338] dark:text-gray-100">ניהול הלוואות</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowTutorial(true)} title="הדרכה">
                    <Info className="h-5 w-5 text-gray-500" />
                </Button>
            </div>
            {/* Summary Cards */}
            <div id="debts-summary" className="grid gap-3 grid-cols-1 md:grid-cols-3">
                <div className="monday-card p-4 border-l-4 border-l-[#00c875] dark:bg-slate-800">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-200 mb-1">יתרה כוללת (נטו)</h3>
                    <div className={`text-2xl font-bold ${loading ? 'animate-pulse text-purple-600' : stats.netDebtILS > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {loading ? '...' : formatCurrency(Math.abs(stats.netDebtILS), '₪')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {loading ? '' : stats.netDebtILS > 0 ? 'הלוואות שלי' : 'חייבים לי'}
                    </p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-[#0073ea] dark:bg-slate-800">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-200 mb-1">תשלום חודשי (נטו)</h3>
                    <div className={`text-2xl font-bold ${loading ? 'animate-pulse text-purple-600' : 'text-slate-900 dark:text-white'}`}>
                        {loading ? '...' : formatCurrency(stats.netMonthlyPaymentILS, '₪')}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">התחייבות חודשית</p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-red-500 dark:bg-slate-800">
                    <h3 className="text-sm font-medium text-muted-foreground dark:text-gray-200 mb-1">נותר לתשלום החודש</h3>
                    <div className={`text-2xl font-bold ${loading ? 'animate-pulse text-purple-600' : 'text-slate-900 dark:text-white'}`}>
                        {loading ? '...' : formatCurrency(stats.unpaidThisMonthILS, '₪')}
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                        {loading ? '' : `${formatCurrency(stats.paidThisMonthILS, '₪')} שולם`}
                    </p>
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Add Debt Form - Desktop Only */}
                <div id="debts-form" className="hidden md:block glass-panel p-5 h-fit">
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
                            <DialogTitle className="sr-only">הוספת הלוואה</DialogTitle>
                            <DebtForm isMobile={true} onSuccess={() => setIsMobileOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Debts List */}
                <div className="glass-panel p-5 block">
                    <div id="debts-list-header" className="flex items-center justify-between mb-4 px-2 flex-wrap gap-2">
                        <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">רשימת הלוואות</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:inline">מיון:</span>
                            <Select value={sortMethod} onValueChange={(val: any) => setSortMethod(val)}>
                                <SelectTrigger className="h-8 text-xs w-[120px] bg-white/80 border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="DUE_DAY">יום חיוב</SelectItem>
                                    <SelectItem value="AMOUNT">סכום כולל</SelectItem>
                                    <SelectItem value="MONTHLY">תשלום חודשי</SelectItem>
                                    <SelectItem value="CREDITOR">מלווה</SelectItem>
                                    <SelectItem value="STATUS">סטטוס</SelectItem>
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
                    </div>

                    <div id="debts-list-container" className="space-y-3">
                        {loading ? (
                            <div className="text-center py-10 text-gray-400">טוען...</div>
                        ) : debts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8 italic">אין הלוואות רשומות</p>
                        ) : (
                            <>
                                {paginatedDebts.map((debt) => (
                                    <div
                                        key={debt.id}
                                        className={`group relative flex flex-col sm:flex-row items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${debt.isPaid ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800' : ''}`}
                                    >
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
                                                    <p className={`font-bold text-base truncate ${debt.isPaid ? 'line-through text-muted-foreground' : 'text-slate-900 dark:text-slate-100'}`}>
                                                        {debt.creditor}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-1 gap-1 mt-1 text-xs text-muted-foreground">
                                                    <span className="truncate text-slate-500 dark:text-slate-400">סה"כ: {formatCurrency(debt.totalAmount, getCurrencySymbol(debt.currency))}</span>
                                                    <span className="text-slate-500 dark:text-slate-400">יום חיוב: {debt.dueDay}</span>
                                                    {debt.paymentMethod && (
                                                        <span className="text-slate-500 dark:text-slate-400">
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
            {/* Edit Debt Dialog */}
            <Dialog open={!!editingDebt} onOpenChange={(open) => !open && setEditingDebt(null)}>
                <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] sm:max-w-[600px] rounded-xl" dir="rtl">
                    <DialogTitle>עריכת הלוואה</DialogTitle>
                    {editingDebt && (
                        <DebtForm
                            initialData={editingDebt}
                            onSuccess={() => {
                                setEditingDebt(null)
                                mutate()
                                globalMutate(key => Array.isArray(key) && key[0] === 'overview')
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <DebtsTutorial
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />
        </div>
    )
}

