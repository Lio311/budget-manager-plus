'use client'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Check, Loader2, Pencil, X, TrendingDown, Wallet } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getDebts, addDebt, deleteDebt, toggleDebtPaid, updateDebt } from '@/lib/actions/debts'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination } from '@/components/ui/Pagination'
import { DatePicker } from '@/components/ui/date-picker'
import { DEBT_TYPES, DEBT_TYPE_LABELS, CREDITOR_LABELS } from '@/lib/constants/debt-types'

interface Debt {
    id: string
    creditor: string
    debtType: string
    totalAmount: number
    monthlyPayment: number
    dueDay: number
    isPaid: boolean
}

export function DebtsTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()
    const fetcher = async () => {
        const result = await getDebts(month, year)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch debts')
    }

    const { data: debts = [], isLoading: loading, mutate } = useSWR(['debts', month, year], fetcher, {
        revalidateOnFocus: false,
        onError: (err) => {
            toast({
                title: 'שגיאה',
                description: 'לא ניתן לטעון חובות',
                variant: 'destructive',
                duration: 1000
            })
        }
    })

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
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
    const [newDebt, setNewDebt] = useState<{
        creditor: string
        debtType: string
        totalAmount: string
        dueDay: string
        isRecurring: boolean
        numberOfInstallments: string
    }>({
        creditor: '',
        debtType: DEBT_TYPES.OWED_BY_ME,
        totalAmount: '',
        dueDay: '',
        isRecurring: false,
        numberOfInstallments: ''
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<{ creditor: string; debtType: string; totalAmount: string; monthlyPayment: string; dueDay: string }>({
        creditor: '',
        debtType: DEBT_TYPES.OWED_BY_ME,
        totalAmount: '',
        monthlyPayment: '',
        dueDay: ''
    })

    // Calculate debts split by type
    const debtsOwedByMe = debts.filter((d: Debt) => d.debtType === DEBT_TYPES.OWED_BY_ME)
    const debtsOwedToMe = debts.filter((d: Debt) => d.debtType === DEBT_TYPES.OWED_TO_ME)

    const totalDebtsOwedByMe = debtsOwedByMe.reduce((sum: number, debt: Debt) => sum + debt.totalAmount, 0)
    const totalDebtsOwedToMe = debtsOwedToMe.reduce((sum: number, debt: Debt) => sum + debt.totalAmount, 0)
    const netDebt = totalDebtsOwedByMe - totalDebtsOwedToMe

    const monthlyPaymentsOwedByMe = debtsOwedByMe.reduce((sum: number, debt: Debt) => sum + debt.monthlyPayment, 0)
    const monthlyPaymentsOwedToMe = debtsOwedToMe.reduce((sum: number, debt: Debt) => sum + debt.monthlyPayment, 0)
    const netMonthlyPayment = monthlyPaymentsOwedByMe - monthlyPaymentsOwedToMe

    const paidThisMonth = debts.filter((d: Debt) => d.isPaid).reduce((sum: number, debt: Debt) => {
        return sum + (debt.debtType === DEBT_TYPES.OWED_BY_ME ? debt.monthlyPayment : -debt.monthlyPayment)
    }, 0)
    const unpaidThisMonth = netMonthlyPayment - paidThisMonth

    const handleAdd = async () => {
        // Validate required fields
        if (!newDebt.creditor || !newDebt.creditor.trim()) {
            toast({ title: 'שגיאה', description: 'יש למלא שם נושה', variant: 'destructive' })
            return
        }

        if (!newDebt.totalAmount || parseFloat(newDebt.totalAmount) <= 0) {
            toast({ title: 'שגיאה', description: 'יש למלא סכום כולל תקין', variant: 'destructive' })
            return
        }

        if (!newDebt.dueDay || parseInt(newDebt.dueDay) < 1 || parseInt(newDebt.dueDay) > 31) {
            toast({ title: 'שגיאה', description: 'יש למלא יום תשלום בין 1-31', variant: 'destructive' })
            return
        }

        if (newDebt.isRecurring) {
            if (!newDebt.numberOfInstallments || parseInt(newDebt.numberOfInstallments) < 1) {
                toast({ title: 'שגיאה', description: 'מספר תשלומים חייב להיות לפחות 1', variant: 'destructive' })
                return
            }
        }

        setSubmitting(true)
        try {
            const totalAmount = parseFloat(newDebt.totalAmount)
            const monthlyPayment = newDebt.isRecurring
                ? totalAmount / parseInt(newDebt.numberOfInstallments)
                : totalAmount

            const result = await addDebt(month, year, {
                creditor: newDebt.creditor.trim(),
                debtType: newDebt.debtType,
                totalAmount,
                monthlyPayment,
                dueDay: parseInt(newDebt.dueDay),
                isRecurring: newDebt.isRecurring,
                totalDebtAmount: newDebt.isRecurring ? totalAmount : undefined,
                numberOfInstallments: newDebt.isRecurring ? parseInt(newDebt.numberOfInstallments) : undefined
            })

            if (result.success) {
                setNewDebt({
                    creditor: '',
                    debtType: DEBT_TYPES.OWED_BY_ME,
                    totalAmount: '',
                    dueDay: '',
                    isRecurring: false,
                    numberOfInstallments: ''
                })
                await mutate() // Refresh data
                toast({
                    title: 'הצלחה',
                    description: newDebt.isRecurring ? `נוצרו ${newDebt.numberOfInstallments} תשלומים בהצלחה` : 'החוב נוסף בהצלחה'
                })
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף חוב', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add debt failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בלתי צפויה', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteDebt(id)
        if (result.success) {
            await mutate() // Refresh data
            toast({ title: 'הצלחה', description: 'החוב נמחק בהצלחה' })
        }
    }

    const togglePaid = async (id: string, currentStatus: boolean) => {
        // Optimistic update could be done here, but simple revalidation is safer for now
        const result = await toggleDebtPaid(id, !currentStatus)
        if (result.success) {
            await mutate() // Refresh data
        }
    }

    function handleEdit(debt: Debt) {
        setEditingId(debt.id)
        setEditData({
            creditor: debt.creditor,
            debtType: debt.debtType,
            totalAmount: debt.totalAmount.toString(),
            monthlyPayment: debt.monthlyPayment.toString(),
            dueDay: debt.dueDay.toString()
        })
    }

    function handleCancelEdit() {
        setEditingId(null)
        setEditData({ creditor: '', debtType: DEBT_TYPES.OWED_BY_ME, totalAmount: '', monthlyPayment: '', dueDay: '' })
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
            monthlyPayment: parseFloat(editData.monthlyPayment),
            dueDay
        })

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'החוב עודכן בהצלחה',
                duration: 1000
            })
            setEditingId(null)
            setEditData({ creditor: '', debtType: DEBT_TYPES.OWED_BY_ME, totalAmount: '', monthlyPayment: '', dueDay: '' })
            await mutate()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן חוב',
                variant: 'destructive',
                duration: 1000
            })
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-4 p-1" dir="rtl">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-rainbow-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
                        <div className="monday-card p-4 border-l-4 border-l-[#00c875]">
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">יתרה כוללת (נטו)</h3>
                            <div className={`text-2xl font-bold ${netDebt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {formatCurrency(Math.abs(netDebt), currency)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {netDebt > 0 ? 'חובות שלי' : 'חייבים לי'}
                            </p>
                        </div>
                        <div className="monday-card p-4 border-l-4 border-l-[#0073ea]">
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">תשלום חודשי (נטו)</h3>
                            <div className="text-2xl font-bold text-slate-900">
                                {formatCurrency(netMonthlyPayment, currency)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">התחייבות חודשית</p>
                        </div>
                        <div className="monday-card p-4 border-l-4 border-l-red-500">
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">נותר לתשלום החודש</h3>
                            <div className="text-2xl font-bold text-slate-900">
                                {formatCurrency(unpaidThisMonth, currency)}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(paidThisMonth, currency)} שולם</p>
                        </div>
                    </div>

                    {/* Split View */}
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Add Debt Form */}
                        <div className="glass-panel p-5 h-fit">
                            <div className="flex items-center gap-2 mb-6">
                                <Wallet className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-[#323338]">הוספת חוב</h3>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                        <label className="text-xs text-[#676879]">שם הנושה / חייב</label>
                                        <Input
                                            placeholder="שם..."
                                            className="h-10 border-gray-200 focus:ring-purple-500/20 focus:border-purple-500"
                                            value={newDebt.creditor}
                                            onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="space-y-1.5 ml-2">
                                        <label className="text-xs text-[#676879]">סכום כולל</label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            className="h-10 border-gray-200 focus:ring-purple-500/20 focus:border-purple-500"
                                            value={newDebt.totalAmount}
                                            onChange={(e) => setNewDebt({ ...newDebt, totalAmount: e.target.value })}
                                            disabled={submitting}
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs text-[#676879]">יום חיוב</label>
                                        <Input
                                            type="number"
                                            placeholder="1"
                                            min="1"
                                            max="31"
                                            className="h-10 border-gray-200 focus:ring-purple-500/20 focus:border-purple-500"
                                            value={newDebt.dueDay}
                                            onChange={(e) => setNewDebt({ ...newDebt, dueDay: e.target.value })}
                                            disabled={submitting}
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4"> {/* Container for Checkbox and Button */}
                                    <div className="flex items-center gap-2 h-10 bg-gray-50 px-3 rounded-lg border border-gray-100 w-full sm:w-auto self-start">
                                        <Checkbox
                                            id="recurring-debt"
                                            checked={newDebt.isRecurring}
                                            onCheckedChange={(checked) => setNewDebt({ ...newDebt, isRecurring: checked as boolean })}
                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <label htmlFor="recurring-debt" className="text-sm font-medium cursor-pointer select-none text-[#323338]">
                                            תשלומים
                                        </label>
                                    </div>
                                    <Button
                                        onClick={handleAdd}
                                        className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all hover:shadow-md"
                                        disabled={submitting}
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : 'הוסף'}
                                    </Button>
                                </div>

                                {newDebt.isRecurring && (
                                    <div className="p-4 pt-0 border-t border-gray-100 mt-2 grid gap-6 grid-cols-1 sm:grid-cols-2 animate-in slide-in-from-top-2 duration-200">
                                        <div className="space-y-1.5 mt-2">
                                            <label className="text-xs text-[#676879]">מספר תשלומים</label>
                                            <Input
                                                type="number"
                                                placeholder="12"
                                                min="1"
                                                className="h-10 w-24 border-gray-200 focus:ring-purple-500/20 focus:border-purple-500"
                                                value={newDebt.numberOfInstallments}
                                                onChange={(e) => setNewDebt({ ...newDebt, numberOfInstallments: e.target.value })}
                                                disabled={submitting}
                                                dir="ltr"
                                            />
                                        </div>
                                        {newDebt.totalAmount && newDebt.numberOfInstallments && parseInt(newDebt.numberOfInstallments) > 0 && (
                                            <div className="space-y-1.5 mt-2">
                                                <label className="text-xs text-[#676879]">תשלום חודשי משוער</label>
                                                <div className="h-10 px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-sm flex items-center w-full font-medium text-[#323338]">
                                                    {formatCurrency(
                                                        parseFloat(newDebt.totalAmount) / parseInt(newDebt.numberOfInstallments),
                                                        currency
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Debts List */}
                        <div className="glass-panel p-5 block">
                            <div className="flex items-center gap-2 mb-4 px-2">
                                <h3 className="text-lg font-bold text-[#323338]">רשימת חובות</h3>
                            </div>

                            <div className="space-y-3">
                                {debts.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8 italic">אין חובות רשומים</p>
                                ) : (
                                    <>
                                        {paginatedDebts.map((debt) => (
                                            <div
                                                key={debt.id}
                                                className={`group relative flex flex-col sm:flex-row items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${debt.isPaid ? 'bg-green-50/50 border-green-200' : ''}`}
                                            >
                                                {editingId === debt.id ? (
                                                    <div className="flex flex-col gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="flex flex-wrap gap-2 w-full">
                                                            <Input
                                                                placeholder="שם הנושה"
                                                                className="min-w-[120px] flex-1"
                                                                value={editData.creditor}
                                                                onChange={(e) => setEditData({ ...editData, creditor: e.target.value })}
                                                                disabled={submitting}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="סכום כולל"
                                                                className="w-24 sm:w-32"
                                                                value={editData.totalAmount}
                                                                onChange={(e) => setEditData({ ...editData, totalAmount: e.target.value })}
                                                                disabled={submitting}
                                                            />
                                                            <Input
                                                                type="number"
                                                                placeholder="תשלום חודשי"
                                                                className="w-24 sm:w-32"
                                                                value={editData.monthlyPayment}
                                                                onChange={(e) => setEditData({ ...editData, monthlyPayment: e.target.value })}
                                                                disabled={submitting}
                                                            />
                                                        </div>
                                                        <div className="flex gap-2 justify-between items-center">
                                                            <div className="flex gap-2">
                                                                <Input
                                                                    type="number"
                                                                    placeholder="יום חיוב"
                                                                    min="1"
                                                                    max="31"
                                                                    className="w-16 sm:w-20"
                                                                    value={editData.dueDay}
                                                                    onChange={(e) => setEditData({ ...editData, dueDay: e.target.value })}
                                                                    disabled={submitting}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Button size="sm" onClick={handleUpdate} className="bg-green-600 hover:bg-green-700 text-white">
                                                                    <Check className="h-4 w-4 ml-1" /> שמור
                                                                </Button>
                                                                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                                                                    <X className="h-4 w-4 ml-1" /> ביטול
                                                                </Button>
                                                            </div>
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
                                                                    <span className="truncate text-slate-500">סה"כ: {formatCurrency(debt.totalAmount, currency)}</span>
                                                                    <span className="text-slate-500">יום חיוב: {debt.dueDay}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100 pl-1">
                                                            <div className="text-right sm:text-left">
                                                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">תשלום החודש</p>
                                                                <span className={`text-lg font-black ${debt.isPaid ? 'text-green-600' : 'text-purple-600'}`}>
                                                                    {formatCurrency(debt.monthlyPayment, currency)}
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
                </>
            )}
        </div >
    )
}
