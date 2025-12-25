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
        <div className="space-y-8">
            {/* Summary Card - Monday Style */}
            <div className="monday-card border-l-4 border-l-[#e2445c] p-6 flex flex-col justify-center gap-2">
                <h3 className="text-sm font-medium text-gray-500">סך הוצאות חודשיות</h3>
                <div className="text-3xl font-bold text-[#e2445c]">
                    {formatCurrency(totalExpenses, currency)}
                </div>
            </div>

            {/* Add Form - Glassmorphism */}
            <div className="glass-panel p-6">
                <div className="mb-6 flex items-center gap-2">
                    <div className="bg-[#e2445c] w-2 h-6 rounded-full"></div>
                    <h3 className="text-lg font-bold text-[#323338]">הוסף הוצאה חדשה</h3>
                </div>

                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex gap-2">
                        <div className="min-w-[140px]">
                            <label className="text-xs font-medium mb-1.5 block text-[#676879]">קטגוריה</label>
                            <select
                                className="w-full p-2.5 border border-gray-200 rounded-lg h-11 bg-white text-sm focus:ring-2 focus:ring-[#e2445c]/20 focus:border-[#e2445c] outline-none transition-all"
                                value={newExpense.category}
                                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                            >
                                <option value="" disabled>בחר קטגוריה</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="pt-6">
                            <Popover open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="shrink-0 h-11 w-11 rounded-lg border-gray-200 hover:bg-gray-50"><Plus className="h-4 w-4" /></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4 z-50 rounded-xl shadow-xl" dir="rtl">
                                    <div className="space-y-4">
                                        <h4 className="font-medium mb-4 text-[#323338]">קטגוריה חדשה</h4>
                                        <Input className="h-10" placeholder="שם הקטגוריה" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                                        <div className="grid grid-cols-5 gap-2">
                                            {PRESET_COLORS.map(color => (
                                                <div key={color.name} className={`h-8 w-8 rounded-full cursor-pointer transition-transform hover:scale-110 border-2 ${color.class.split(' ')[0]} ${newCategoryColor === color.class ? 'border-[#323338] scale-110' : 'border-transparent'}`} onClick={() => setNewCategoryColor(color.class)} />
                                            ))}
                                        </div>
                                        <Button onClick={handleAddCategory} className="w-full bg-[#e2445c] hover:bg-[#d43f55] text-white rounded-lg h-10" disabled={!newCategoryName || submitting}>שמור</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex-[2] min-w-[200px]">
                        <label className="text-xs font-medium mb-1.5 block text-[#676879]">תיאור</label>
                        <Input className="h-11 border-gray-200 focus:ring-[#e2445c]/20 focus:border-[#e2445c]" placeholder="מה קנית?" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium mb-1.5 block text-[#676879]">סכום</label>
                        <Input className="h-11 border-gray-200 focus:ring-[#e2445c]/20 focus:border-[#e2445c]" type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                    </div>

                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-medium mb-1.5 block text-[#676879]">תאריך</label>
                        <DatePicker date={newExpense.date ? new Date(newExpense.date) : undefined} setDate={(date) => setNewExpense({ ...newExpense, date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                    </div>

                    <Button onClick={handleAdd} className="gap-2 h-11 px-8 rounded-lg bg-[#e2445c] hover:bg-[#d43f55] text-white font-medium shadow-sm transition-all hover:shadow-md" disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} הוסף
                    </Button>
                </div>

                <div className="flex items-start gap-4 p-4 mt-6 border border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Checkbox id="recurring-expense" checked={newExpense.isRecurring} onCheckedChange={(checked) => setNewExpense({ ...newExpense, isRecurring: checked as boolean })} className="data-[state=checked]:bg-[#e2445c] data-[state=checked]:border-[#e2445c]" />
                        <label htmlFor="recurring-expense" className="text-sm font-medium cursor-pointer text-[#323338]">הוצאה קבועה</label>
                    </div>
                    {newExpense.isRecurring && (
                        <div className="flex gap-4 flex-1">
                            <div className="space-y-2 w-[240px]">
                                <label className="text-xs font-medium text-[#676879]">תאריך סיום</label>
                                <DatePicker date={newExpense.recurringEndDate ? new Date(newExpense.recurringEndDate) : undefined} setDate={(date) => setNewExpense({ ...newExpense, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' })} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 px-2">
                    <h3 className="text-lg font-bold text-[#323338]">רשימת הוצאות</h3>
                </div>

                {expenses.length === 0 ? (
                    <div className="monday-card p-8 text-center text-[#676879]">
                        אין הוצאות רשומות לחודש זה
                    </div>
                ) : (
                    <div className="space-y-3">
                        {expenses.map((exp: any) => (
                            <div key={exp.id} className="monday-card flex items-center justify-between p-4 group">
                                {editingId === exp.id ? (
                                    <>
                                        <div className="flex flex-nowrap gap-3 items-center flex-1 w-full overflow-x-auto pb-1">
                                            <select className="p-2 border rounded-md h-10 bg-white text-sm min-w-[140px]" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>
                                                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                            </select>
                                            <Input className="flex-1 min-w-[150px]" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                                            <Input className="w-32" type="number" placeholder="סכום" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} />
                                            <Input className="w-[140px]" type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                                        </div>
                                        <div className="flex items-center gap-2 mr-4">
                                            <Button variant="ghost" size="icon" onClick={handleUpdate} className="text-[#00c875] hover:bg-green-50"><Check className="h-5 w-5" /></Button>
                                            <Button variant="ghost" size="icon" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></Button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 flex items-center gap-6">
                                            <div className="min-w-[100px]">
                                                <span className={`monday-pill ${getCategoryColor(exp.category)} opacity-90`}>
                                                    {exp.category || 'כללי'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#323338] text-base">{exp.description}</span>
                                                <span className="text-xs text-[#676879]">{exp.date ? format(new Date(exp.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xl font-bold text-[#e2445c]">{formatCurrency(exp.amount, currency)}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)} className="h-8 w-8 text-blue-500 hover:bg-blue-50"><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="h-8 w-8 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
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
    )
}
