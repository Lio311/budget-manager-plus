'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { getIncomes, addIncome, deleteIncome } from '@/lib/actions/income'
import { useToast } from '@/hooks/use-toast'

interface Income {
    id: string
    source: string
    amount: number
    date: Date | null
}

export function IncomeTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()
    const [incomes, setIncomes] = useState<Income[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [newIncome, setNewIncome] = useState({ source: '', amount: '', date: '' })

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)

    // Load incomes when month/year changes
    useEffect(() => {
        loadIncomes()
    }, [month, year])

    async function loadIncomes() {
        setLoading(true)
        const result = await getIncomes(month, year)

        if (result.success && result.data) {
            setIncomes(result.data)
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לטעון הכנסות',
                variant: 'destructive'
            })
        }
        setLoading(false)
    }

    async function handleAdd() {
        if (!newIncome.source || !newIncome.amount) {
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל השדות הנדרשים',
                variant: 'destructive'
            })
            return
        }

        setSubmitting(true)
        const result = await addIncome(month, year, {
            source: newIncome.source,
            amount: parseFloat(newIncome.amount),
            date: newIncome.date || undefined
        })

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'ההכנסה נוספה בהצלחה'
            })
            setNewIncome({ source: '', amount: '', date: '' })
            await loadIncomes()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן להוסיף הכנסה',
                variant: 'destructive'
            })
        }
        setSubmitting(false)
    }

    async function handleDelete(id: string) {
        const result = await deleteIncome(id)

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'ההכנסה נמחקה בהצלחה'
            })
            await loadIncomes()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן למחוק הכנסה',
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
            {/* Summary Card */}
            <Card className="bg-gradient-to-l from-green-50 to-white border-green-200">
                <CardHeader>
                    <CardTitle className="text-green-700">סך הכנסות חודשיות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-green-600">
                        {formatCurrency(totalIncome, currency)}
                    </div>
                </CardContent>
            </Card>

            {/* Add New Income */}
            <Card>
                <CardHeader>
                    <CardTitle>הוסף הכנסה חדשה</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">מקור הכנסה</label>
                            <Input
                                placeholder="משכורת, עבודה נוספת..."
                                value={newIncome.source}
                                onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">סכום</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={newIncome.amount}
                                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">תאריך</label>
                            <DatePicker
                                date={newIncome.date ? new Date(newIncome.date) : undefined}
                                setDate={(date) => setNewIncome({ ...newIncome, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                            />
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
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

            {/* Incomes List */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת הכנסות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {incomes.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">אין הכנסות רשומות לחודש זה</p>
                        ) : (
                            <div className="space-y-2">
                                {incomes.map((income) => (
                                    <div
                                        key={income.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{income.source}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {income.date ? format(new Date(income.date), 'dd/MM/yyyy') : 'ללא תאריך'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(income.amount, currency)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(income.id)}
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
