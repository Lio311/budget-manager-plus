'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Check, Loader2, Pencil, X } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getDebts, addDebt, deleteDebt, toggleDebtPaid, updateDebt } from '@/lib/actions/debts'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'

interface Debt {
    id: string
    creditor: string
    totalAmount: number
    monthlyPayment: number
    dueDay: number
    isPaid: boolean
}

export function DebtsTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()
    const [debts, setDebts] = useState<Debt[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [newDebt, setNewDebt] = useState({
        creditor: '',
        totalAmount: '',
        dueDay: '',
        isRecurring: false,
        numberOfInstallments: ''
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ creditor: '', totalAmount: '', monthlyPayment: '', dueDay: '' })

    const totalDebts = debts.reduce((sum, debt) => sum + debt.totalAmount, 0)
    const monthlyPayments = debts.reduce((sum, debt) => sum + debt.monthlyPayment, 0)
    const paidThisMonth = debts.filter(d => d.isPaid).reduce((sum, debt) => sum + debt.monthlyPayment, 0)
    const unpaidThisMonth = monthlyPayments - paidThisMonth

    useEffect(() => {
        loadDebts()
    }, [month, year])

    async function loadDebts() {
        setLoading(true)
        const result = await getDebts(month, year)

        if (result.success && result.data) {
            setDebts(result.data)
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לטעון חובות',
                variant: 'destructive',
                duration: 1000
            })
        }
        setLoading(false)
    }

    const handleAdd = async () => {
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
        const totalAmount = parseFloat(newDebt.totalAmount)
        const monthlyPayment = newDebt.isRecurring
            ? totalAmount / parseInt(newDebt.numberOfInstallments)
            : totalAmount

        const result = await addDebt(month, year, {
            creditor: newDebt.creditor.trim(),
            totalAmount,
            monthlyPayment,
            dueDay: parseInt(newDebt.dueDay),
            isRecurring: newDebt.isRecurring,
            totalDebtAmount: newDebt.isRecurring ? totalAmount : undefined,
            numberOfInstallments: newDebt.isRecurring ? parseInt(newDebt.numberOfInstallments) : undefined
        })

        if (result.success) {
            setNewDebt({ creditor: '', totalAmount: '', dueDay: '', isRecurring: false, numberOfInstallments: '' })
            await loadDebts()
            toast({
                title: 'הצלחה',
                description: newDebt.isRecurring ? `נוצרו ${newDebt.numberOfInstallments} תשלומים בהצלחה` : 'החוב נוסף בהצלחה'
            })
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף חוב', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        const result = await deleteDebt(id)
        if (result.success) {
            await loadDebts()
            toast({ title: 'הצלחה', description: 'החוב נמחק בהצלחה' })
        }
    }

    const togglePaid = async (id: string, currentStatus: boolean) => {
        const result = await toggleDebtPaid(id, !currentStatus)
        if (result.success) {
            await loadDebts()
        }
    }

    function handleEdit(debt: Debt) {
        setEditingId(debt.id)
        setEditData({
            creditor: debt.creditor,
            totalAmount: debt.totalAmount.toString(),
            monthlyPayment: debt.monthlyPayment.toString(),
            dueDay: debt.dueDay.toString()
        })
    }

    function handleCancelEdit() {
        setEditingId(null)
        setEditData({ creditor: '', totalAmount: '', monthlyPayment: '', dueDay: '' })
    }

    async function handleUpdate() {
        if (!editingId || !editData.creditor || !editData.totalAmount || !editData.monthlyPayment || !editData.dueDay) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות', variant: 'destructive', duration: 1000 })
            return
        }

        const dueDay = parseInt(editData.dueDay)
        if (dueDay < 1 || dueDay > 31) {
            toast({ title: 'שגיאה', description: 'יום תשלום חייב להיות בין 1 ל-31', variant: 'destructive', duration: 1000 })
            return
        }

        setSubmitting(true)
        const result = await updateDebt(editingId, {
            creditor: editData.creditor,
            totalAmount: parseFloat(editData.totalAmount),
            monthlyPayment: parseFloat(editData.monthlyPayment),
            dueDay
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'החוב עודכן בהצלחה', duration: 1000 })
            setEditingId(null)
            setEditData({ creditor: '', totalAmount: '', monthlyPayment: '', dueDay: '' })
            await loadDebts()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן חוב', variant: 'destructive', duration: 1000 })
        }
        setSubmitting(false)
    }

    return <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-10">
        {loading ? (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-l from-purple-50 to-white border-purple-200 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-purple-700 text-xs sm:text-sm">סך חובות</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-xl sm:text-2xl font-bold text-purple-600 break-all">
                                {formatCurrency(totalDebts, currency)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-l from-orange-50 to-white border-orange-200 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-orange-700 text-xs sm:text-sm">תשלום חודשי</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-xl sm:text-2xl font-bold text-orange-600 break-all">
                                {formatCurrency(monthlyPayments, currency)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-l from-green-50 to-white border-green-200 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-green-700 text-xs sm:text-sm">שולם החודש</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-xl sm:text-2xl font-bold text-green-600 break-all">
                                {formatCurrency(paidThisMonth, currency)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-l from-red-50 to-white border-red-200 shadow-sm">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-red-700 text-xs sm:text-sm">ממתין לתשלום</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="text-xl sm:text-2xl font-bold text-red-600 break-all">
                                {formatCurrency(unpaidThisMonth, currency)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mx-0 sm:mx-auto">
                    <CardHeader>
                        <CardTitle className="text-lg">הוסף חוב חדש</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">נושה (למי חייב)</label>
                                    <Input
                                        placeholder="שם הנושה..."
                                        value={newDebt.creditor}
                                        onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                                        disabled={submitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">סכום כולל</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={newDebt.totalAmount}
                                        onChange={(e) => setNewDebt({ ...newDebt, totalAmount: e.target.value })}
                                        disabled={submitting}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">יום תשלום</label>
                                    <Input
                                        type="number"
                                        placeholder="יום (1-31)"
                                        min="1"
                                        max="31"
                                        value={newDebt.dueDay}
                                        onChange={(e) => setNewDebt({ ...newDebt, dueDay: e.target.value })}
                                        disabled={submitting}
                                    />
                                </div>
                                <Button onClick={handleAdd} className="w-full gap-2" disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    הוסף
                                </Button>
                            </div>

                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="recurring-debt"
                                        checked={newDebt.isRecurring}
                                        onCheckedChange={(checked) => setNewDebt({ ...newDebt, isRecurring: checked as boolean })}
                                    />
                                    <label htmlFor="recurring-debt" className="text-sm font-medium cursor-pointer">
                                        חוב בתשלומים
                                    </label>
                                </div>

                                {newDebt.isRecurring && (
                                    <div className="flex gap-4 flex-1">
                                        <div className="space-y-2 flex-1">
                                            <label className="text-sm font-medium">מספר תשלומים</label>
                                            <Input
                                                type="number"
                                                placeholder="12"
                                                min="1"
                                                value={newDebt.numberOfInstallments}
                                                onChange={(e) => setNewDebt({ ...newDebt, numberOfInstallments: e.target.value })}
                                                disabled={submitting}
                                            />
                                        </div>
                                        {newDebt.totalAmount && newDebt.numberOfInstallments && parseInt(newDebt.numberOfInstallments) > 0 && (
                                            <div className="space-y-2 flex-1">
                                                <label className="text-sm font-medium">תשלום חודשי</label>
                                                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
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
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">רשימת חובות</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 sm:px-6">
                        <div className="space-y-3">
                            {debts.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8 italic">אין חובות רשומים</p>
                            ) : (
                                debts.map((debt) => (
                                    <div
                                        key={debt.id}
                                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4 transition-all ${debt.isPaid ? 'bg-green-50/50 border-green-200' : 'bg-white hover:bg-slate-50'
                                            }`}
                                    >
                                        {editingId === debt.id ? (
                                            <>
                                                <div className="flex-1 grid gap-4 md:grid-cols-4 w-full">
                                                    <Input
                                                        placeholder="שם הנושה"
                                                        value={editData.creditor}
                                                        onChange={(e) => setEditData({ ...editData, creditor: e.target.value })}
                                                        disabled={submitting}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="סכום כולל"
                                                        value={editData.totalAmount}
                                                        onChange={(e) => setEditData({ ...editData, totalAmount: e.target.value })}
                                                        disabled={submitting}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="תשלום חודשי"
                                                        value={editData.monthlyPayment}
                                                        onChange={(e) => setEditData({ ...editData, monthlyPayment: e.target.value })}
                                                        disabled={submitting}
                                                    />
                                                    <Input
                                                        type="number"
                                                        placeholder="יום (1-31)"
                                                        min="1"
                                                        max="31"
                                                        value={editData.dueDay}
                                                        onChange={(e) => setEditData({ ...editData, dueDay: e.target.value })}
                                                        disabled={submitting}
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
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
                                                <div className="flex items-start gap-3 w-full sm:w-auto">
                                                    <button
                                                        onClick={() => togglePaid(debt.id, debt.isPaid)}
                                                        className={`mt-1 w-6 h-6 shrink-0 rounded border-2 flex items-center justify-center transition-colors ${debt.isPaid ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-500'
                                                            }`}
                                                    >
                                                        {debt.isPaid && <Check className="h-4 w-4 text-white" />}
                                                    </button>

                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-bold text-base truncate ${debt.isPaid ? 'line-through text-muted-foreground' : 'text-slate-900'}`}>
                                                            {debt.creditor}
                                                        </p>
                                                        <div className="grid grid-cols-1 gap-1 mt-1 text-xs text-muted-foreground">
                                                            <span className="truncate text-slate-500">סה"כ: {formatCurrency(debt.totalAmount, currency)}</span>
                                                            <span className="text-slate-500">יום תשלום: {debt.dueDay}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                                                    <div className="text-right sm:text-left">
                                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">תשלום החודש</p>
                                                        <span className={`text-lg font-black ${debt.isPaid ? 'text-green-600' : 'text-purple-600'}`}>
                                                            {formatCurrency(debt.monthlyPayment, currency)}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleEdit(debt)}
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(debt.id)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                                }
                        </div>
                    </CardContent>
                </Card>
            </>
        )}
    </div>
}
