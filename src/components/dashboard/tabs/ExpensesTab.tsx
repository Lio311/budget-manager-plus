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
import { formatCurrency } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { addExpense, getExpenses, updateExpense, deleteExpense } from '@/lib/actions/expense'
import { getCategories, addCategory } from '@/lib/actions/category'
import { getSuppliers } from '@/lib/actions/suppliers'

interface Category {
    id: string
    name: string
    color: string | null
}

interface Supplier {
    id: string
    name: string
}

interface Expense {
    id: string
    category: string
    description: string | null
    amount: number
    currency?: string
    date: Date | null
    supplier?: Supplier | null
    vatAmount?: number | null
}

interface ExpenseData {
    expenses: Expense[]
    totalILS: number
}

export function ExpensesTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()

    const isBusiness = budgetType === 'BUSINESS'

    // --- Data Fetching ---

    const fetcherExpenses = async () => {
        const result = await getExpenses(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch expenses')
    }

    const { data, isLoading: loadingExpenses, mutate: mutateExpenses } = useSWR<ExpenseData>(
        ['expenses', month, year, budgetType],
        fetcherExpenses,
        { revalidateOnFocus: false }
    )

    const expenses = data?.expenses || []
    const totalExpensesILS = data?.totalILS || 0

    const fetcherSuppliers = async () => {
        const result = await getSuppliers()
        if (result.success && result.data) return result.data
        return []
    }

    const { data: suppliersData = [] } = useSWR<any[]>(
        isBusiness ? ['suppliers'] : null,
        fetcherSuppliers
    )

    const fetcherCategories = async () => {
        const result = await getCategories('expense', budgetType)
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categories = [], mutate: mutateCategories } = useSWR<Category[]>(
        ['categories', 'expense', budgetType],
        fetcherCategories,
        { revalidateOnFocus: false }
    )

    // --- State ---

    const [submitting, setSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    const [newExpense, setNewExpense] = useState({
        description: '',
        amount: '',
        category: '',
        currency: 'ILS',
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringEndDate: undefined as string | undefined,
        supplierId: '',
        amountBeforeVat: '',
        vatRate: '0.18',
        vatAmount: '',
        isDeductible: true,
        deductibleRate: '1.0'
    })

    const [editData, setEditData] = useState({
        description: '',
        amount: '',
        category: '',
        currency: 'ILS',
        date: '',
        supplierId: '',
        vatAmount: '',
        isDeductible: true
    })

    // Handle VAT Calculations
    const calculateFromTotal = (total: string, rate: string) => {
        const t = parseFloat(total) || 0
        const r = parseFloat(rate) || 0
        const before = t / (1 + r)
        const vat = t - before
        return { before: before.toFixed(2), vat: vat.toFixed(2) }
    }

    useEffect(() => {
        if (isBusiness && newExpense.amount && newExpense.vatRate) {
            const { before, vat } = calculateFromTotal(newExpense.amount, newExpense.vatRate)
            setNewExpense(prev => ({ ...prev, amountBeforeVat: before, vatAmount: vat }))
        }
    }, [newExpense.amount, newExpense.vatRate, isBusiness])

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
                currency: newExpense.currency as "ILS" | "USD" | "EUR" | "GBP",
                date: newExpense.date,
                isRecurring: newExpense.isRecurring,
                recurringEndDate: newExpense.recurringEndDate,
                supplierId: isBusiness ? newExpense.supplierId || undefined : undefined,
                amountBeforeVat: isBusiness ? parseFloat(newExpense.amountBeforeVat) : undefined,
                vatRate: isBusiness ? parseFloat(newExpense.vatRate) : undefined,
                vatAmount: isBusiness ? parseFloat(newExpense.vatAmount) : undefined,
                isDeductible: isBusiness ? newExpense.isDeductible : undefined,
                deductibleRate: isBusiness ? parseFloat(newExpense.deductibleRate) : undefined
            }, budgetType)

            if (result.success) {
                toast({ title: 'הצלחה', description: 'הוצאה נוספה בהצלחה' })
                setNewExpense({
                    description: '',
                    amount: '',
                    category: categories.length > 0 ? categories[0].name : '',
                    currency: 'ILS',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    isRecurring: false,
                    recurringEndDate: undefined,
                    supplierId: '',
                    amountBeforeVat: '',
                    vatRate: '0.18',
                    vatAmount: '',
                    isDeductible: true,
                    deductibleRate: '1.0'
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
        try {
            const result = await addCategory({
                name: newCategoryName.trim(),
                type: 'expense',
                color: newCategoryColor,
                scope: budgetType
            })

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
            console.error('Add category failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בשרת', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) return
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
            description: exp.description || '',
            amount: exp.amount.toString(),
            category: exp.category,
            currency: exp.currency || 'ILS',
            date: exp.date ? format(new Date(exp.date), 'yyyy-MM-dd') : '',
            supplierId: exp.supplierId || '',
            vatAmount: exp.vatAmount?.toString() || '',
            isDeductible: exp.isDeductible ?? true
        })
    }

    async function handleUpdate() {
        if (!editingId) return
        setSubmitting(true)
        const result = await updateExpense(editingId, {
            description: editData.description,
            amount: parseFloat(editData.amount),
            category: editData.category,
            currency: editData.currency as "ILS" | "USD" | "EUR" | "GBP",
            date: editData.date,
            supplierId: isBusiness ? editData.supplierId || undefined : undefined,
            vatAmount: isBusiness ? parseFloat(editData.vatAmount) || undefined : undefined,
            isDeductible: isBusiness ? editData.isDeductible : undefined
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 8
    const totalPages = Math.ceil(expenses.length / itemsPerPage)

    const paginatedExpenses = expenses.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

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
            {/* Summary Card */}
            <div className={`monday-card border-l-4 p-5 flex flex-col justify-center gap-2 ${isBusiness ? 'border-l-orange-600' : 'border-l-[#e2445c]'}`}>
                <h3 className="text-sm font-medium text-gray-500">{isBusiness ? 'סך עלויות / הוצאות חודשיות' : 'סך הוצאות חודשיות'}</h3>
                <div className={`text-3xl font-bold ${isBusiness ? 'text-orange-600' : 'text-[#e2445c]'} ${loadingExpenses ? 'animate-pulse' : ''}`}>
                    {loadingExpenses ? '...' : formatCurrency(totalExpensesILS, '₪')}
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 lg:grid-cols-12">
                {/* Add Form */}
                <div className="lg:col-span-5 glass-panel p-5 h-fit sticky top-4">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingDown className={`h-5 w-5 ${isBusiness ? 'text-orange-600' : 'text-[#e2445c]'}`} />
                        <h3 className="text-lg font-bold text-[#323338]">{isBusiness ? 'תיעוד הוצאה / עלות' : 'הוספת הוצאה'}</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="w-full">
                            <label className="text-xs font-bold mb-1.5 block text-[#676879]">תיאור ההוצאה</label>
                            <Input className="h-10 border-gray-200 focus:ring-orange-500/20" placeholder="מה קנית / שילמת?" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} />
                        </div>

                        {isBusiness && (
                            <div className="w-full">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879]">ספק</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                                    value={newExpense.supplierId}
                                    onChange={(e) => setNewExpense({ ...newExpense, supplierId: e.target.value })}
                                >
                                    <option value="">ללא ספק ספציפי</option>
                                    {suppliersData.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex gap-2 w-full">
                            <div className="flex-1">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879]">קטגוריה</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
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
                                            <Button onClick={handleAddCategory} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg h-10" disabled={!newCategoryName || submitting}>שמור</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 w-full">
                            <div className="col-span-1">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879]">מטבע</label>
                                <select
                                    className="w-full p-2 border border-gray-200 rounded-lg h-10 bg-white text-sm outline-none"
                                    value={newExpense.currency}
                                    onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                                >
                                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                        <option key={code} value={code}>{code} ({symbol})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879]">סכום כולל</label>
                                <Input className="h-10 border-gray-200 focus:ring-orange-500/20" type="number" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} />
                            </div>
                        </div>

                        {isBusiness && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                                <div>
                                    <label className="text-[10px] font-bold text-orange-800 uppercase mb-1 block">מע"מ מוכר (18%)</label>
                                    <div className="text-sm font-bold text-orange-900">{formatCurrency(parseFloat(newExpense.vatAmount) || 0, getCurrencySymbol(newExpense.currency))}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-orange-800 uppercase mb-1 block">סכום נקי</label>
                                    <div className="text-sm font-bold text-orange-900">{formatCurrency(parseFloat(newExpense.amountBeforeVat) || 0, getCurrencySymbol(newExpense.currency))}</div>
                                </div>
                            </div>
                        )}

                        <div className="w-full">
                            <label className="text-xs font-bold mb-1.5 block text-[#676879]">תאריך</label>
                            <DatePicker date={newExpense.date ? new Date(newExpense.date) : undefined} setDate={(date) => setNewExpense({ ...newExpense, date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                        </div>

                        {isBusiness && (
                            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <Checkbox id="is-deductible" checked={newExpense.isDeductible} onCheckedChange={(checked) => setNewExpense({ ...newExpense, isDeductible: checked as boolean })} className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600" />
                                <label htmlFor="is-deductible" className="text-xs font-bold text-[#323338] cursor-pointer">הוצאה מוכרת לצורכי מס</label>
                            </div>
                        )}

                        <div className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50 w-full">
                            <div className="flex items-center gap-2">
                                <Checkbox id="recurring-expense" checked={newExpense.isRecurring} onCheckedChange={(checked) => setNewExpense({ ...newExpense, isRecurring: checked as boolean })} className="data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600" />
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

                        <Button onClick={handleAdd} className={`w-full h-11 rounded-lg text-white font-bold shadow-sm transition-all hover:shadow-md ${isBusiness ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[#e2445c] hover:bg-[#d43f55]'}`} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : (isBusiness ? 'שמור הוצאה' : 'הוסף')}
                        </Button>
                    </div>
                </div>

                {/* List View */}
                <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-bold text-[#323338]">{isBusiness ? 'פירוט עלויות והוצאות' : 'רשימת הוצאות'}</h3>
                        <span className="text-xs text-gray-400 font-medium">{expenses.length} שורות</span>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="glass-panel text-center py-20 text-gray-400">
                            לא נמצאו נתונים לחודש זה
                        </div>
                    ) : (
                        paginatedExpenses.map((exp: any) => (
                            <div key={exp.id} className="glass-panel p-4 group relative hover:border-orange-200 transition-all border-l-4 border-l-orange-100">
                                {editingId === exp.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input placeholder="תיאור" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} />
                                            <select className="p-2 border rounded-lg bg-white text-sm" value={editData.supplierId} onChange={e => setEditData({ ...editData, supplierId: e.target.value })}>
                                                <option value="">ללא ספק</option>
                                                {suppliersData.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <Input type="number" value={editData.amount} onChange={e => setEditData({ ...editData, amount: e.target.value })} />
                                            <select className="p-2 border rounded-lg bg-white text-sm" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })}>
                                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                            </select>
                                            <Input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>ביטול</Button>
                                            <Button size="sm" onClick={handleUpdate} className="bg-orange-600 text-white">שמור שינויים</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(exp.category)} text-white font-bold text-xs`}>
                                                    {exp.category?.[0] || 'ה'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#323338] truncate">{exp.description}</span>
                                                    {exp.supplier && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded border border-orange-100 font-bold">
                                                            {exp.supplier.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-[#676879]">
                                                    <span>{exp.date ? format(new Date(exp.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span>{exp.category}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {isBusiness && exp.vatAmount > 0 && (
                                                <div className="hidden md:flex flex-col items-end text-[10px] text-gray-400 font-bold uppercase">
                                                    <span>מע"מ: {formatCurrency(exp.vatAmount, getCurrencySymbol(exp.currency))}</span>
                                                    <span>נקי: {formatCurrency(exp.amount - exp.vatAmount, getCurrencySymbol(exp.currency))}</span>
                                                </div>
                                            )}
                                            <div className="text-right shrink-0">
                                                <div className={`text-lg font-bold ${isBusiness ? 'text-orange-600' : 'text-[#e2445c]'}`}>
                                                    {formatCurrency(exp.amount, getCurrencySymbol(exp.currency || 'ILS'))}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)} className="h-8 w-8 text-blue-500 hover:bg-blue-50 rounded-full"><Pencil className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(exp.id)} className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
