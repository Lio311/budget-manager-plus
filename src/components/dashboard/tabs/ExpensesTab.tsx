'use client'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Loader2, Pencil, X, Check, TrendingDown } from 'lucide-react'
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
import { Pagination } from '@/components/ui/Pagination'

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

    // State for Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const totalPages = Math.ceil(expenses.length / itemsPerPage)

    // Reset page when month/year changes
    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const paginatedExpenses = expenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const getCategoryColor = (catName: string) => {
        const cat = categories.find(c => c.name === catName)
        let c = cat?.color || 'bg-gray-100 text-gray-700 border-gray-200'

        // Upgrade to bold if it's a weak color
        if (c.includes('bg-') && c.includes('-100')) {
            c = c.replace(/bg-(\w+)-100/g, 'bg-$1-500')
                .replace(/text-(\w+)-700/g, 'text-white')
                .replace(/border-(\w+)-200/g, 'border-transparent')
        }
        return c
    }

    if (loadingExpenses) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-rainbow-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-4 w-full max-w-full overflow-x-hidden pb-10">
            {/* Summary Card - Monday Style */}
            <div className="monday-card border-l-4 border-l-[#e2445c] p-5 flex flex-col justify-center gap-2">
                <h3 className="text-sm font-medium text-gray-500">סך הוצאות חודשיות</h3>
                <div className="text-3xl font-bold text-[#e2445c]">
                    {formatCurrency(totalExpenses, currency)}
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Add Form - Glassmorphism */}
                <div className="glass-panel p-5 h-fit">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-[#e2445c]" />
                        <h3 className="text-lg font-bold text-[#323338]">הוספת הוצאה</h3>
                    </div>

                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex gap-2 w-full">
                            <div className="min-w-[140px] flex-1">
                                <label className="text-xs font-medium mb-1.5 block text-[#676879]">קטגוריה</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white text-sm focus:ring-2 focus:ring-[#e2445c]/20 focus:border-[#e2445c] outline-none transition-all"
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
                                        <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-lg border-gray-200 hover:bg-gray-50"><Plus className="h-4 w-4" /></Button>
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

                        <div className="w-full">
                            <label className="text-xs font-medium mb-1.5 block text-[#676879]">תיאור</label>
                            <Input className="h-10 border-gray-200 focus:ring-[#e2445c]/20 focus:border-[#e2445c]" placeholder="מה קנית?" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full">
                            <div>
                                <label className="text-xs font-medium mb-1.5 block text-[#676879]">סכום</label>
                                <Input className="h-10 border-gray-200 focus:ring-[#e2445c]/20 focus:border-[#e2445c]" type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                            </div>

                            <div>
                                <label className="text-xs font-medium mb-1.5 block text-[#676879]">תאריך</label>
                                <DatePicker date={newExpense.date ? new Date(newExpense.date) : undefined} setDate={(date) => setNewExpense({ ...newExpense, date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 mt-4 border border-gray-100 rounded-xl bg-gray-50/50 w-full">
                            <div className="flex items-center gap-2">
                                <Checkbox id="recurring-expense" checked={newExpense.isRecurring} onCheckedChange={(checked) => setNewExpense({ ...newExpense, isRecurring: checked as boolean })} className="data-[state=checked]:bg-[#e2445c] data-[state=checked]:border-[#e2445c]" />
                                <label htmlFor="recurring-expense" className="text-sm font-medium cursor-pointer text-[#323338]">הוצאה קבועה</label>
                            </div>
                            {newExpense.isRecurring && (
                                <div className="flex gap-4 flex-1">
                                    <div className="space-y-2 w-full">
                                        <label className="text-xs font-medium text-[#676879]">תאריך סיום</label>
                                        <DatePicker date={newExpense.recurringEndDate ? new Date(newExpense.recurringEndDate) : undefined} setDate={(date) => setNewExpense({ ...newExpense, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' })} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button onClick={handleAdd} className="w-full h-10 rounded-lg bg-[#e2445c] hover:bg-[#d43f55] text-white font-medium shadow-sm transition-all hover:shadow-md mt-2" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : 'הוסף'}
                        </Button>
                    </div>
                </div>

                {/* List - Glassmorphism */}
                <div className="glass-panel p-5 block">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <h3 className="text-lg font-bold text-[#323338]">רשימת הוצאות</h3>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            אין הוצאות רשומות לחודש זה
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {paginatedExpenses.map((exp: any) => (
                                    <div key={exp.id} className="group relative flex flex-col sm:flex-row items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                                        {editingId === exp.id ? (
                                            <div className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex flex-wrap gap-2 w-full">
                                                    <select
                                                        className="p-2 border rounded-md h-9 bg-white text-sm min-w-[100px] flex-1"
                                                        value={editData.category}
                                                        onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                                    >
                                                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                                    </select>
                                                    <Input className="h-9 flex-[2]" value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
                                                </div>
                                                <div className="flex gap-2 w-full">
                                                    <Input className="h-9 w-24" type="number" placeholder="סכום" value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} />
                                                    <div className="flex-1">
                                                        <Input className="h-9 w-full" type="date" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end gap-2 mt-2">
                                                    <Button size="sm" onClick={handleUpdate} className="bg-green-600 hover:bg-green-700 text-white"><Check className="h-4 w-4 ml-1" /> שמור</Button>
                                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-4 w-4 ml-1" /> ביטול</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                                                    <div className="shrink-0">
                                                        <span className={`monday-pill ${getCategoryColor(exp.category)} opacity-100 font-bold`}>
                                                            {exp.category || 'כללי'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-[#323338] text-base truncate">{exp.description}</span>
                                                        <span className="text-xs text-[#676879]">{exp.date ? format(new Date(exp.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pl-1">
                                                    <span className="text-lg font-bold text-[#e2445c]">{formatCurrency(exp.amount, currency)}</span>
                                                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)} className="h-8 w-8 text-blue-500 hover:bg-blue-50 rounded-full"><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
