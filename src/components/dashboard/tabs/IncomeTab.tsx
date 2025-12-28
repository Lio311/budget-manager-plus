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
import { addIncome, getIncomes, updateIncome, deleteIncome } from '@/lib/actions/income'
import { getCategories, addCategory } from '@/lib/actions/category'
import { getClients } from '@/lib/actions/clients'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import { RecurrenceActionDialog } from '../dialogs/RecurrenceActionDialog'

interface Category {
    id: string
    name: string
    color: string | null
}

interface Client {
    id: string
    name: string
}

interface Income {
    id: string
    source: string
    category: string
    amount: number
    currency?: string
    date: Date | null
    client?: Client | null
    invoice?: any | null
    vatAmount?: number | null
    payer?: string | null
    payer?: string | null
    paymentMethod?: string | null
    isRecurring?: boolean | null
}

interface IncomeData {
    incomes: Income[]
    totalILS: number
}

export function IncomeTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()

    const isBusiness = budgetType === 'BUSINESS'

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

    const fetcherClients = async () => {
        const result = await getClients()
        if (result.success && result.data) return result.data
        return []
    }

    const { data: clientsData = [] } = useSWR<any[]>(
        isBusiness ? ['clients'] : null,
        fetcherClients
    )

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
        date: format(new Date(), 'yyyy-MM-dd'),
        isRecurring: false,
        recurringEndDate: '',
        clientId: '',
        amountBeforeVat: '',
        vatRate: '0.18',
        vatAmount: '',
        paymentMethod: '',
        payer: ''
    })

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({
        source: '',
        category: '',
        amount: '',
        currency: 'ILS',
        date: '',
        clientId: '',
        vatAmount: '',
        paymentMethod: '',
        payer: ''
    })

    const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'edit', id: string } | null>(null)

    // ... (rest of the logic)

    // Handle VAT Calculations
    const calculateFromTotal = (total: string, rate: string) => {
        const t = parseFloat(total) || 0
        const r = parseFloat(rate) || 0
        const before = t / (1 + r)
        const vat = t - before
        return { before: before.toFixed(2), vat: vat.toFixed(2) }
    }

    useEffect(() => {
        if (isBusiness && newIncome.amount && newIncome.vatRate) {
            const { before, vat } = calculateFromTotal(newIncome.amount, newIncome.vatRate)
            setNewIncome(prev => ({ ...prev, amountBeforeVat: before, vatAmount: vat }))
        }
    }, [newIncome.amount, newIncome.vatRate, isBusiness])

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
                recurringEndDate: newIncome.isRecurring ? newIncome.recurringEndDate : undefined,
                clientId: isBusiness ? newIncome.clientId || undefined : undefined,
                amountBeforeVat: isBusiness ? parseFloat(newIncome.amountBeforeVat) : undefined,
                vatRate: isBusiness ? parseFloat(newIncome.vatRate) : undefined,
                vatAmount: isBusiness ? parseFloat(newIncome.vatAmount) : undefined,
                paymentMethod: newIncome.paymentMethod || undefined,
                payer: newIncome.payer || undefined
            }, budgetType)

            if (result.success) {
                toast({ title: 'הצלחה', description: 'ההכנסה נוספה בהצלחה' })
                setNewIncome({
                    source: '',
                    category: categories.length > 0 ? categories[0].name : '',
                    amount: '',
                    currency: 'ILS',
                    date: format(new Date(), 'yyyy-MM-dd'),
                    isRecurring: false,
                    recurringEndDate: '',
                    clientId: '',
                    amountBeforeVat: '',
                    vatRate: '0.18',
                    vatAmount: '',
                    paymentMethod: '',
                    payer: ''
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

    async function handleDelete(income: Income) {
        if (income.isRecurring) {
            setPendingAction({ type: 'delete', id: income.id })
            setRecurrenceDialogOpen(true)
            return
        }

        if (!confirm('האם אתה בטוח שברצונך למחוק הכנסה זו?')) return
        const result = await deleteIncome(income.id, 'SINGLE')
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
            date: income.date ? format(new Date(income.date), 'yyyy-MM-dd') : '',
            clientId: income.clientId || '',
            vatAmount: income.vatAmount?.toString() || '',
            paymentMethod: income.paymentMethod || '',
            payer: income.payer || ''
        })
    }

    async function handleUpdate() {
        if (!editingId) return

        const income = incomes.find(i => i.id === editingId)
        if (income && income.isRecurring) {
            setPendingAction({ type: 'edit', id: editingId })
            setRecurrenceDialogOpen(true)
            return
        }

        await executeUpdate('SINGLE')
    }

    async function executeUpdate(mode: 'SINGLE' | 'FUTURE') {
        if (!editingId) return

        setSubmitting(true)
        const result = await updateIncome(editingId, {
            source: editData.source,
            category: editData.category,
            amount: parseFloat(editData.amount),
            currency: editData.currency,
            date: editData.date || undefined,
            clientId: isBusiness ? editData.clientId || undefined : undefined,
            vatAmount: isBusiness ? parseFloat(editData.vatAmount) || undefined : undefined,
            paymentMethod: editData.paymentMethod || undefined,
            payer: editData.payer || undefined
        }, mode)

        if (result.success) {
            toast({ title: 'הצלחה', description: 'ההכנסה עודכנה בהצלחה' })
            setEditingId(null)
            await mutateIncomes()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן הכנסה', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    const handleRecurrenceConfirm = async (mode: 'SINGLE' | 'FUTURE') => {
        setRecurrenceDialogOpen(false)
        if (!pendingAction) return

        if (pendingAction.type === 'delete') {
            const result = await deleteIncome(pendingAction.id, mode)
            if (result.success) {
                toast({ title: 'הצלחה', description: 'ההכנסה נמחקה בהצלחה' })
                await mutateIncomes()
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק הכנסה', variant: 'destructive' })
            }
        } else if (pendingAction.type === 'edit') {
            await executeUpdate(mode)
        }
        setPendingAction(null)
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

    // Render component
    return (
        <div className="space-y-4 w-full max-w-full overflow-x-hidden pb-10 px-2 md:px-0">
            {/* Summary Card */}
            <div className={`monday-card border-l-4 p-5 flex flex-col justify-center gap-2 ${isBusiness ? 'border-l-blue-600' : 'border-l-[#00c875]'}`}>
                <h3 className="text-sm font-medium text-gray-500">{isBusiness ? 'סך מכירות/הכנסות חודשיות' : 'סך הכנסות חודשיות'}</h3>
                <div className={`text-3xl font-bold ${isBusiness ? 'text-blue-600' : 'text-[#00c875]'} ${loadingIncomes ? 'animate-pulse' : ''}`}>
                    {loadingIncomes ? '...' : formatCurrency(totalIncomeILS, '₪')}
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 lg:grid-cols-12">
                {/* Add Form */}
                <div className="lg:col-span-5 glass-panel p-5 h-fit sticky top-4">
                    <div className="mb-4 flex items-center gap-2">
                        <TrendingDown className={`h-5 w-5 rotate-180 ${isBusiness ? 'text-blue-600' : 'text-[#00c875]'}`} />
                        <h3 className="text-lg font-bold text-[#323338]">{isBusiness ? 'תיעוד מכירה / הכנסה' : 'הוספת הכנסה'}</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Source Input */}
                        <div className="w-full">
                            <label className="text-xs font-bold mb-1.5 block text-[#676879]">תיאור / מקור</label>
                            <Input className="h-10 border-gray-200 focus:ring-blue-500/20" placeholder={isBusiness ? "תיאור המכירה (למשל: ייעוץ עסקי)" : "שם המקור"} value={newIncome.source} onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })} />
                        </div>

                        {isBusiness && (
                            <div className="w-full">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879]">לקוח</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    value={newIncome.clientId}
                                    onChange={(e) => setNewIncome({ ...newIncome, clientId: e.target.value })}
                                >
                                    <option value="">ללא לקוח ספציפי</option>
                                    {clientsData.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Category Select */}
                        <div className="flex gap-2 w-full">
                            <div className="flex-1">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879]">קטגוריה</label>
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
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
                                            <Button onClick={handleAddCategory} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10" disabled={!newCategoryName || submitting}>שמור</Button>
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
                                    value={newIncome.currency}
                                    onChange={(e) => setNewIncome({ ...newIncome, currency: e.target.value })}
                                >
                                    {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                        <option key={code} value={code}>{code} ({symbol})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold mb-1.5 block text-[#676879]">סכום כולל</label>
                                <Input className="h-10 border-gray-200 focus:ring-blue-500/20" type="number" placeholder="0.00" value={newIncome.amount} onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })} />
                            </div>
                        </div>

                        {isBusiness && (
                            <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                <div>
                                    <label className="text-[10px] font-bold text-blue-800 uppercase mb-1 block">מע"מ (18%)</label>
                                    <div className="text-sm font-bold text-blue-900">{formatCurrency(parseFloat(newIncome.vatAmount) || 0, getCurrencySymbol(newIncome.currency))}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-blue-800 uppercase mb-1 block">לפני מע"מ</label>
                                    <div className="text-sm font-bold text-blue-900">{formatCurrency(parseFloat(newIncome.amountBeforeVat) || 0, getCurrencySymbol(newIncome.currency))}</div>
                                </div>
                            </div>
                        )}

                        {/* Payer Input (Optional) */}
                        <div className="w-full">
                            <label className="text-xs font-bold mb-1.5 block text-[#676879]">התקבל מ... (אופציונלי)</label>
                            <Input
                                className="h-10 border-gray-200 focus:ring-blue-500/20"
                                placeholder="שם המשלם"
                                value={newIncome.payer}
                                onChange={(e) => setNewIncome({ ...newIncome, payer: e.target.value })}
                            />
                        </div>

                        {/* Payment Method Selector */}
                        <div className="w-full">
                            <PaymentMethodSelector
                                value={newIncome.paymentMethod}
                                onChange={(val) => setNewIncome({ ...newIncome, paymentMethod: val })}
                                color={isBusiness ? 'blue' : 'green'}
                            />
                        </div>

                        <div className="w-full">
                            <label className="text-xs font-bold mb-1.5 block text-[#676879]">תאריך קבלה</label>
                            <DatePicker date={newIncome.date ? new Date(newIncome.date) : undefined} setDate={(date) => setNewIncome({ ...newIncome, date: date ? format(date, 'yyyy-MM-dd') : '' })} />
                        </div>

                        {/* Recurring Checkbox */}
                        <div className="flex items-start gap-4 p-4 border border-gray-100 rounded-xl bg-gray-50/50 w-full">
                            <div className="flex items-center gap-2">
                                <Checkbox id="recurring-income" checked={newIncome.isRecurring} onCheckedChange={(checked) => setNewIncome({ ...newIncome, isRecurring: checked as boolean })} className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600" />
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

                        <Button onClick={handleAdd} className={`w-full h-11 rounded-lg text-white font-bold shadow-sm transition-all hover:shadow-md ${isBusiness ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#00c875] hover:bg-[#00b268]'}`} disabled={submitting}>
                            {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : (isBusiness ? 'שמור הכנסה' : 'הוסף')}
                        </Button>
                    </div>
                </div>

                {/* List View */}
                <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-bold text-[#323338]">{isBusiness ? 'פירוט הכנסות ומכירות' : 'רשימת הכנסות'}</h3>
                        <span className="text-xs text-gray-400 font-medium">{incomes.length} שורות</span>
                    </div>

                    {incomes.length === 0 ? (
                        <div className="glass-panel text-center py-20 text-gray-400">
                            לא נמצאו נתונים לחודש זה
                        </div>
                    ) : (
                        paginatedIncomes.map((income: any) => (
                            <div key={income.id} className="glass-panel p-3 sm:p-4 group relative hover:border-blue-200 transition-all border-l-4 border-l-blue-100">
                                {editingId === income.id ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Input placeholder="תיאור" value={editData.source} onChange={e => setEditData({ ...editData, source: e.target.value })} />
                                            <Input placeholder="התקבל מ..." value={editData.payer} onChange={e => setEditData({ ...editData, payer: e.target.value })} />
                                        </div>
                                        <div className="w-full">
                                            <PaymentMethodSelector
                                                value={editData.paymentMethod}
                                                onChange={(val) => setEditData({ ...editData, paymentMethod: val })}
                                                color={isBusiness ? 'blue' : 'green'}
                                            />
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
                                            <Button size="sm" onClick={handleUpdate} className="bg-blue-600 text-white">שמור שינויים</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                            <div className="shrink-0">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(income.category)} text-white font-bold text-xs`}>
                                                    {income.category?.[0] || 'כ'}
                                                </div>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#323338] truncate text-sm sm:text-base">{income.source}</span>
                                                    {income.client && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-bold hidden sm:inline-block">
                                                            {income.client.name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 sm:gap-3 text-[11px] text-[#676879] overflow-hidden">
                                                    <span>{income.date ? format(new Date(income.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                    <span className="truncate">{income.category}</span>
                                                    {income.payer && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                            <span className="truncate">מאת: {income.payer}</span>
                                                        </>
                                                    )}
                                                    {income.paymentMethod && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                            <span className="truncate">{income.paymentMethod}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 sm:gap-6">
                                            {isBusiness && income.vatAmount > 0 && (
                                                <div className="hidden md:flex flex-col items-end text-[10px] text-gray-400 font-bold uppercase">
                                                    <span>מע"מ: {formatCurrency(income.vatAmount, getCurrencySymbol(income.currency))}</span>
                                                    <span>נקי: {formatCurrency(income.amount - income.vatAmount, getCurrencySymbol(income.currency))}</span>
                                                </div>
                                            )}
                                            <div className="text-right shrink-0">
                                                <div className={`text-base sm:text-lg font-bold ${isBusiness ? 'text-blue-600' : 'text-[#00c875]'}`}>
                                                    {formatCurrency(income.amount, getCurrencySymbol(income.currency || 'ILS'))}
                                                </div>
                                                {income.invoice && (
                                                    <div className="text-[10px] text-gray-400 font-medium hidden sm:block">#{income.invoice.invoiceNumber}</div>
                                                )}
                                            </div>
                                            <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(income)} className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 hover:bg-blue-50 rounded-full"><Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(income)} className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:bg-red-50 rounded-full"><Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
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
            </div >

        <RecurrenceActionDialog
            isOpen={recurrenceDialogOpen}
            onClose={() => {
                setRecurrenceDialogOpen(false)
                setPendingAction(null)
            }}
            onConfirm={handleRecurrenceConfirm}
            action={pendingAction?.type || 'delete'}
            entityName="הכנסה"
        />
        </div >
    )
}
