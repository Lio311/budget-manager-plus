'use client'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Loader2, Pencil, Check, X } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { DatePicker } from '@/components/ui/date-picker'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { getIncomes, addIncome, deleteIncome, updateIncome } from '@/lib/actions/income'
import { getCategories, addCategory, seedCategories } from '@/lib/actions/category'
import { useToast } from '@/hooks/use-toast'
import { PRESET_COLORS } from '@/lib/constants'
import { Pagination } from '@/components/ui/Pagination'
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

    useEffect(() => {
        setNewIncome(prev => ({
            ...prev,
            date: format(new Date(), 'yyyy-MM-dd')
        }))
    }, [])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({ source: '', category: '', amount: '', date: '' })

    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const totalPages = Math.ceil(incomes.length / itemsPerPage)

    // Reset page when month/year changes
    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const paginatedIncomes = incomes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    useEffect(() => {
        if (categories.length > 0 && !newIncome.category) {
            setNewIncome(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories])

    const totalIncome = incomes.reduce((sum: number, income: any) => sum + income.amount, 0)

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
                date: newIncome.date || undefined,
                isRecurring: newIncome.isRecurring,
                recurringEndDate: newIncome.isRecurring ? newIncome.recurringEndDate : undefined
            })

            if (result.success) {
                toast({ title: 'הצלחה', description: 'ההכנסה נוספה בהצלחה' })
                setNewIncome({
                    source: '',
                    category: categories.length > 0 ? categories[0].name : '',
                    amount: '',
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
        console.log(`[IncomeTab] Calling addCategory for: ${newCategoryName.trim()}`)
        try {
            const result = await addCategory({
                name: newCategoryName.trim(),
                type: 'income',
                color: newCategoryColor
            })

            console.log(`[IncomeTab] addCategory result:`, result)
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
            console.error('Add category failed on client:', error)
            toast({
                title: 'שגיאה',
                description: `נכשל בתהנית: ${error.message || 'אירעה שגיאה בשרת'}`,
                variant: 'destructive'
            })
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

    // Helper to boldify colors
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

    if (loadingIncomes) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-rainbow-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-4 w-full max-w-full overflow-x-hidden pb-10">
            {/* Summary Card - Monday Style */}
            <div className="monday-card border-l-4 border-l-[#00c875] p-5 flex flex-col justify-center gap-2">
                <h3 className="text-sm font-medium text-gray-500">סך הכנסות חודשיות</h3>
                <div className="text-3xl font-bold text-[#00c875]">
                    {formatCurrency(totalIncome, currency)}
                </div>
            </div>

            {/* Add Form - Glassmorphism */}
            <div className="glass-panel p-5 mx-0 sm:mx-auto">
                <div className="mb-4 flex items-center gap-2">
                    <div className="bg-[#00c875] w-2 h-6 rounded-full"></div>
                    <h3 className="text-lg font-bold text-[#323338]">הוסף הכנסה חדשה</h3>
                </div>

                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex gap-2">
                        <div className="min-w-[140px]">
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

                    <div className="flex-[2] min-w-[200px]">
                        <label className="text-xs font-medium mb-1.5 block text-[#676879]">מקור ההכנסה</label>
                        <Input className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875]" placeholder="שם המקור (למשל: עבודה)" value={newIncome.source} onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })} />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                        <label className="text-xs font-medium mb-1.5 block text-[#676879]">סכום</label>
                        <Input className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875]" type="number" placeholder="0.00" value={newIncome.amount} onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })} />
                    </div>

                    <div className="flex-1 min-w-[140px]">
                        <label className="text-xs font-medium mb-1.5 block text-[#676879]">תאריך</label>
                        <DatePicker date={newIncome.date ? new Date(newIncome.date) : undefined} setDate={(date) => setNewIncome({ ...newIncome, date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                    </div>

                    <Button onClick={handleAdd} className="h-10 px-8 rounded-lg bg-[#00c875] hover:bg-[#00b268] text-white font-medium shadow-sm transition-all hover:shadow-md" disabled={submitting}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : 'הוסף'}
                    </Button>
                </div>

                <div className="flex items-start gap-4 p-4 mt-4 border border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <Checkbox id="recurring-income" checked={newIncome.isRecurring} onCheckedChange={(checked) => setNewIncome({ ...newIncome, isRecurring: checked as boolean })} className="data-[state=checked]:bg-[#00c875] data-[state=checked]:border-[#00c875]" />
                        <label htmlFor="recurring-income" className="text-sm font-medium cursor-pointer text-[#323338]">הכנסה קבועה</label>
                    </div>
                    {newIncome.isRecurring && (
                        <div className="flex gap-4 flex-1">
                            <div className="space-y-2 w-[240px]">
                                <label className="text-xs font-medium text-[#676879]">תאריך סיום</label>
                                <DatePicker date={newIncome.recurringEndDate ? new Date(newIncome.recurringEndDate) : undefined} setDate={(date) => setNewIncome({ ...newIncome, recurringEndDate: date ? format(date, 'yyyy-MM-dd') : '' })} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2 px-1">
                    <h3 className="text-lg font-bold text-[#323338]">רשימת הכנסות</h3>
                </div>

                {incomes.length === 0 ? (
                    <div className="monday-card p-8 text-center text-[#676879]">
                        אין הכנסות רשומות לחודש זה
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {paginatedIncomes.map((income: any) => (
                                <div key={income.id} className="monday-card flex items-center justify-between p-3 group hover:bg-gray-50/50 transition-colors">
                                    {editingId === income.id ? (
                                        <>
                                            <div className="flex flex-nowrap gap-3 items-center flex-1 w-full overflow-x-auto pb-1">
                                                <select className="p-2 border rounded-md h-10 bg-white text-sm min-w-[140px]" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>
                                                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                                </select>
                                                <Input className="flex-1 min-w-[150px]" value={editData.source} onChange={(e) => setEditData({ ...editData, source: e.target.value })} />
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
                                            <div className="flex-1 flex items-center gap-4">
                                                <div className="min-w-[100px]">
                                                    <span className={`monday-pill ${getCategoryColor(income.category)} opacity-100 font-bold`}>
                                                        {income.category || 'כללי'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#323338] text-base">{income.source}</span>
                                                    <span className="text-xs text-[#676879]">{income.date ? format(new Date(income.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-bold text-[#00c875]">{formatCurrency(income.amount, currency)}</span>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(income)} className="h-8 w-8 text-blue-500 hover:bg-blue-50"><Pencil className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(income.id)} className="h-8 w-8 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
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
    )
}
