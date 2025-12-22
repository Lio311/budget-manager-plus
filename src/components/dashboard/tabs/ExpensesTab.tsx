'use client'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { Trash2, Plus, Loader2, Pencil, Check, X, Palette, Settings2 } from 'lucide-react'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { getExpenses, addExpense, deleteExpense, updateExpense } from '@/lib/actions/expense'
import { getCategories, addCategory, seedCategories } from '@/lib/actions/category'
import { useToast } from '@/hooks/use-toast'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Expense {
    id: string
    category: string
    description: string
    amount: number
    date: Date | null
}

interface Category {
    id: string
    name: string
    color: string | null
}

import { PRESET_COLORS } from '@/lib/constants'

export function ExpensesTab() {

    const { month, year, currency } = useBudget()
    const { toast } = useToast()

    // --- Data Fetching ---

    // Expenses Fetcher
    const fetcherExpenses = async () => {
        const result = await getExpenses(month, year)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch expenses')
    }

    const { data: expenses = [], isLoading: loadingExpenses, mutate: mutateExpenses } = useSWR<Expense[]>(
        ['expenses', month, year],
        fetcherExpenses,
        { revalidateOnFocus: false }
    )

    // Categories Fetcher
    const fetcherCategories = async () => {
        const result = await getCategories('expense')
        // If no categories, try to seed
        if (result.success && result.data && result.data.length === 0) {
            await seedCategories('expense')
            const retry = await getCategories('expense')
            if (retry.success && retry.data) return retry.data
        }
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categories = [], mutate: mutateCategories } = useSWR<Category[]>(
        ['categories', 'expense'],
        fetcherCategories,
        { revalidateOnFocus: false }
    )

    // --- State ---

    const [submitting, setSubmitting] = useState(false)
    const [newExpense, setNewExpense] = useState({
        category: '', description: '', amount: '', date: '',
        isRecurring: false,
        recurringEndDate: ''
    })
    const [filterCategory, setFilterCategory] = useState<string>('הכל')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ category: '', description: '', amount: '', date: '' })

    // New Category State
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    // Set default category when categories load
    useEffect(() => {
        if (categories.length > 0 && !newExpense.category) {
            setNewExpense(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories, newExpense.category])

    // --- Actions ---

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    const filteredExpenses = filterCategory === 'הכל'
        ? expenses
        : expenses.filter(e => e.category === filterCategory)

    async function handleAdd() {
        if (!newExpense.category || !newExpense.description || !newExpense.amount || !newExpense.date) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות', variant: 'destructive' })
            return
        }

        setSubmitting(true)
        const result = await addExpense(month, year, {
            category: newExpense.category,
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            date: newExpense.date,
            isRecurring: newExpense.isRecurring,
            recurringStartDate: undefined,
            recurringEndDate: newExpense.isRecurring ? newExpense.recurringEndDate : undefined
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההוצאה נוספה בהצלחה' })
            setNewExpense(prev => ({ ...prev, description: '', amount: '', date: '', isRecurring: false }))
            await mutateExpenses()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף הוצאה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        setSubmitting(true)
        const result = await addCategory({
            name: newCategoryName.trim(),
            type: 'expense',
            color: newCategoryColor
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'קטגוריה נוספה בהצלחה' })
            setNewCategoryName('')
            setIsAddCategoryOpen(false)
            await mutateCategories()
            // Select the new category
            setNewExpense(prev => ({ ...prev, category: newCategoryName.trim() }))
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף קטגוריה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    async function handleDelete(id: string) {
        const result = await deleteExpense(id)
        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההוצאה נמחקה בהצלחה' })
            await mutateExpenses()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק הוצאה', variant: 'destructive' })
        }
    }

    function handleEdit(expense: Expense) {
        setEditingId(expense.id)
        setEditData({
            category: expense.category,
            description: expense.description,
            amount: expense.amount.toString(),
            date: expense.date ? format(expense.date, 'yyyy-MM-dd') : ''
        })
    }

    function handleCancelEdit() {
        setEditingId(null)
        setEditData({ category: '', description: '', amount: '', date: '' })
    }

    async function handleUpdate() {
        if (!editingId || !editData.category || !editData.description || !editData.amount || !editData.date) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות', variant: 'destructive' })
            return
        }

        setSubmitting(true)
        const result = await updateExpense(editingId, {
            category: editData.category,
            description: editData.description,
            amount: parseFloat(editData.amount),
            date: editData.date
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההוצאה עודכנה בהצלחה' })
            setEditingId(null)
            setEditData({ category: '', description: '', amount: '', date: '' })
            await mutateExpenses()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן הוצאה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    const getCategoryColor = (catName: string) => {
        const cat = categories.find(c => c.name === catName)
        return cat?.color || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    if (loadingExpenses) {
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
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-5 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">קטגוריה</label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-full p-2 border rounded-md h-10 bg-background"
                                        value={newExpense.category}
                                        onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                        disabled={submitting}
                                    >
                                        <option value="" disabled>בחר קטגוריה</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>

                                    <Popover open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="icon" className="shrink-0">
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-4 z-50" dir="rtl">
                                            <div className="space-y-4">
                                                <h4 className="font-medium leading-none mb-4">קטגוריה חדשה</h4>
                                                <div className="space-y-2">
                                                    <Input
                                                        placeholder="שם הקטגוריה"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddCategory();
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-5 gap-2">
                                                    {PRESET_COLORS.map((color) => (
                                                        <div
                                                            key={color.name}
                                                            className={`h-6 w-6 rounded-full cursor-pointer border-2 ${color.class.split(' ')[0]} ${newCategoryColor === color.class ? 'border-primary' : 'border-transparent'
                                                                }`}
                                                            onClick={() => setNewCategoryColor(color.class)}
                                                            title={color.name}
                                                        />
                                                    ))}
                                                </div>
                                                <Button type="button" onClick={handleAddCategory} className="w-full" disabled={!newCategoryName || submitting}>
                                                    שמור קטגוריה
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">תיאור</label>
                                <Input
                                    placeholder="תיאור ההוצאה"
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
                            <Button onClick={handleAdd} className="gap-2" disabled={submitting}>
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                                הוסף
                            </Button>
                        </div>

                        {/* Recurring Options */}
                        <div className="flex items-start gap-4 p-4 border rounded-lg">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="recurring-expense"
                                    checked={newExpense.isRecurring}
                                    onCheckedChange={(checked) => setNewExpense({ ...newExpense, isRecurring: checked as boolean })}
                                />
                                <label htmlFor="recurring-expense" className="text-sm font-medium cursor-pointer">
                                    הוצאה קבועה (חוזרת)
                                </label>
                            </div>

                            {newExpense.isRecurring && (
                                <div className="space-y-2 w-[240px]">
                                    <label className="text-sm font-medium">תאריך סיום</label>
                                    <DatePicker
                                        date={newExpense.recurringEndDate ? new Date(newExpense.recurringEndDate) : undefined}
                                        setDate={(date) => setNewExpense({ ...newExpense, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filter */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>סינון לפי קטגוריה</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={filterCategory === 'הכל' ? 'default' : 'outline'}
                            onClick={() => setFilterCategory('הכל')}
                            size="sm"
                        >
                            הכל
                        </Button>
                        {categories.map(cat => (
                            <Button
                                key={cat.id}
                                variant={filterCategory === cat.name ? 'default' : 'outline'}
                                onClick={() => setFilterCategory(cat.name)}
                                size="sm"
                                className={filterCategory === cat.name ? '' : 'bg-transparent hover:bg-slate-50'}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

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
                                        {editingId === expense.id ? (
                                            <>
                                                <div className="flex-1 grid gap-4 md:grid-cols-4">
                                                    <select
                                                        className="p-2 border rounded-md"
                                                        value={editData.category}
                                                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                                        disabled={submitting}
                                                    >
                                                        {categories.map(cat => (
                                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                        ))}
                                                    </select>
                                                    <Input
                                                        placeholder="תיאור"
                                                        value={editData.description}
                                                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
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
                                                        type="date"
                                                        value={editData.date}
                                                        onChange={(e) => setEditData({ ...editData, date: e.target.value })}
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
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(expense.category)}`}>
                                                            {expense.category}
                                                        </span>
                                                        <p className="font-medium">{expense.description}</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {expense.date ? format(new Date(expense.date), 'dd/MM/yyyy') : 'אין תאריך'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-red-600">
                                                        {formatCurrency(expense.amount, currency)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(expense)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(expense.id)}
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
        </div >
    )
}
