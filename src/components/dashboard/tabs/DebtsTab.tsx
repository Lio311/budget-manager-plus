'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Check, Loader2 } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getDebts, addDebt, deleteDebt, toggleDebtPaid } from '@/lib/actions/debts'
import { useToast } from '@/hooks/use-toast'

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
    const [newDebt, setNewDebt] = useState({ creditor: '', totalAmount: '', monthlyPayment: '', dueDay: '' })

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
                variant: 'destructive'
            })
        }
        setLoading(false)
    }

    const handleAdd = async () => {
        if (newDebt.creditor && newDebt.totalAmount && newDebt.monthlyPayment && newDebt.dueDay) {
            setSubmitting(true)
            const result = await addDebt(month, year, {
                creditor: newDebt.creditor,
                totalAmount: parseFloat(newDebt.totalAmount),
                monthlyPayment: parseFloat(newDebt.monthlyPayment),
                dueDay: parseInt(newDebt.dueDay),
            })

            if (result.success) {
                setNewDebt({ creditor: '', totalAmount: '', monthlyPayment: '', dueDay: '' })
                await loadDebts()
                toast({
                    title: 'הצלחה',
                    description: 'החוב נוסף בהצלחה'
                })
            } else {
                toast({
                    title: 'שגיאה',
                    description: result.error || 'לא ניתן להוסיף חוב',
                    variant: 'destructive'
                })
            }
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteDebt(id)

        if (result.success) {
            await loadDebts()
            toast({
                title: 'הצלחה',
                description: 'החוב נמחק בהצלחה'
            })
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן למחוק חוב',
                variant: 'destructive'
            })
        }
    }

    const togglePaid = async (id: string, currentStatus: boolean) => {
        const result = await toggleDebtPaid(id, !currentStatus)

        if (result.success) {
            await loadDebts()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן סטטוס',
                variant: 'destructive'
            })
        }
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="bg-gradient-to-l from-purple-50 to-white border-purple-200">
                    <CardHeader>
                        <CardTitle className="text-purple-700 text-sm">סך חובות</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {formatCurrency(totalDebts, currency)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-l from-orange-50 to-white border-orange-200">
                    <CardHeader>
                        <CardTitle className="text-orange-700 text-sm">תשלום חודשי</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(monthlyPayments, currency)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-l from-green-50 to-white border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-700 text-sm">שולם החודש</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(paidThisMonth, currency)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-l from-red-50 to-white border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-700 text-sm">ממתין לתשלום</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {formatCurrency(unpaidThisMonth, currency)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add New Debt */}
            <Card>
                <CardHeader>
                    <CardTitle>הוסף חוב חדש</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                        <Input
                            placeholder="נושה (בנק, כרטיס אשראי...)"
                            value={newDebt.creditor}
                            onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder="סכום כולל"
                            value={newDebt.totalAmount}
                            onChange={(e) => setNewDebt({ ...newDebt, totalAmount: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder="תשלום חודשי"
                            value={newDebt.monthlyPayment}
                            onChange={(e) => setNewDebt({ ...newDebt, monthlyPayment: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder="יום תשלום (1-31)"
                            min="1"
                            max="31"
                            value={newDebt.dueDay}
                            onChange={(e) => setNewDebt({ ...newDebt, dueDay: e.target.value })}
                        />
                        <Button onClick={handleAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            הוסף
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Debts List */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת חובות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {debts.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">אין חובות רשומים</p>
                        ) : (
                            <div className="space-y-2">
                                {debts.map((debt) => (
                                    <div
                                        key={debt.id}
                                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${debt.isPaid ? 'bg-green-50 border-green-200' : 'hover:bg-accent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <button
                                                onClick={() => togglePaid(debt.id, debt.isPaid)}
                                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${debt.isPaid
                                                    ? 'bg-green-500 border-green-500'
                                                    : 'border-gray-300 hover:border-green-500'
                                                    }`}
                                            >
                                                {debt.isPaid && <Check className="h-4 w-4 text-white" />}
                                            </button>
                                            <div className="flex-1">
                                                <p className={`font-medium ${debt.isPaid ? 'line-through text-muted-foreground' : ''}`}>
                                                    {debt.creditor}
                                                </p>
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    <span>סך חוב: {formatCurrency(debt.totalAmount, currency)}</span>
                                                    <span>תשלום חודשי: {formatCurrency(debt.monthlyPayment, currency)}</span>
                                                    <span>יום תשלום: {debt.dueDay}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-left">
                                                <p className="text-xs text-muted-foreground">תשלום החודש</p>
                                                <span className={`text-lg font-bold ${debt.isPaid ? 'text-green-600' : 'text-purple-600'}`}>
                                                    {formatCurrency(debt.monthlyPayment, currency)}
                                                </span>
                                            </div>
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
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
