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

    const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0)
    const paidBills = bills.filter(b => b.isPaid).reduce((sum, bill) => sum + bill.amount, 0)
    const unpaidBills = totalBills - paidBills

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
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="monday-card border-l-4 border-l-[#fdab3d] p-6 flex flex-col justify-center gap-2">
                        <h3 className="text-sm font-medium text-gray-500">סך חשבונות</h3>
                        <div className="text-2xl font-bold text-[#fdab3d]">
                            {formatCurrency(totalBills, currency)}
                        </div>
                    </div>
                    <div className="monday-card border-l-4 border-l-[#00c875] p-6 flex flex-col justify-center gap-2">
                        <h3 className="text-sm font-medium text-gray-500">שולם</h3>
                        <div className="text-2xl font-bold text-[#00c875]">
                            {formatCurrency(paidBills, currency)}
                        </div>
                    </div>
                    <div className="monday-card border-l-4 border-l-[#e2445c] p-6 flex flex-col justify-center gap-2">
                        <h3 className="text-sm font-medium text-gray-500">ממתין לתשלום</h3>
                        <div className="text-2xl font-bold text-[#e2445c]">
                            {formatCurrency(unpaidBills, currency)}
                        </div>
                    </div>
                </div>

                {/* Add New Bill */}
                <div className="glass-panel p-6">
                    <div className="mb-6 flex items-center gap-2">
                        <div className="bg-[#fdab3d] w-2 h-6 rounded-full"></div>
                        <h3 className="text-lg font-bold text-[#323338]">הוסף חשבון קבוע</h3>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex-[2] min-w-[200px]">
                            <label className="text-xs font-medium mb-1.5 block text-[#676879]">שם החשבון</label>
                            <Input
                                placeholder="חשמל, ארנונה..."
                                className="h-11 border-gray-200 focus:ring-[#fdab3d]/20 focus:border-[#fdab3d]"
                                value={newBill.name}
                                onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                                disabled={submitting}
                            />
                        </div>
                        <div className="flex-1 min-w-[120px]">
                            <label className="text-xs font-medium mb-1.5 block text-[#676879]">סכום</label>
                            <Input
                                type="number"
                                placeholder="סכום"
                                className="h-11 border-gray-200 focus:ring-[#fdab3d]/20 focus:border-[#fdab3d]"
                                value={newBill.amount}
                                onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                                disabled={submitting}
                            />
                        </div>
                        <div className="flex-1 min-w-[100px]">
                            <label className="text-xs font-medium mb-1.5 block text-[#676879]">יום חיוב</label>
                            <Input
                                type="number"
                                placeholder="1-31"
                                min="1"
                                max="31"
                                className="h-11 border-gray-200 focus:ring-[#fdab3d]/20 focus:border-[#fdab3d]"
                                value={newBill.dueDay}
                                onChange={(e) => setNewBill({ ...newBill, dueDay: e.target.value })}
                                disabled={submitting}
                            />
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="gap-2 h-11 px-8 rounded-lg bg-[#fdab3d] hover:bg-[#e99b35] text-white font-medium shadow-sm transition-all hover:shadow-md"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            הוסף
                        </Button>
                    </div>
                </div>

                {/* Bills List */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-2">
                        <h3 className="text-lg font-bold text-[#323338]">רשימת חשבונות קבועים</h3>
                    </div>

                    {bills.length === 0 ? (
                        <div className="monday-card p-8 text-center text-[#676879]">
                            אין חשבונות רשומים
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {bills.map((bill) => (
                                <div
                                    key={bill.id}
                                    className="monday-card flex items-center justify-between p-4 group"
                                >
                                    {editingId === bill.id ? (
                                        <>
                                            <div className="flex flex-nowrap gap-3 items-center flex-1 w-full overflow-x-auto pb-1">
                                                <Input
                                                    placeholder="שם החשבון"
                                                    className="flex-1 min-w-[150px]"
                                                    value={editData.name}
                                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                    disabled={submitting}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="סכום"
                                                    className="w-32"
                                                    value={editData.amount}
                                                    onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                                    disabled={submitting}
                                                />
                                                <Input
                                                    type="number"
                                                    placeholder="יום חיוב"
                                                    min="1"
                                                    max="31"
                                                    className="w-20"
                                                    value={editData.dueDay}
                                                    onChange={(e) => setEditData({ ...editData, dueDay: e.target.value })}
                                                    disabled={submitting}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 mr-4">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleUpdate}
                                                    disabled={submitting}
                                                    className="text-[#00c875] hover:bg-green-50"
                                                >
                                                    <Check className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={handleCancelEdit}
                                                    disabled={submitting}
                                                    className="text-gray-400 hover:text-gray-600"
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 flex items-center gap-6">
                                                <button
                                                    onClick={() => handleTogglePaid(bill.id, bill.isPaid)}
                                                    className={`min-w-[100px] monday-pill transition-all hover:opacity-90 ${bill.isPaid
                                                        ? 'bg-[#00c875]'
                                                        : 'bg-[#fdab3d]'
                                                        }`}
                                                >
                                                    {bill.isPaid ? 'שולם' : 'ממתין'}
                                                </button>

                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-base ${bill.isPaid ? 'text-gray-400 line-through' : 'text-[#323338]'}`}>
                                                        {bill.name}
                                                    </span>
                                                    <span className="text-xs text-[#676879]">
                                                        תאריך תשלום: {new Date(bill.dueDate).getDate()} בחודש
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className={`text-xl font-bold ${bill.isPaid ? 'text-[#00c875]' : 'text-[#fdab3d]'}`}>
                                                    {formatCurrency(bill.amount, currency)}
                                                </span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(bill as unknown as Bill)}
                                                        className="h-8 w-8 text-blue-500 hover:bg-blue-50"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(bill.id)}
                                                        className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
