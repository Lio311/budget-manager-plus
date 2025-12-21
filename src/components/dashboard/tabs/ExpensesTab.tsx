'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { Trash2, Plus, Loader2 } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { getExpenses, addExpense, deleteExpense } from '@/lib/actions/expense'
import { useToast } from '@/hooks/use-toast'

interface Expense {
    id: string
    category: string
    description: string
    amount: number
    date: Date
}

const CATEGORIES = ['מזון', 'תחבורה', 'בילויים', 'קניות', 'בריאות', 'חינוך', 'אחר']
const CATEGORY_COLORS: Record<string, string> = {
    'מזון': 'bg-green-100 text-green-700 border-green-200',
    'תחבורה': 'bg-blue-100 text-blue-700 border-blue-200',
    'בילויים': 'bg-purple-100 text-purple-700 border-purple-200',
    'קניות': 'bg-pink-100 text-pink-700 border-pink-200',
    'בריאות': 'bg-red-100 text-red-700 border-red-200',
    'חינוך': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'אחר': 'bg-gray-100 text-gray-700 border-gray-200',
}

export function ExpensesTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [newExpense, setNewExpense] = useState({ category: 'מזון', description: '', amount: '', date: '' })
    const [filterCategory, setFilterCategory] = useState<string>('הכל')

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const filteredExpenses = filterCategory === 'הכל'
        ? expenses
        : expenses.filter(e => e.category === filterCategory)

    useEffect(() => {
        loadExpenses()
    }, [month, year])

    async function loadExpenses() {
        setLoading(true)
        const result = await getExpenses(month, year)

        if (result.success && result.data) {
            setExpenses(result.data)
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לטעון הוצאות',
                variant: 'destructive'
            })
        }
        setLoading(false)
    }

    async function handleAdd() {
        if (!newExpense.description || !newExpense.amount || !newExpense.date) {
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל השדות הנדרשים',
                variant: 'destructive'
            })
            return
        }

        setSubmitting(true)
        const result = await addExpense(month, year, {
            category: newExpense.category,
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            date: newExpense.date
        })

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'ההוצאה נוספה בהצלחה'
            })
            setNewExpense({ category: 'מזון', description: '', amount: '', date: '' })
            await loadExpenses()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן להוסיף הוצאה',
                variant: 'destructive'
            })
        }
        setSubmitting(false)
    }

    async function handleDelete(id: string) {
        const result = await deleteExpense(id)

        if (result.success) {
            toast({
                title: 'הצלחה',
                description: 'ההוצאה נמחקה בהצלחה'
            })
            await loadExpenses()
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן למחוק הוצאה',
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
            <Card className="bg-gradient-to-l from-red-50 to-white border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-700">סך הוצאות חודשיות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-red-600">
                        {formatCurrency(totalExpenses, currency)}
                    </div>
                </CardContent>
            </Card>

            {/* Add New Expense */}
            <Card>
                <CardHeader>
                    <CardTitle>הוסף הוצאה חדשה</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">קטגוריה</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                disabled={submitting}
                            >
                                {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">תיאור</label>
                            <Input
                                placeholder="מה קנינו?"
                                value={newExpense.description}
                                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">סכום</label>
                            <Input
                                type="number"
                                placeholder="0.00"
                                value={newExpense.amount}
                                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                disabled={submitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">תאריך</label>
                            <DatePicker
                                date={newExpense.date ? new Date(newExpense.date) : undefined}
                                setDate={(date) => setNewExpense({ ...newExpense, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                            />
                        </div>
                        <Button
                            onClick={handleAdd}
                            className="bg-primary hover:bg-primary/90"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="ml-2 h-4 w-4" />
                            )}
                            הוסף
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Filter */}
            <div className="flex gap-2 flex-wrap">
                <Button
                    variant={filterCategory === 'הכל' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory('הכל')}
                >
                    הכל
                </Button>
                {CATEGORIES.map((cat) => (
                    <Button
                        key={cat}
                        variant={filterCategory === cat ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterCategory(cat)}
                    >
                        {cat}
                    </Button>
                ))}
            </div>

            {/* Expenses List */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת הוצאות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {filteredExpenses.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">אין הוצאות רשומות</p>
                        ) : (
                            <div className="space-y-2">
                                {filteredExpenses.map((expense) => (
                                    <div
                                        key={expense.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[expense.category]}`}>
                                                {expense.category}
                                            </span>
                                            <div>
                                                <p className="font-medium">{expense.description}</p>
                                                <p className="text-sm text-muted-foreground">{format(new Date(expense.date), 'dd/MM/yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-bold text-red-600">
                                                {formatCurrency(expense.amount, currency)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(expense.id)}
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
