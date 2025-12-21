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
        }
    }

    const togglePaid = async (id: string, currentStatus: boolean) => {
        const result = await toggleDebtPaid(id, !currentStatus)
        if (result.success) {
            await loadDebts()
        }
    }

    return (
        // הוספת overflow-x-hidden כאן מונעת את המלבן הלבן שבורח הצידה
        <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-10">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary Cards - שינוי ל-grid-cols-1 במובייל */}
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

                    {/* Add New Debt */}
                    <Card className="mx-0 sm:mx-auto">
                        <CardHeader>
                            <CardTitle className="text-lg">הוסף חוב חדש</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <Input
                                    placeholder="נושה (בנק, כרטיס...)"
                                    value={newDebt.creditor}
                                    onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                                    className="sm:col-span-2 lg:col-span-1"
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
                                    placeholder="יום (1-31)"
                                    min="1"
                                    max="31"
                                    value={newDebt.dueDay}
                                    onChange={(e) => setNewDebt({ ...newDebt, dueDay: e.target.value })}
                                />
                                <Button onClick={handleAdd} className="w-full gap-2 sm:col-span-2 lg:col-span-1" disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    הוסף
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Debts List */}
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

                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(debt.id)}
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-10 w-10"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}