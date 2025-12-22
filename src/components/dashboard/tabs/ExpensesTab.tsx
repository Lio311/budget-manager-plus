'use client'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Loader2, Pencil, X, Check } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getExpenses, addExpense, deleteExpense, updateExpense } from '@/lib/actions/expense'
import { getCategories, addCategory } from '@/lib/actions/category'
import { useToast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { PRESET_COLORS } from '@/lib/constants'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Category {
    id: string
    name: string
    color: string | null
}

export function ExpensesTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()

    // --- Data Fetching ---

    const fetcherExpenses = async () => {
        const result = await getExpenses(month, year)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch expenses')
    }

    const { data: expenses = [], isLoading: loadingExpenses, mutate: mutateExpenses } = useSWR(
        ['expenses', month, year],
        fetcherExpenses,
        { revalidateOnFocus: false }
    )

    const fetcherCategories = async () => {
        const result = await getCategories('expense')
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
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({
        description: '',
        amount: '',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd')
    })

    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: '',
        date: '',
        isRecurring: false,
        recurringEndDate: undefined as string | undefined
    })

    useEffect(() => {
        setNewExpense(prev => ({
            ...prev,
            date: format(new Date(), 'yyyy-MM-dd')
        }))
    }, [])

    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    // Default category
    useEffect(() => {
        if (categories.length > 0 && !newExpense.category) {
            setNewExpense(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories, newExpense.category])

    const totalExpenses = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0)

    // --- Actions ---

    async function handleAdd() {
        if (!newExpense.amount || !newExpense.category) {
            toast({ title: 'שגיאה', description: 'נא למלא סכום וקטגוריה', variant: 'destructive' })
            return
        }

        setSubmitting(true)
        try {
            const result = await addExpense(month, year, {
                description: newExpense.description || 'הוצאה ללא תיאור',
                amount: parseFloat(newExpense.amount),
                category: newExpense.category,
                date: newExpense.date,
                isRecurring: newExpense.isRecurring,
                recurringEndDate: newExpense.recurringEndDate
            })

            if (result.success) {
                toast({ title: 'הצלחה', description: 'הוצאה נוספה בהצלחה' })
                setNewExpense({
                    description: '',
                    amount: '',
                    category: categories.length > 0 ? categories[0].name : '',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    isRecurring: false,
                    recurringEndDate: undefined
                })
                await mutateExpenses()
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף הוצאה', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add expense failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בלתי צפויה', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        setSubmitting(true)
        console.log(`[ExpensesTab] Calling addCategory for: ${newCategoryName.trim()}`)
        try {
            const result = await addCategory({
                name: newCategoryName.trim(),
                type: 'expense',
                color: newCategoryColor
            })

            console.log(`[ExpensesTab] addCategory result:`, result)
            if (result.success) {
                toast({ title: 'הצלחה', description: 'קטגוריה נוספה בהצלחה' })
                setNewCategoryName('')
                setIsAddCategoryOpen(false)
                await mutateCategories()
                const newCatName = newCategoryName.trim()
                setNewExpense(prev => ({ ...prev, category: newCatName }))
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף קטגוריה', variant: 'destructive' })
            }
        } catch (error: any) {
            console.error('Add category failed on client:', error)
            toast({
                title: 'שגיאה',
                description: `שגיאה: ${error.message || 'אירעה שגיאה בשרת'}`,
                variant: 'destructive'
            })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id: string) {
        const result = await deleteExpense(id)
        if (result.success) {
            toast({ title: 'הצלחה', description: 'הוצאה נמחקה בהצלחה' })
            await mutateExpenses()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק הוצאה', variant: 'destructive' })
        }
    }

    function handleEdit(exp: any) {
        setEditingId(exp.id)
        setEditData({
            description: exp.description,
            amount: exp.amount.toString(),
            category: exp.category,
            date: format(new Date(exp.date), 'yyyy-MM-dd')
        })
    }

    async function handleUpdate() {
        if (!editingId) return
        setSubmitting(true)
        const result = await updateExpense(editingId, {
            description: editData.description,
            amount: parseFloat(editData.amount),
            category: editData.category,
            date: editData.date
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'הוצאה עודכנה בהצלחה' })
            setEditingId(null)
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
            <Card className="bg-gradient-to-l from-red-50 to-white border-red-200 shadow-sm">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-red-700 text-xs sm:text-sm">סך הוצאות חודשיות</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="text-xl sm:text-2xl font-bold text-red-600">
                        {formatCurrency(totalExpenses, currency)}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>הוסף הוצאה חדשה</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex gap-2">
                            <div className="min-w-[120px]">
                                <label className="text-xs font-medium mb-1 block text-muted-foreground italic">קטגוריה</label>
                                <select
                                    className="w-full p-2 border rounded-md h-10 bg-background text-sm"
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                >
                                    <option value="" disabled>בחר קטגוריה</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="pt-5">
                                <Popover open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="shrink-0 h-10 w-10"><Plus className="h-4 w-4" /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4 z-50" dir="rtl">
                                        <div className="space-y-4">
                                            <h4 className="font-medium mb-4">קטגוריה חדשה</h4>
                                            <Input placeholder="שם הקטגוריה" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                                            <div className="grid grid-cols-5 gap-2">
                                                {PRESET_COLORS.map(color => (
                                                    <div key={color.name} className={`h-6 w-6 rounded-full cursor-pointer border-2 ${color.class.split(' ')[0]} ${newCategoryColor === color.class ? 'border-primary' : 'border-transparent'}`} onClick={() => setNewCategoryColor(color.class)} />
                                                ))}
                                            </div>
                                            <Button onClick={handleAddCategory} className="w-full" disabled={!newCategoryName || submitting}>שמור</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="flex-[2] min-w-[200px]">
                            <label className="text-xs font-medium mb-1 block text-muted-foreground italic">תיאור</label>
                            <Input placeholder="מה קנית?" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
                        </div>

                        <div className="flex-1 min-w-[120px]">
                            <label className="text-xs font-medium mb-1 block text-muted-foreground italic">סכום</label>
                            <Input type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                        </div>

                        <div className="flex-1 min-w-[140px]">
                            <label className="text-xs font-medium mb-1 block text-muted-foreground italic">תאריך</label>
                            <DatePicker date={newExpense.date ? new Date(newExpense.date) : undefined} setDate={(date) => setNewExpense({ ...newExpense, date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                        </div>

                        <Button onClick={handleAdd} className="gap-2 h-10 px-6" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} הוסף
                        </Button>
                    </div>

                    <div className="flex items-start gap-4 p-4 mt-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                            <Checkbox id="recurring-expense" checked={newExpense.isRecurring} onCheckedChange={(checked) => setNewExpense({ ...newExpense, isRecurring: checked as boolean })} />
                            <label htmlFor="recurring-expense" className="text-sm font-medium cursor-pointer">הוצאה קבועה</label>
                        </div>
                        {newExpense.isRecurring && (
                            <div className="flex gap-4 flex-1">
                                <div className="space-y-2 w-[240px]">
                                    <label className="text-xs font-medium">תאריך סיום</label>
                                    <DatePicker date={newExpense.recurringEndDate ? new Date(newExpense.recurringEndDate) : undefined} setDate={(date) => setNewExpense({ ...newExpense, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' })} />
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>רשימת הוצאות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {expenses.length === 0 ? <p className="text-center text-muted-foreground py-8">אין הוצאות רשומות לחודש זה</p> : (
                            <div className="space-y-2">
                                {expenses.map((exp: any) => (
                                    <div key={exp.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                                        {editingId === exp.id ? (
                                            <>
                                                <div className="flex flex-nowrap gap-2 items-center flex-1 w-full overflow-x-auto pb-1">
                                                    <select className="p-2 border rounded-md h-10 bg-background text-sm min-w-[120px]" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>
                                                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                                    </select>
                                                    <Input className="flex-1 min-w-[150px]" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                                                    <Input className="w-32" type="number" placeholder="סכום" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} />
                                                    <Input className="w-[140px]" type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                                                </div>
                                                <div className="flex items-center gap-2 mr-4">
                                                    <Button variant="ghost" size="icon" onClick={handleUpdate} className="text-green-600"><Check className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(exp.category)}`}>{exp.category || 'כללי'}</span>
                                                        <p className="font-medium">{exp.description}</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{exp.date ? format(new Date(exp.date), 'dd/MM/yyyy') : 'ללא תאריך'}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-bold text-red-600">{formatCurrency(exp.amount, currency)}</span>
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)} className="text-blue-600"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></Button>
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
