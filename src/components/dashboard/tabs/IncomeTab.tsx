'use client'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Loader2, Pencil, Check, X, Palette } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { getIncomes, addIncome, deleteIncome, updateIncome } from '@/lib/actions/income'
import { getCategories, addCategory, seedCategories } from '@/lib/actions/category'
import { useToast } from '@/hooks/use-toast'
import { PRESET_COLORS } from '@/lib/constants'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Income {
    id: string
    source: string
    category: string
    amount: number
    date: Date | null
}

interface Category {
    id: string
    name: string
    color: string | null
}

export function IncomeTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()

    // --- Data Fetching ---

    // Incomes Fetcher
    const fetcherIncomes = async () => {
        const result = await getIncomes(month, year)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch incomes')
    }

    const { data: incomes = [], isLoading: loadingIncomes, mutate: mutateIncomes } = useSWR(
        ['incomes', month, year],
        fetcherIncomes,
        { revalidateOnFocus: false }
    )

    // Categories Fetcher
    const fetcherCategories = async () => {
        const result = await getCategories('income')
        if (result.success && result.data && result.data.length === 0) {
            await seedCategories('income')
            const retry = await getCategories('income')
            if (retry.success && retry.data) return retry.data
        }
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categories = [], mutate: mutateCategories } = useSWR<Category[]>(
        ['categories', 'income'],
        fetcherCategories,
        { revalidateOnFocus: false }
    )

    // --- State ---

    const [submitting, setSubmitting] = useState(false)
    const [newIncome, setNewIncome] = useState({
        source: '',
        category: '',
        amount: '',
        date: '',
        isRecurring: false,
        recurringEndDate: ''
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ source: '', category: '', amount: '', date: '' })

    // New Category State
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    // Set default category
    useEffect(() => {
        if (categories.length > 0 && !newIncome.category) {
            setNewIncome(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories, newIncome.category])

    const totalIncome = incomes.reduce((sum: number, income: any) => sum + income.amount, 0)

    // --- Actions ---

    async function handleAdd() {
        if (!newIncome.source || !newIncome.amount || !newIncome.category) {
            toast({
                title: 'שגיאה',
                description: 'נא למלא את כל השדות',
                variant: 'destructive',
            })
            return
        }

        setSubmitting(true)
        const result = await addIncome(month, year, {
            source: newIncome.source,
            category: newIncome.category,
            amount: parseFloat(newIncome.amount),
            date: newIncome.date || undefined,
            isRecurring: newIncome.isRecurring,
            recurringStartDate: undefined,
            recurringEndDate: newIncome.isRecurring ? newIncome.recurringEndDate : undefined
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההכנסה נוספה בהצלחה' })
            setNewIncome(prev => ({ ...prev, source: '', amount: '', date: '', isRecurring: false }))
            await mutateIncomes()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף הכנסה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        setSubmitting(true)
        const result = await addCategory({
            name: newCategoryName.trim(),
            type: 'income',
            color: newCategoryColor
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'קטגוריה נוספה בהצלחה' })
            setNewCategoryName('')
            setIsAddCategoryOpen(false)
            await mutateCategories()
            setNewIncome(prev => ({ ...prev, category: newCategoryName.trim() }))
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף קטגוריה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    async function handleDelete(id: string) {
        const result = await deleteIncome(id)
        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההכנסה נמחקה בהצלחה' })
            await mutateIncomes()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק הכנסה', variant: 'destructive' })
        }
    }

    function handleEdit(income: Income) {
        setEditingId(income.id)
        setEditData({
            source: income.source,
            category: income.category,
            amount: income.amount.toString(),
            date: income.date ? format(new Date(income.date), 'yyyy-MM-dd') : ''
        })
    }

    function handleCancelEdit() {
        setEditingId(null)
        setEditData({ source: '', category: '', amount: '', date: '' })
    }

    async function handleUpdate() {
        if (!editingId || !editData.source || !editData.amount || !editData.category) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות', variant: 'destructive' })
            return
        }

        setSubmitting(true)
        const result = await updateIncome(editingId, {
            source: editData.source,
            category: editData.category,
            amount: parseFloat(editData.amount),
            date: editData.date || undefined
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההכנסה עודכנה בהצלחה' })
            setEditingId(null)
            setEditData({ source: '', category: '', amount: '', date: '' })
            await mutateIncomes()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן הכנסה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    const getCategoryColor = (catName: string) => {
        const cat = categories.find(c => c.name === catName)
        return cat?.color || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    if (loadingIncomes) {
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
                    <div className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-5 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">קטגוריה</label>
                                <div className="flex gap-2">
                                    <select
                                        className="w-full p-2 border rounded-md h-10 bg-background"
                                        value={newIncome.category}
                                        onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })}
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
                                        <PopoverContent className="w-80 p-4" dir="rtl">
                                            <div className="space-y-4">
                                                <h4 className="font-medium leading-none mb-4">קטגוריה חדשה</h4>
                                                <div className="space-y-2">
                                                    <Input
                                                        placeholder="שם הקטגוריה"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
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
                                                <Button onClick={handleAddCategory} className="w-full" disabled={!newCategoryName || submitting}>
                                                    שמור קטגוריה
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">מקור ההכנסה</label>
                                <Input
                                    placeholder="שם המקור (למשל: עבודה)"
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
                                    id="recurring-income"
                                    checked={newIncome.isRecurring}
                                    onCheckedChange={(checked) => setNewIncome({ ...newIncome, isRecurring: checked as boolean })}
                                />
                                <label htmlFor="recurring-income" className="text-sm font-medium cursor-pointer">
                                    הכנסה קבועה (חוזרת)
                                </label>
                            </div>

                            {newIncome.isRecurring && (
                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium">תאריך סיום</label>
                                    <DatePicker
                                        date={newIncome.recurringEndDate ? new Date(newIncome.recurringEndDate) : undefined}
                                        setDate={(date) => setNewIncome({ ...newIncome, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    />
                                </div>
                            )}

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
                                {incomes.map((income: any) => (
                                    <div
                                        key={income.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        {editingId === income.id ? (
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
                                                        placeholder="מקור"
                                                        value={editData.source}
                                                        onChange={(e) => setEditData({ ...editData, source: e.target.value })}
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
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(income.category)}`}>
                                                            {income.category || 'כללי'}
                                                        </span>
                                                        <p className="font-medium">{income.source}</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {income.date ? format(new Date(income.date), 'dd/MM/yyyy') : 'ללא תאריך'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-green-600">
                                                        {formatCurrency(income.amount, currency)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(income)}
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(income.id)}
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
