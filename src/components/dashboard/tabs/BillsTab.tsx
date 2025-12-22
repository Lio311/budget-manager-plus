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
    dueDay: number
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
                description: 'נא למלא את כל השדות הנדרשים',
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
        const result = await addBill(month, year, {
            name: newBill.name,
            amount: parseFloat(newBill.amount),
            dueDay
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
        setSubmitting(false)
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
            dueDay: bill.dueDay.toString()
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
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-l from-yellow-50 to-white border-yellow-200">
                    <CardHeader>
                        <CardTitle className="text-yellow-700">סך חשבונות</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">
                            {formatCurrency(totalBills, currency)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-l from-green-50 to-white border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-700">שולם</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {formatCurrency(paidBills, currency)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-l from-red-50 to-white border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-700">ממתין לתשלום</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">
                            {formatCurrency(unpaidBills, currency)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add New Bill */}
            <Card>
                <CardHeader>
                    <CardTitle>הוסף חשבון קבוע</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Input
                            placeholder="שם החשבון (חשמל, ארנונה...)"
                            value={newBill.name}
                            onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                            disabled={submitting}
                        />
                        <Input
                            type="number"
                            placeholder="סכום"
                            value={newBill.amount}
                            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                            disabled={submitting}
                        />
                        <Input
                            type="number"
                            placeholder="יום תשלום (1-31)"
                            min="1"
                            max="31"
                            value={newBill.dueDay}
                            onChange={(e) => setNewBill({ ...newBill, dueDay: e.target.value })}
                            disabled={submitting}
                        />
                        <Button
                            onClick={handleAdd}
                            className="gap-2"
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
                </CardContent>
            </Card>

            {/* Bills List */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת חשבונות קבועים</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {bills.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">אין חשבונות רשומים</p>
                        ) : (
                            <div className="space-y-2">
                                {bills.map((bill) => (
                                    <div
                                        key={bill.id}
                                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${bill.isPaid ? 'bg-green-50 border-green-200' : 'hover:bg-accent'
                                            }`}
                                    >
                                        {editingId === bill.id ? (
                                            <>
                                                <div className="flex-1 grid gap-4 md:grid-cols-3">
                                                    <Input
                                                        placeholder="שם החשבון"
                                                        value={editData.name}
                                                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                                        disabled={submitting}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="סכום"
                                                        value={editData.amount}
                                                        onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                                                        disabled={submitting}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="יום תשלום (1-31)"
                                                        min="1"
                                                        max="31"
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
                                                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={handleCancelEdit}
                                                        disabled={submitting}
                                                        className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-4 flex-1">
                                                    <button
                                                        onClick={() => handleTogglePaid(bill.id, bill.isPaid)}
                                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${bill.isPaid
                                                            ? 'bg-green-500 border-green-500'
                                                            : 'border-gray-300 hover:border-green-500'
                                                            }`}
                                                    >
                                                        {bill.isPaid && <Check className="h-4 w-4 text-white" />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <p className={`font-medium ${bill.isPaid ? 'line-through text-muted-foreground' : ''}`}>
                                                            {bill.name}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            תאריך תשלום: {bill.dueDay} בחודש
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-bold ${bill.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {formatCurrency(bill.amount, currency)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(bill)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(bill.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
