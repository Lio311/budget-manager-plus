'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Check, Loader2, Pencil, Plus, Trash2, TrendingDown, X } from 'lucide-react'
import { format } from 'date-fns'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { Pagination } from '@/components/ui/Pagination'
import { addIncome, getIncomes, updateIncome, deleteIncome } from '@/lib/actions/income'
import { getCategories, addCategory } from '@/lib/actions/category'

interface Category {
    id: string
    name: string
    color: string | null
}
import { formatCurrency } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'

interface Income {
    id: string
    source: string
    category: string
    amount: number
    currency?: string
    date: Date | null
}

interface IncomeData {
    incomes: Income[]
    totalILS: number
}

// ... imports remain same

export function IncomeTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget() // budgetCurrency is the display preference, but we use totalILS from server
    const { toast } = useToast()

    // --- Data Fetching ---

    const fetcherIncomes = async () => {
        const result = await getIncomes(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch incomes')
    }

    const { data, isLoading: loadingIncomes, mutate: mutateIncomes } = useSWR<IncomeData>(
        ['incomes', month, year, budgetType],
        fetcherIncomes,
        { revalidateOnFocus: false }
    )

    const incomes = data?.incomes || []
    const totalIncomeILS = data?.totalILS || 0

    const fetcherCategories = async () => {
        const result = await getCategories('income', budgetType)
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categories = [], mutate: mutateCategories } = useSWR<Category[]>(
        ['categories', 'income', budgetType],
        fetcherCategories,
        { revalidateOnFocus: false }
    )

    // --- State ---

    const [submitting, setSubmitting] = useState(false)
    const [newIncome, setNewIncome] = useState({
        source: '',
        category: '',
        amount: '',
        currency: 'ILS',
        date: '',
        isRecurring: false,
        recurringEndDate: ''
    })

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ source: '', category: '', amount: '', currency: 'ILS', date: '' })

    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const totalPages = Math.ceil(incomes.length / itemsPerPage)

    const paginatedIncomes = incomes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // ... useEffects

    // Reset default currency when adding new
    useEffect(() => {
        setNewIncome(prev => ({ ...prev, currency: 'ILS' }))
    }, [])

    // ... other useEffects

    // --- Actions ---

    async function handleAdd() {
        if (!newIncome.source || !newIncome.amount || !newIncome.category) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות', variant: 'destructive' })
            return
        }

        setSubmitting(true)
        try {
            const result = await addIncome(month, year, {
                source: newIncome.source,
                category: newIncome.category,
                amount: parseFloat(newIncome.amount),
                currency: newIncome.currency,
                date: newIncome.date || undefined,
                isRecurring: newIncome.isRecurring,
                recurringEndDate: newIncome.isRecurring ? newIncome.recurringEndDate : undefined
            }, budgetType)

            if (result.success) {
                toast({ title: 'הצלחה', description: 'ההכנסה נוספה בהצלחה' })
                setNewIncome({
                    source: '',
                    category: categories.length > 0 ? categories[0].name : '',
                    amount: '',
                    currency: 'ILS',
                    date: '',
                    isRecurring: false,
                    recurringEndDate: ''
                })
                await mutateIncomes()
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף הכנסה', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add income failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בלתי צפויה', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        setSubmitting(true)
        try {
            const result = await addCategory({
                name: newCategoryName.trim(),
                type: 'income',
                color: newCategoryColor,
                scope: budgetType
            })

            if (result.success) {
                toast({ title: 'הצלחה', description: 'קטגוריה נוספה בהצלחה' })
                setNewCategoryName('')
                setIsAddCategoryOpen(false)
                await mutateCategories()
                const newCatName = newCategoryName.trim()
                setNewIncome(prev => ({ ...prev, category: newCatName }))
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף קטגוריה', variant: 'destructive' })
            }
        } catch (error: any) {
            console.error('Add category failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בשרת', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
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

    function handleEdit(income: any) {
        setEditingId(income.id)
        setEditData({
            source: income.source,
            category: income.category,
            amount: income.amount.toString(),
            currency: income.currency || 'ILS',
            date: income.date ? format(new Date(income.date), 'yyyy-MM-dd') : ''
        })
    }

    async function handleUpdate() {
        if (!editingId) return
        setSubmitting(true)
        const result = await updateIncome(editingId, {
            source: editData.source,
            category: editData.category,
            amount: parseFloat(editData.amount),
            currency: editData.currency,
            date: editData.date || undefined
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההכנסה עודכנה בהצלחה' })
            setEditingId(null)
            await mutateIncomes()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן הכנסה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    const getCategoryColor = (catName: string) => {
        const cat = categories.find(c => c.name === catName)
        let c = cat?.color || 'bg-gray-100 text-gray-700 border-gray-200'

        if (c.includes('bg-') && c.includes('-100')) {
            c = c.replace(/bg-(\w+)-100/g, 'bg-$1-500')
                .replace(/text-(\w+)-700/g, 'text-white')
                .replace(/border-(\w+)-200/g, 'border-transparent')
        }
        return c
    }

    return (
        <div className="space-y-4 w-full max-w-full overflow-x-hidden pb-10">
            {/* Summary Card - Monday Style */}
            <div className="monday-card border-l-4 border-l-[#00c875] p-5 flex flex-col justify-center gap-2">
                <h3 className="text-sm font-medium text-gray-500">סך הכנסות חודשיות (בשקלים)</h3>
                <div className={`text-3xl font-bold text-[#00c875] ${loadingIncomes ? 'animate-pulse' : ''}`}>
                    {loadingIncomes ? '...' : formatCurrency(totalIncomeILS, '₪')}
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Add Form - Glassmorphism */}
                <div className="glass-panel p-5 h-fit">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingDown className="h-5 w-5 text-[#00c875] rotate-180" />
                        <h3 className="text-lg font-bold text-[#323338]">הוספת הכנסה</h3>
                    </div>

                    <div className="flex flex-wrap gap-3 items-end">
                        {/* Source Input */}
                        <div className="w-full">
                            <label className="text-xs font-medium mb-1.5 block text-[#676879]">מקור ההכנסה</label>
                            <Input className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875]" placeholder="שם המקור (למשל: עבודה)" value={newIncome.source} onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })} />
                        </div>

                        {/* Category Select */}
                        <div className="flex gap-2 w-full">
                            <div className="flex-1">
                                <label className="text-xs font-medium mb-1.5 block text-[#676879]">קטגוריה</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white text-sm focus:ring-2 focus:ring-[#00c875]/20 focus:border-[#00c875] outline-none transition-all"
                                    value={newIncome.category}
                                    onChange={(e) => setNewIncome({ ...newIncome, category: e.target.value })}
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
                                    // ... Popover Content remains same
                                    <PopoverContent className="w-80 p-4 z-50 rounded-xl shadow-xl" dir="rtl">
                                        <div className="space-y-4">
                                            <h4 className="font-medium mb-4 text-[#323338]">קטגוריה חדשה</h4>
                                            <Input className="h-10" placeholder="שם הקטגוריה" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
                                            <div className="grid grid-cols-5 gap-2">
                                                {PRESET_COLORS.map(color => (
                                                    <div key={color.name} className={`h-8 w-8 rounded-full cursor-pointer transition-transform hover:scale-110 border-2 ${color.class.split(' ')[0]} ${newCategoryColor === color.class ? 'border-[#323338] scale-110' : 'border-transparent'}`} onClick={() => setNewCategoryColor(color.class)} />
                                                ))}
                                            </div>
                                            <Button onClick={handleAddCategory} className="w-full bg-[#00c875] hover:bg-[#00b268] text-white rounded-lg h-10" disabled={!newCategoryName || submitting}>שמור</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 w-full">
                            <div className="col-span-1">
                                <label className="text-xs font-medium mb-1.5 block text-[#676879]">מטבע</label>
                                <select
                                    className="w-full p-2 border border-gray-200 rounded-lg h-10 bg-white text-sm outline-none"
                                    value={newIncome.currency}
                                    onChange={(e) => setNewIncome({ ...newIncome, currency: e.target.value })}
                                >
                                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                        <option key={code} value={code}>{code} ({symbol})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-medium mb-1.5 block text-[#676879]">סכום</label>
                                <Input className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875]" type="number" placeholder="0.00" value={newIncome.amount} onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })} />
                            </div>
                        </div>

                        <div className="w-full">
                            <label className="text-xs font-medium mb-1.5 block text-[#676879]">תאריך</label>
                            <DatePicker date={newIncome.date ? new Date(newIncome.date) : undefined} setDate={(date) => setNewIncome({ ...newIncome, date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                        </div>


                        {/* Recurring Checkbox */}
                        <div className="flex items-start gap-4 p-4 mt-4 border border-gray-100 rounded-xl bg-gray-50/50 w-full">
                            <div className="flex items-center gap-2">
                                <Checkbox id="recurring-income" checked={newIncome.isRecurring} onCheckedChange={(checked) => setNewIncome({ ...newIncome, isRecurring: checked as boolean })} className="data-[state=checked]:bg-[#00c875] data-[state=checked]:border-[#00c875]" />
                                <label htmlFor="recurring-income" className="text-sm font-medium cursor-pointer text-[#323338]">הכנסה קבועה</label>
                            </div>
                            {newIncome.isRecurring && (
                                <div className="flex gap-4 flex-1">
                                    <div className="space-y-2 w-full">
                                        <label className="text-xs font-medium text-[#676879]">תאריך סיום</label>
                                        <DatePicker date={newIncome.recurringEndDate ? new Date(newIncome.recurringEndDate) : undefined} setDate={(date) => setNewIncome({ ...newIncome, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' })} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button onClick={handleAdd} className="w-full h-10 rounded-lg bg-[#00c875] hover:bg-[#00b268] text-white font-medium shadow-sm transition-all hover:shadow-md mt-2" disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : 'הוסף'}
                        </Button>
                    </div>
                </div>

                {/* List - Glassmorphism */}
                <div className="glass-panel p-5 block">
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <h3 className="text-lg font-bold text-[#323338]">רשימת הכנסות</h3>
                    </div>

                    {incomes.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            אין הכנסות רשומות לחודש זה
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3">
                                {paginatedIncomes.map((income: any) => (
                                    <div key={income.id} className="group relative flex flex-col sm:flex-row items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
                                        {editingId === income.id ? (
                                            <div className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                                                <div className="flex flex-wrap gap-2 w-full">
                                                    <select className="p-2 border rounded-md h-9 bg-white text-sm min-w-[100px] flex-1" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>
                                                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                                    </select>
                                                    <Input className="h-9 flex-[2]" value={editData.source} onChange={(e) => setEditData({ ...editData, source: e.target.value })} />
                                                </div>
                                                <div className="flex gap-2 w-full">
                                                    <select className="p-2 border rounded-md h-9 bg-white text-sm w-20" value={editData.currency} onChange={(e) => setEditData({ ...editData, currency: e.target.value })}>
                                                        {Object.keys(SUPPORTED_CURRENCIES).map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
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
                                                        <span className={`monday-pill ${getCategoryColor(income.category)} opacity-100 font-bold`}>
                                                            {income.category || 'כללי'}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-bold text-[#323338] text-base truncate">{income.source}</span>
                                                        <span className="text-xs text-[#676879]">{income.date ? format(new Date(income.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pl-1">
                                                    <span className="text-lg font-bold text-[#00c875]">{formatCurrency(income.amount, getCurrencySymbol(income.currency || 'ILS'))}</span>
                                                    <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(income)} className="h-8 w-8 text-blue-500 hover:bg-blue-50 rounded-full"><Pencil className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(income.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></Button>
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
