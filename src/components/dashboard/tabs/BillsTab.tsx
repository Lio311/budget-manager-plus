'use client'

import { useState, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { CreditCard, Loader2, Pencil, Trash2, Check, X, ArrowUpDown } from 'lucide-react'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Pagination } from '@/components/ui/Pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getBills, updateBill, deleteBill, toggleBillPaid } from '@/lib/actions/bill'
import { formatCurrency } from '@/lib/utils'
import { useOptimisticToggle, useOptimisticDelete } from '@/hooks/useOptimisticMutation'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'
import { PaymentMethodSelector } from '../PaymentMethodSelector'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { BillForm } from '@/components/dashboard/forms/BillForm'
import { useDemo } from '@/contexts/DemoContext'

interface Bill {
    id: string
    name: string
    amount: number
    currency: string
    dueDate: Date | string
    isPaid: boolean
    paymentMethod?: string | null
    isRecurring: boolean
}

interface BillData {
    bills: Bill[]
    totalILS: number
    totalPaidILS: number
    totalUnpaidILS: number
}

export function BillsTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()
    const { isDemo, data: demoData, interceptAction } = useDemo()

    // Mobile Dialog State
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const fetcher = async () => {
        const result = await getBills(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch bills')
    }

    const { data, isLoading: loading, mutate } = useSWR<BillData>(isDemo ? null : ['bills', month, year, budgetType], fetcher, {
        revalidateOnFocus: false,
        onError: (err) => {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון חשבונות',
                variant: 'destructive',
                duration: 1000
            })
        }
    })

    const bills = isDemo ? demoData.bills : (data?.bills || [])
    const totalBillsILS = isDemo ? demoData.overview.upcomingBills : (data?.totalILS || 0)
    const totalPaidILS = isDemo ? demoData.bills.filter(b => b.isPaid).reduce((sum, b) => sum + b.amount, 0) : (data?.totalPaidILS || 0)
    const totalUnpaidILS = isDemo ? demoData.bills.filter(b => !b.isPaid).reduce((sum, b) => sum + b.amount, 0) : (data?.totalUnpaidILS || 0)

    const [editingBill, setEditingBill] = useState<Bill | null>(null)
    const [isEditMobileOpen, setIsEditMobileOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    // Sorting State
    const [sortMethod, setSortMethod] = useState<'DUE_DATE' | 'AMOUNT' | 'NAME' | 'STATUS' | 'PAYMENT'>('DUE_DATE')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const sortBills = (items: Bill[]) => {
        return [...items].sort((a, b) => {
            let diff = 0
            switch (sortMethod) {
                case 'DUE_DATE':
                    const dayA = new Date(a.dueDate).getDate()
                    const dayB = new Date(b.dueDate).getDate()
                    diff = dayA - dayB
                    break
                case 'AMOUNT':
                    diff = a.amount - b.amount
                    break
                case 'NAME':
                    diff = (a.name || '').localeCompare(b.name || '', 'he')
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

    const sortedBills = sortBills(bills)

    useAutoPaginationCorrection(currentPage, sortedBills.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(sortedBills.length / itemsPerPage)

    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const paginatedBills = sortedBills.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Optimistic toggle for instant UI feedback
    const { toggle: optimisticTogglePaid } = useOptimisticToggle<BillData>(
        ['bills', month, year, budgetType],
        toggleBillPaid,
        {
            getOptimisticData: (current, id, newValue) => {
                const updatedBills = current.bills.map(bill =>
                    bill.id === id ? { ...bill, isPaid: newValue } : bill
                )

                // Recalculate totals
                const paidBills = updatedBills.filter(b => b.isPaid)
                const unpaidBills = updatedBills.filter(b => !b.isPaid)

                return {
                    ...current,
                    bills: updatedBills,
                    totalPaidILS: paidBills.reduce((sum, b) => sum + b.amount, 0),
                    totalUnpaidILS: unpaidBills.reduce((sum, b) => sum + b.amount, 0)
                }
            },
            successMessage: undefined, // Silent success for better UX
            errorMessage: 'שגיאה בעדכון סטטוס החשבון'
        }
    )

    async function handleTogglePaid(id: string, currentStatus: boolean) {
        try {
            await optimisticTogglePaid(id, currentStatus)
            // Also update overview data
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } catch (error) {
            // Error already handled by hook
        }
    }

    function handleEdit(bill: Bill) {
        setEditingBill(bill)
        setIsEditMobileOpen(true)
    }

    function handleCancelEdit() {
        setEditingBill(null)
        setIsEditMobileOpen(false)
    }

    // Removed handleUpdate as it's now handled by the form

    // Optimistic delete for instant UI feedback
    const { deleteItem: optimisticDeleteBill } = useOptimisticDelete<BillData>(
        ['bills', month, year, budgetType],
        deleteBill,
        {
            getOptimisticData: (current, id) => {
                const updatedBills = current.bills.filter(bill => bill.id !== id)
                const paidBills = updatedBills.filter(b => b.isPaid)
                const unpaidBills = updatedBills.filter(b => !b.isPaid)

                return {
                    ...current,
                    bills: updatedBills,
                    totalILS: updatedBills.reduce((sum, b) => sum + b.amount, 0),
                    totalPaidILS: paidBills.reduce((sum, b) => sum + b.amount, 0),
                    totalUnpaidILS: unpaidBills.reduce((sum, b) => sum + b.amount, 0)
                }
            },
            successMessage: 'החשבון נמחק בהצלחה',
            errorMessage: 'שגיאה במחיקת החשבון'
        }
    )

    async function handleDelete(id: string) {
        try {
            await optimisticDeleteBill(id)
            // Also update overview data
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } catch (error) {
            // Error already handled by hook
        }
    }


    return (
        <div className="space-y-4 p-1" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="monday-card p-4 border-l-4 border-l-blue-500 min-w-0 dark:bg-slate-800 dark:border-blue-500/50">
                    <p className="text-xs text-gray-500 mb-1 truncate">סה"כ לתשלום (חודשי)</p>
                    <p className={`text-base md:text-xl font-bold text-[#323338] dark:text-gray-100 truncate ${loading ? 'animate-pulse' : ''}`}>
                        {loading ? '...' : formatCurrency(totalBillsILS, '₪')}
                    </p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-green-500 min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">שולם</p>
                    <p className={`text-base md:text-xl font-bold text-[#00c875] truncate ${loading ? 'animate-pulse' : ''}`}>
                        {loading ? '...' : formatCurrency(totalPaidILS, '₪')}
                    </p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-red-500 min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">נותר לתשלום</p>
                    <p className={`text-base md:text-xl font-bold text-[#e2445c] truncate ${loading ? 'animate-pulse' : ''}`}>
                        {loading ? '...' : formatCurrency(totalUnpaidILS, '₪')}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Desktop Form */}
                <div className="glass-panel p-5 h-fit hidden md:block">
                    <div className="flex items-center gap-2 mb-4 min-w-0">
                        <CreditCard className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <h3 className="text-base md:text-lg font-bold text-[#323338] dark:text-gray-100 truncate flex-1 min-w-0">הוספת חשבון חדש</h3>
                    </div>
                    <BillForm />
                </div>

                {/* Mobile FAB */}
                <div className="md:hidden">
                    <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <DialogTrigger asChild>
                            <FloatingActionButton onClick={() => setIsMobileOpen(true)} colorClass="bg-orange-500" label="הוסף חשבון" />
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                            <DialogTitle className="sr-only">הוספת חשבון חדש</DialogTitle>
                            <div className="mt-4">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">יצירת חשבון חדש</h3>
                                <BillForm onSuccess={() => setIsMobileOpen(false)} isMobile={true} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditMobileOpen} onOpenChange={setIsEditMobileOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                        <DialogTitle className="text-right">עריכת חשבון</DialogTitle>
                        {editingBill && (
                            <BillForm
                                onSuccess={() => setIsEditMobileOpen(false)}
                                initialData={editingBill}
                            />
                        )}
                    </DialogContent>
                </Dialog>


                <div className="glass-panel p-5 block">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">רשימת חשבונות</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:inline">מיון:</span>
                            <Select value={sortMethod} onValueChange={(val: any) => setSortMethod(val)}>
                                <SelectTrigger className="h-8 text-xs w-[110px] bg-white/80 border-gray-200">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="DUE_DATE">תאריך תשלום</SelectItem>
                                    <SelectItem value="AMOUNT">סכום</SelectItem>
                                    <SelectItem value="NAME">שם</SelectItem>
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
                    <div className="space-y-3">
                        {loading ? (
                            // Skeleton loader while loading
                            <>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl animate-pulse">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="h-4 bg-gray-200 rounded w-20"></div>
                                            <div className="h-4 bg-gray-200 rounded w-12"></div>
                                        </div>
                                    </div>
                                ))}
                            </>
                        ) : bills.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                לא נמצאו חשבונות לחודש זה
                            </div>
                        ) : (
                            <>
                                {paginatedBills.map((bill: Bill) => (
                                    <div
                                        key={bill.id}
                                        className="group relative flex flex-col md:flex-row items-center justify-between p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 gap-3"
                                    >
                                        <div className="w-full">
                                            <div className="flex flex-wrap items-center justify-between w-full gap-y-2">
                                                {/* Right side (RTL): Checkbox + Name + Date */}
                                                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => handleTogglePaid(bill.id, bill.isPaid)}
                                                            className={`
                                                            w-14 h-7 rounded-full text-[10px] font-medium transition-all duration-200 flex items-center justify-center
                                                            ${bill.isPaid
                                                                    ? 'bg-[#00c875] text-white hover:bg-[#00b065] shadow-sm'
                                                                    : 'bg-[#ffcb00] text-[#323338] hover:bg-[#eabb00]'
                                                                }
                                                        `}
                                                        >
                                                            {bill.isPaid ? 'שולם' : 'ממתין'}
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-col min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold text-sm sm:text-base transition-colors truncate ${bill.isPaid ? 'text-gray-400 line-through' : 'text-[#323338] dark:text-gray-100'}`}>
                                                                {bill.name}
                                                            </span>
                                                            {bill.isRecurring && (
                                                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${budgetType === 'BUSINESS' ? 'bg-orange-100 text-orange-700' : 'bg-orange-50 text-orange-600 border border-orange-100'}`}>
                                                                    <span className="w-1 h-1 rounded-full bg-current" />
                                                                    קבוע
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs text-[#676879]">
                                                            <span className="shrink-0">
                                                                תאריך תשלום: {new Date(bill.dueDate).getDate()} בחודש
                                                            </span>
                                                            {bill.paymentMethod && (
                                                                <>
                                                                    <span className="hidden sm:inline">•</span>
                                                                    <span className="truncate">{bill.paymentMethod}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Left side (RTL): Amount + Actions */}
                                                <div className="flex items-center gap-2 sm:gap-4 justify-between sm:justify-end w-full sm:w-auto mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-gray-50 dark:border-slate-700/50">
                                                    <span className={`text-base sm:text-lg font-bold ${bill.isPaid ? 'text-[#00c875]' : 'text-[#fdab3d]'}`}>
                                                        {formatCurrency(bill.amount, getCurrencySymbol(bill.currency || 'ILS'))}
                                                    </span>
                                                    <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(bill)}
                                                            className="h-8 w-8 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(bill.id)}
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
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
        </div >
    )
}
