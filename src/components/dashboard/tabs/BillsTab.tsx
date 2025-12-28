import { useState, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { CreditCard, Loader2, Pencil, Trash2, Check, X } from 'lucide-react'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/Pagination'
import { addBill, getBills, updateBill, deleteBill, toggleBillPaid } from '@/lib/actions/bill'
import { formatCurrency } from '@/lib/utils'
import { useOptimisticToggle, useOptimisticDelete } from '@/hooks/useOptimisticMutation'

import { PaymentMethodSelector } from '../PaymentMethodSelector'

interface Bill {
    id: string
    name: string
    amount: number
    currency: string
    dueDate: Date
    isPaid: boolean
    paymentMethod?: string | null
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

    const fetcher = async () => {
        const result = await getBills(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch bills')
    }

    const { data, isLoading: loading, mutate } = useSWR<BillData>(['bills', month, year, budgetType], fetcher, {
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

    const bills = data?.bills || []
    const totalBillsILS = data?.totalILS || 0
    const totalPaidILS = data?.totalPaidILS || 0
    const totalUnpaidILS = data?.totalUnpaidILS || 0

    const [submitting, setSubmitting] = useState(false)
    const [newBill, setNewBill] = useState({ name: '', amount: '', currency: 'ILS', dueDay: '', paymentMethod: '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ name: '', amount: '', currency: 'ILS', dueDay: '', paymentMethod: '' })

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const totalPages = Math.ceil(bills.length / itemsPerPage)

    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const paginatedBills = bills.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    async function handleAdd() {
        if (!newBill.name || !newBill.amount || !newBill.dueDay) {
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל השדות',
                variant: 'destructive'
            })
            return
        }

        const dueDay = parseInt(newBill.dueDay)
        if (dueDay < 1 || dueDay > 31) {
            toast({
                title: 'שגיאה',
                description: 'יום תשלום חייב להיות בין 1 ל-31',
                variant: 'destructive'
            })
            return
        }

        setSubmitting(true)
        try {
            const result = await addBill(month, year, {
                name: newBill.name,
                amount: parseFloat(newBill.amount),
                currency: newBill.currency,
                dueDay: parseInt(newBill.dueDay),
                paymentMethod: newBill.paymentMethod || undefined
            }, budgetType)

            if (result.success) {
                toast({
                    title: 'הצלחה',
                    description: 'החשבון נוסף בהצלחה'
                })
                setNewBill({ name: '', amount: '', currency: 'ILS', dueDay: '', paymentMethod: '' })
                await mutate()
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            } else {
                toast({
                    title: 'שגיאה',
                    description: result.error || 'לא ניתן להוסיף חשבון',
                    variant: 'destructive'
                })
            }
        } catch (error) {
            console.error('Add bill failed:', error)
            toast({
                title: 'שגיאה',
                description: 'אירעה שגיאה בלתי צפויה',
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

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
        setEditingId(bill.id)
        setEditData({
            name: bill.name,
            amount: bill.amount.toString(),
            currency: bill.currency || 'ILS',
            dueDay: new Date(bill.dueDate).getDate().toString(),
            paymentMethod: bill.paymentMethod || ''
        })
    }

    function handleCancelEdit() {
        setEditingId(null)
        setEditData({ name: '', amount: '', currency: 'ILS', dueDay: '', paymentMethod: '' })
    }

    async function handleUpdate() {
        if (!editingId || !editData.name || !editData.amount || !editData.dueDay) {
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
        const result = await updateBill(editingId, {
            name: editData.name,
            amount: parseFloat(editData.amount),
            currency: editData.currency,
            dueDay,
            paymentMethod: editData.paymentMethod || undefined
        })

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'החשבון עודכן בהצלחה',
                duration: 1000
            })
            setEditingId(null)
            setEditData({ name: '', amount: '', currency: 'ILS', dueDay: '', paymentMethod: '' })
            await mutate()
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן חשבון',
                variant: 'destructive',
                duration: 1000
            })
        }
        setSubmitting(false)
    }

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
                <div className="monday-card p-4 border-l-4 border-l-blue-500 min-w-0">
                    <p className="text-xs text-gray-500 mb-1 truncate">סה"כ לתשלום (חודשי)</p>
                    <p className={`text-base md:text-xl font-bold text-[#323338] truncate ${loading ? 'animate-pulse' : ''}`}>
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
                <div className="glass-panel p-5 h-fit">
                    <div className="flex items-center gap-2 mb-4 min-w-0">
                        <CreditCard className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        <h3 className="text-base md:text-lg font-bold text-[#323338] truncate flex-1 min-w-0">הוספת חשבון חדש</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">שם החשבון</label>
                            <Input
                                value={newBill.name}
                                onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                                placeholder="לדוגמה: ארנונה"
                                className="h-10 text-right"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-1">
                                <label className="text-sm font-medium text-gray-700">מטבע</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white text-sm outline-none"
                                    value={newBill.currency}
                                    onChange={(e) => setNewBill({ ...newBill, currency: e.target.value })}
                                >
                                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                        <option key={code} value={code}>{code} ({symbol})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700">סכום</label>
                                <Input
                                    type="number"
                                    value={newBill.amount}
                                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="h-10 text-right"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">יום בחודש לתשלום</label>
                            <Input
                                type="number"
                                min="1"
                                max="31"
                                value={newBill.dueDay}
                                onChange={(e) => setNewBill({ ...newBill, dueDay: e.target.value })}
                                placeholder="1-31"
                                className="h-10 text-right"
                            />
                        </div>

                        <div className="w-full">
                            <PaymentMethodSelector
                                value={newBill.paymentMethod}
                                onChange={(val) => setNewBill({ ...newBill, paymentMethod: val })}
                                color="orange"
                            />
                        </div>

                        <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 h-10 shadow-sm mt-2 font-medium"
                            onClick={handleAdd}
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : "הוסף"}
                        </Button>
                    </div>
                </div>

                <div className="glass-panel p-5 block">
                    <h3 className="text-lg font-bold text-[#323338] mb-4">רשימת חשבונות</h3>
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
                                        className="group relative flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                                    >
                                        {editingId === bill.id ? (
                                            <div className="flex flex-col gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={editData.name}
                                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                        className="h-9 flex-1"
                                                        autoFocus
                                                    />
                                                    <select
                                                        className="p-2 border rounded-md h-9 bg-white text-sm w-20"
                                                        value={editData.currency}
                                                        onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                                                    >
                                                        {Object.keys(SUPPORTED_CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="number"
                                                        value={editData.amount}
                                                        onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                                        className="w-24 h-9"
                                                    />
                                                    <Input
                                                        type="number"
                                                        value={editData.dueDay}
                                                        onChange={(e) => setEditData({ ...editData, dueDay: e.target.value })}
                                                        className="w-16 h-9"
                                                    />
                                                    <div className="flex-1">
                                                        <PaymentMethodSelector
                                                            value={editData.paymentMethod}
                                                            onChange={(val) => setEditData({ ...editData, paymentMethod: val })}
                                                            color="orange"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex justify-end gap-2 mt-2">
                                                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>ביטול</Button>
                                                    <Button size="sm" onClick={handleUpdate} className="bg-orange-500 hover:bg-orange-600 text-white">שמור שינויים</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => handleTogglePaid(bill.id, bill.isPaid)}
                                                        className={`
                                                            w-16 h-7 rounded-full text-xs font-medium transition-all duration-200 flex items-center justify-center
                                                            ${bill.isPaid
                                                                ? 'bg-[#00c875] text-white hover:bg-[#00b065] shadow-sm'
                                                                : 'bg-[#ffcb00] text-[#323338] hover:bg-[#eabb00]'
                                                            }
                                                        `}
                                                    >
                                                        {bill.isPaid ? 'שולם' : 'ממתין'}
                                                    </button>

                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-base transition-colors ${bill.isPaid ? 'text-gray-400 line-through' : 'text-[#323338]'}`}>
                                                            {bill.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 text-xs text-[#676879]">
                                                            <span>
                                                                תאריך תשלום: {new Date(bill.dueDate).getDate()} בחודש
                                                            </span>
                                                            {bill.paymentMethod && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{bill.paymentMethod}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className={`text-lg font-bold font-mono ${bill.isPaid ? 'text-[#00c875]' : 'text-[#fdab3d]'}`}>
                                                        {formatCurrency(bill.amount, getCurrencySymbol(bill.currency || 'ILS'))}
                                                    </span>
                                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(bill)}
                                                            className="h-8 w-8 text-blue-500 hover:bg-blue-50 rounded-full"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(bill.id)}
                                                            className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"
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
