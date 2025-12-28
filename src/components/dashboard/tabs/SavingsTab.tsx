'use client'

import useSWR, { useSWRConfig } from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Pagination } from '@/components/ui/Pagination'
import { Plus, Trash2, Loader2, Pencil, X, Check, PiggyBank } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getSavings, addSaving, deleteSaving, updateSaving } from '@/lib/actions/savings'
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
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { PaymentMethodSelector } from '../PaymentMethodSelector'
import { RecurrenceActionDialog } from '../dialogs/RecurrenceActionDialog'

interface Saving {
    id: string
    category: string
    name: string        // Updated from description
    monthlyDeposit: number | null // Updated to nullable
    currency: string
    notes: string | null // Updated from goal
    targetDate?: Date | null
    createdAt: Date
    paymentMethod?: string | null
    isRecurring?: boolean | null
}

interface SavingsData {
    savings: Saving[]
    stats: {
        totalMonthlyDepositILS: number
        count: number
    }
}

interface Category {
    id: string
    name: string
    color: string | null
}

export function SavingsTab() {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()

    // --- Data Fetching ---

    // Savings Fetcher
    const fetcherSavings = async () => {
        const result = await getSavings(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch savings')
    }

    const { data: savingsData, isLoading: loadingSavings, mutate: mutateSavings } = useSWR<SavingsData>(
        ['savings', month, year, budgetType],
        fetcherSavings,
        { revalidateOnFocus: false }
    )

    const savings = savingsData?.savings || []
    const stats = savingsData?.stats || { totalMonthlyDepositILS: 0, count: 0 }

    // Categories Fetcher
    const fetcherCategories = async () => {
        const result = await getCategories('saving', budgetType)
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categories = [], mutate: mutateCategories } = useSWR<Category[]>(
        ['categories', 'saving', budgetType],
        async () => {
            const data = await fetcherCategories()
            if (data.length === 0) {
                const { seedCategories } = await import('@/lib/actions/category')
                await seedCategories('saving', budgetType)
                return fetcherCategories()
            }
            return data
        },
        { revalidateOnFocus: false }
    )

    // --- State ---

    const [submitting, setSubmitting] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const totalPages = Math.ceil(savings.length / itemsPerPage)

    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const paginatedSavings = savings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Create form state
    const [newSaving, setNewSaving] = useState({
        category: '',
        description: '', // Maps to name
        monthlyDeposit: '',
        currency: 'ILS',
        goal: '',        // Maps to notes
        date: new Date(),
        isRecurring: false,
        recurringEndDate: undefined as Date | undefined,
        paymentMethod: ''
    })

    // Edit form state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({
        category: '',
        description: '',
        monthlyDeposit: '',
        currency: 'ILS',
        goal: '',
        date: new Date(),
        paymentMethod: ''
    })

    // New Category State
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'edit', id: string } | null>(null)

    // Set default category
    useEffect(() => {
        if (categories.length > 0 && !newSaving.category) {
            setNewSaving(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories, newSaving.category])

    // --- Actions ---

    async function handleAdd() {
        if (!newSaving.category || !newSaving.description || !newSaving.monthlyDeposit) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות החובה', variant: 'destructive' })
            return
        }

        if (newSaving.isRecurring && newSaving.recurringEndDate) {
            const start = new Date(newSaving.date)
            // Reset time part to ensure purely date comparison
            start.setHours(0, 0, 0, 0)

            const end = new Date(newSaving.recurringEndDate)
            end.setHours(0, 0, 0, 0)

            if (end < start) {
                toast({ title: 'שגיאה', description: 'תאריך סיום חייב להיות מאוחר יותר או שווה לתאריך ההתחלה', variant: 'destructive' })
                return
            }
        }

        setSubmitting(true)
        try {
            const result = await addSaving(month, year, {
                category: newSaving.category,
                description: newSaving.description,
                monthlyDeposit: parseFloat(newSaving.monthlyDeposit),
                currency: newSaving.currency,
                goal: newSaving.goal || undefined,
                date: newSaving.date, // Server component will handle the conversion
                isRecurring: newSaving.isRecurring,
                recurringStartDate: newSaving.isRecurring ? newSaving.date : undefined,
                recurringEndDate: newSaving.isRecurring ? newSaving.recurringEndDate : undefined,
                paymentMethod: newSaving.paymentMethod || undefined
            }, budgetType)

            if (result.success) {
                toast({ title: 'הצלחה', description: 'החיסכון נוסף בהצלחה' })
                setNewSaving({
                    category: categories.length > 0 ? categories[0].name : '',
                    description: '',
                    monthlyDeposit: '',
                    currency: 'ILS',
                    goal: '',
                    date: new Date(),
                    isRecurring: false,
                    recurringEndDate: undefined,
                    paymentMethod: ''
                })
                await mutateSavings()
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף חיסכון', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add saving failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בלתי צפויה', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        // Force bold color for new categories if using presets
        let colorToSave = newCategoryColor
        if (colorToSave.includes('bg-') && colorToSave.includes('-100')) {
            colorToSave = colorToSave
                .replace(/bg-(\w+)-100/g, 'bg-$1-500')
                .replace(/text-(\w+)-700/g, 'text-white')
                .replace(/border-(\w+)-200/g, 'border-$1-600')
        }

        setSubmitting(true)
        try {
            const result = await addCategory({
                name: newCategoryName.trim(),
                type: 'saving',
                color: colorToSave,
                scope: budgetType
            })

            if (result.success) {
                toast({ title: 'הצלחה', description: 'קטגוריה נוספה בהצלחה' })
                setNewCategoryName('')
                setIsAddCategoryOpen(false)
                await mutateCategories()
                // Update local state to select the new category
                const newCatName = newCategoryName.trim()
                setNewSaving(prev => ({ ...prev, category: newCatName }))
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף קטגוריה', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add category failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בשרת', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(saving: Saving) {
        if (saving.isRecurring) {
            setPendingAction({ type: 'delete', id: saving.id })
            setRecurrenceDialogOpen(true)
            return
        }

        const result = await deleteSaving(saving.id, 'SINGLE')
        if (result.success) {
            toast({ title: 'הצלחה', description: 'החיסכון נמחק בהצלחה' })
            await mutateSavings()
            mutate(key => Array.isArray(key) && key[0] === 'overview')
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק חיסכון', variant: 'destructive' })
        }
    }

    const startEdit = (saving: Saving) => {
        setEditingId(saving.id)
        // Handle both targetDate (DB field) 
        const dateToUse = saving.targetDate ? new Date(saving.targetDate) : new Date()
        setEditData({
            category: saving.category || '',
            description: saving.name || '',
            monthlyDeposit: saving.monthlyDeposit ? saving.monthlyDeposit.toString() : '',
            currency: saving.currency || 'ILS', // Default fallback
            goal: saving.notes || '',
            date: dateToUse,
            paymentMethod: saving.paymentMethod || ''
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditData({ category: '', description: '', monthlyDeposit: '', currency: 'ILS', goal: '', date: new Date(), paymentMethod: '' })
    }

    async function handleUpdate(id: string) {
        const saving = savings.find(s => s.id === id)
        if (saving && saving.isRecurring) {
            setPendingAction({ type: 'edit', id: id })
            setRecurrenceDialogOpen(true)
            return
        }

        await executeUpdate(id, 'SINGLE')
    }

    async function executeUpdate(id: string, mode: 'SINGLE' | 'FUTURE') {
        setSubmitting(true)
        const result = await updateSaving(id, {
            category: editData.category,
            description: editData.description,
            monthlyDeposit: parseFloat(editData.monthlyDeposit),
            currency: editData.currency,
            goal: editData.goal || undefined,
            date: editData.date,
            paymentMethod: editData.paymentMethod || undefined
        }, mode)

        if (result.success) {
            toast({ title: 'הצלחה', description: 'החיסכון עודכן בהצלחה' })
            setEditingId(null)
            await mutateSavings()
            mutate(key => Array.isArray(key) && key[0] === 'overview')
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן חיסכון', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    const handleRecurrenceConfirm = async (mode: 'SINGLE' | 'FUTURE') => {
        setRecurrenceDialogOpen(false)
        if (!pendingAction) return

        if (pendingAction.type === 'delete') {
            const result = await deleteSaving(pendingAction.id, mode)
            if (result.success) {
                toast({ title: 'הצלחה', description: 'החיסכון נמחק בהצלחה' })
                await mutateSavings()
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק חיסכון', variant: 'destructive' })
            }
        } else if (pendingAction.type === 'edit') {
            await executeUpdate(pendingAction.id, mode)
        }
        setPendingAction(null)
    }

    const getCategoryColor = (catName: string) => {
        const cat = categories.find(c => c.name === catName)
        let colorClass = cat?.color || 'bg-gray-500 text-white border-gray-600'

        // Force upgrade legacy pale colors to bold colors
        if (colorClass.includes('bg-') && colorClass.includes('-100')) {
            colorClass = colorClass
                .replace(/bg-(\w+)-100/g, 'bg-$1-500')
                .replace(/text-(\w+)-700/g, 'text-white')
                .replace(/border-(\w+)-200/g, 'border-transparent')
        }
        return colorClass
    };

    return (
        <div className="space-y-6 w-full pb-10 px-2 md:px-0" dir="rtl">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="monday-card border-l-4 border-l-[#0073ea] p-6 flex flex-col justify-center gap-2">
                    <h3 className="text-sm font-medium text-gray-500">סך הפקדות חודשיות</h3>
                    <div className={`text-2xl font-bold text-[#0073ea] break-all ${loadingSavings ? 'animate-pulse' : ''}`}>
                        {loadingSavings ? '...' : formatCurrency(stats.totalMonthlyDepositILS, '₪')}
                    </div>
                </div>

                <div className="monday-card border-l-4 border-l-[#0073ea] p-6 flex flex-col justify-center gap-2">
                    <h3 className="text-sm font-medium text-gray-500">מספר חסכונות</h3>
                    <div className={`text-2xl font-bold text-[#0073ea] ${loadingSavings ? 'animate-pulse' : ''}`}>
                        {loadingSavings ? '...' : stats.count}
                    </div>
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Add New Saving */}
                <div className="glass-panel p-5 h-fit">
                    <div className="mb-6 flex items-center gap-2">
                        <PiggyBank className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-bold text-[#323338]">הוספת חיסכון</h3>
                    </div>

                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="w-full space-y-2">
                            <label className="text-sm font-medium text-gray-700">קטגוריה</label>
                            <div className="flex gap-2">
                                <select
                                    className="w-full p-2.5 border border-gray-200 rounded-lg h-10 bg-white text-sm focus:ring-2 focus:ring-[#00c875]/20 focus:border-[#00c875] outline-none transition-all"
                                    value={newSaving.category}
                                    onChange={(e) => setNewSaving({ ...newSaving, category: e.target.value })}
                                    disabled={submitting}
                                >
                                    <option value="" disabled>בחר סוג</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                                <Popover open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="shrink-0 h-10 w-10 rounded-lg border-gray-200 hover:bg-gray-50">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 p-4 z-50 rounded-xl shadow-xl" dir="rtl">
                                        <div className="space-y-4">
                                            <h4 className="font-medium leading-none mb-4 text-[#323338]">קטגוריה חדשה</h4>
                                            <div className="space-y-2">
                                                <Input
                                                    className="h-10"
                                                    placeholder="שם הקטגוריה"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                />
                                            </div>
                                            <div className="grid grid-cols-5 gap-2">
                                                {PRESET_COLORS.map((color) => (
                                                    <div
                                                        key={color.name}
                                                        className={`h-8 w-8 rounded-full cursor-pointer transition-transform hover:scale-110 border-2 ${color.class.split(' ')[0]} ${newCategoryColor === color.class ? 'border-[#323338] scale-110' : 'border-transparent'}`}
                                                        onClick={() => setNewCategoryColor(color.class)}
                                                    />
                                                ))}
                                            </div>
                                            <Button onClick={handleAddCategory} className="w-full bg-[#00c875] hover:bg-[#00b065] text-white rounded-lg h-10" disabled={!newCategoryName || submitting}>שמור</Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="w-full space-y-2">
                            <label className="text-sm font-medium text-gray-700">תיאור</label>
                            <Input
                                placeholder="תיאור"
                                className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875]"
                                value={newSaving.description}
                                onChange={(e) => setNewSaving({ ...newSaving, description: e.target.value })}
                            />
                        </div>

                        <div className="w-full space-y-2">
                            <label className="text-sm font-medium text-gray-700">מטבע</label>
                            <select
                                className="w-full p-2 border border-gray-200 rounded-lg h-10 bg-white text-sm outline-none"
                                value={newSaving.currency}
                                onChange={(e) => setNewSaving({ ...newSaving, currency: e.target.value })}
                            >
                                {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                    <option key={code} value={code}>{code} ({symbol})</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">הפקדה</label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875] w-full"
                                    value={newSaving.monthlyDeposit}
                                    onChange={(e) => setNewSaving({ ...newSaving, monthlyDeposit: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">יעד</label>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="h-10 border-gray-200 focus:ring-[#00c875]/20 focus:border-[#00c875] w-full"
                                    value={newSaving.goal}
                                    onChange={(e) => setNewSaving({ ...newSaving, goal: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="w-full">
                            <PaymentMethodSelector
                                value={newSaving.paymentMethod}
                                onChange={(val) => setNewSaving({ ...newSaving, paymentMethod: val })}
                                color="blue"
                            />
                        </div>

                        <div className="w-full space-y-2">
                            <label className="text-sm font-medium text-gray-700">תאריך</label>
                            <DatePicker
                                date={newSaving.date}
                                setDate={(date) => setNewSaving({ ...newSaving, date: date || new Date() })}
                                placeholder="תאריך"
                            />
                        </div>

                        <div className="w-full flex items-start gap-4 p-4 mt-2 border border-gray-100 rounded-xl bg-gray-50/50 transition-all">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="recurring-saving"
                                    checked={newSaving.isRecurring}
                                    onCheckedChange={(checked) => setNewSaving({ ...newSaving, isRecurring: checked as boolean })}
                                    className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <label htmlFor="recurring-saving" className="text-sm font-medium cursor-pointer text-[#323338]">
                                    חיסכון קבוע
                                </label>
                            </div>

                            {newSaving.isRecurring && (
                                <div className="flex gap-4 flex-1">
                                    <div className="space-y-2 w-full">
                                        <label className="text-xs font-medium text-[#676879]">תאריך סיום</label>
                                        <DatePicker
                                            date={newSaving.recurringEndDate}
                                            setDate={(date) => setNewSaving({ ...newSaving, recurringEndDate: date })}
                                            placeholder="בחר תאריך סיום"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={handleAdd}
                            className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all hover:shadow-md mt-2"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-rainbow-spin" />
                            ) : (
                                'הוסף'
                            )}
                        </Button>
                    </div>
                </div>

                {/* Savings List */}
                <div className="glass-panel p-5 block">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <h3 className="text-lg font-bold text-[#323338]">רשימת חסכונות</h3>
                    </div>

                    <div className="space-y-3">
                        {loadingSavings ? (
                            <div className="text-center py-10 text-gray-400">טוען...</div>
                        ) : savings.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                אין חסכונות רשומים
                            </div>
                        ) : (
                            <>
                                {paginatedSavings.map((saving) => <div
                                    key={saving.id}
                                    className="group relative flex flex-col sm:flex-row items-center justify-between p-3 sm:p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    {editingId === saving.id ? (
                                        <div className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex flex-wrap gap-2 w-full">
                                                <select
                                                    className="p-2 border rounded-lg h-9 bg-white text-sm min-w-[100px] flex-1"
                                                    value={editData.category}
                                                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                                    disabled={submitting}
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                    ))}
                                                </select>
                                                <Input
                                                    className="h-9 min-w-[120px] flex-[2]"
                                                    value={editData.description}
                                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                    disabled={submitting}
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-2 w-full">
                                                <select
                                                    className="p-2 border rounded-lg h-9 bg-white text-sm min-w-[80px] flex-1"
                                                    value={editData.currency}
                                                    onChange={(e) => setEditData({ ...editData, currency: e.target.value })}
                                                    disabled={submitting}
                                                >
                                                    {Object.keys(SUPPORTED_CURRENCIES).map(code => (
                                                        <option key={code} value={code}>{code}</option>
                                                    ))}
                                                </select>
                                                <Input
                                                    type="number"
                                                    className="h-9 min-w-[80px] flex-1"
                                                    placeholder="סכום"
                                                    value={editData.monthlyDeposit}
                                                    onChange={(e) => setEditData({ ...editData, monthlyDeposit: e.target.value })}
                                                    disabled={submitting}
                                                />
                                                <Input
                                                    type="number"
                                                    className="h-9 min-w-[80px] flex-1"
                                                    placeholder="יעד"
                                                    value={editData.goal}
                                                    onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
                                                    disabled={submitting}
                                                />
                                                <div className="min-w-[120px] flex-1">
                                                    <DatePicker
                                                        date={editData.date}
                                                        setDate={(date) => setEditData({ ...editData, date: date || new Date() })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="w-full">
                                                <PaymentMethodSelector
                                                    value={editData.paymentMethod}
                                                    onChange={(val) => setEditData({ ...editData, paymentMethod: val })}
                                                    color="blue"
                                                />
                                            </div>

                                            <div className="flex justify-end gap-2 mt-2">
                                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                    ביטול
                                                </Button>
                                                <Button size="sm" onClick={() => handleUpdate(saving.id)} className="bg-blue-600 hover:bg-blue-700 text-white">
                                                    שמור שינויים
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-start gap-3 w-full sm:w-auto">
                                                <div className="shrink-0">
                                                    <span className={`monday-pill ${getCategoryColor(saving.category)} opacity-90 text-xs sm:text-sm`}>
                                                        {saving.category}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                    {/* Name - full width, no truncate */}
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-sm sm:text-base text-[#323338]">{saving.name}</span>
                                                        {saving.isRecurring && (
                                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                                                                <span className="w-1 h-1 rounded-full bg-current" />
                                                                קבוע
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Date and details in separate line */}
                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#676879]">
                                                        <span>
                                                            {(() => {
                                                                try {
                                                                    const dateToFormat = saving.targetDate
                                                                    return dateToFormat ? format(new Date(dateToFormat), 'dd/MM/yyyy') : 'תאריך חסר'
                                                                } catch (e) {
                                                                    return 'תאריך לא תקין'
                                                                }
                                                            })()}
                                                        </span>
                                                        {saving.notes && (
                                                            <>
                                                                <span className="shrink-0">•</span>
                                                                <span>יעד: {saving.notes}</span>
                                                            </>
                                                        )}
                                                        {saving.paymentMethod && (
                                                            <>
                                                                <span className="shrink-0">•</span>
                                                                <span>{saving.paymentMethod}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pl-1">
                                                <span className="text-base sm:text-lg font-bold text-[#00c875]">
                                                    {formatCurrency(saving.monthlyDeposit || 0, getCurrencySymbol(saving.currency))}
                                                </span>
                                                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => startEdit(saving)}
                                                        className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 hover:bg-blue-50 rounded-full"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(saving)}
                                                        className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:bg-red-50 rounded-full"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                )}
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            </>
                        )}
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
                entityName="חיסכון"
            />
        </div >
    )
}
