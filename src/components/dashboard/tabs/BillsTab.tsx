'use client'

import useSWR from 'swr'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Check, Loader2, Pencil, X } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getBills, addBill, toggleBillPaid, deleteBill, updateBill } from '@/lib/actions/bill'
import { useToast } from '@/hooks/use-toast'
import { Pagination } from '@/components/ui/Pagination'

interface Bill {
    id: string
    name: string
    amount: number
    dueDate: Date
    isPaid: boolean
}

export function BillsTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()
    const fetcher = async () => {
        const result = await getBills(month, year)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch bills')
    }

    const { data: bills = [], isLoading: loading, mutate } = useSWR(['bills', month, year], fetcher, {
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

    const [submitting, setSubmitting] = useState(false)
    const [newBill, setNewBill] = useState({ name: '', amount: '', dueDay: '' })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ name: '', amount: '', dueDay: '' })

    const totalBills = bills.reduce((sum: number, bill: Bill) => sum + bill.amount, 0)
    const paidBills = bills.filter((b: Bill) => b.isPaid).reduce((sum: number, bill: Bill) => sum + bill.amount, 0)
    const unpaidBills = totalBills - paidBills

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
                dueDay: parseInt(newBill.dueDay)
            })

            if (result.success) {
                toast({
                    title: 'הצלחה',
                    description: 'החשבון נוסף בהצלחה'
                })
                setNewBill({ name: '', amount: '', dueDay: '' })
                await mutate()
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

    async function handleTogglePaid(id: string, currentStatus: boolean) {
        const result = await toggleBillPaid(id, !currentStatus)

        if (result.success) {
            await mutate()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן סטטוס',
                variant: 'destructive',
                duration: 1000
            })
        }
    }

    function handleEdit(bill: Bill) {
        setEditingId(bill.id)
        setEditData({
            name: bill.name,
            amount: bill.amount.toString(),
            dueDay: new Date(bill.dueDate).getDate().toString()
        })
    }

    function handleCancelEdit() {
        setEditingId(null)
        setEditData({ name: '', amount: '', dueDay: '' })
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
            dueDay
        })

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'החשבון עודכן בהצלחה',
                duration: 1000
            })
            setEditingId(null)
            setEditData({ name: '', amount: '', dueDay: '' })
            await mutate()
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

    async function handleDelete(id: string) {
        const result = await deleteBill(id)

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'החשבון נמחק בהצלחה'
            })
            await mutate()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן למחוק חשבון',
                variant: 'destructive'
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-rainbow-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-4 p-1" dir="rtl">
            <div className="grid grid-cols-3 gap-3">
                <div className="monday-card p-4 border-l-4 border-l-blue-500">
                    <p className="text-xs text-gray-500 mb-1">סה"כ לתשלום</p>
                    <p className="text-xl font-bold text-[#323338]">{formatCurrency(totalBills, currency)}</p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-green-500">
                    <p className="text-xs text-gray-500 mb-1">שולם</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(paidBills, currency)}</p>
                </div>
                <div className="monday-card p-4 border-l-4 border-l-red-500">
                    <p className="text-xs text-gray-500 mb-1">נותר לתשלום</p>
                    <p className="text-xl font-bold text-red-600">{formatCurrency(unpaidBills, currency)}</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="glass-panel p-5 h-fit">
                    <h3 className="text-lg font-bold text-[#323338] mb-4">הוספת חשבון חדש</h3>
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">סכום</label>
                            <Input
                                type="number"
                                value={newBill.amount}
                                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                                placeholder="0.00"
                                className="h-10 text-right"
                            />
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
                        <Button
                            className="w-full bg-[#0073ea] hover:bg-[#0060b9] h-10 shadow-sm mt-2"
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
                        {bills.length === 0 ? (
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
                                            <div className="flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                                                <Input
                                                    value={editData.name}
                                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                    className="h-9 flex-1"
                                                    autoFocus
                                                />
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
                                                <div className="flex gap-1">
                                                    <Button size="icon" variant="ghost" onClick={handleUpdate} className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700 rounded-full">
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full">
                                                        <X className="h-4 w-4" />
                                                    </Button>
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
                                                        <span className="text-xs text-[#676879]">
                                                            תאריך תשלום: {new Date(bill.dueDate).getDate()} בחודש
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className={`text-lg font-bold font-mono ${bill.isPaid ? 'text-[#00c875]' : 'text-[#fdab3d]'}`}>
                                                        {formatCurrency(bill.amount, currency)}
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
