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
import { useOptimisticDelete, useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { PRESET_COLORS } from '@/lib/constants'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import { RecurrenceActionDialog } from '../dialogs/RecurrenceActionDialog'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { SavingForm } from '@/components/dashboard/forms/SavingForm'

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

    const { data: categoriesRaw, mutate: mutateCategories } = useSWR<Category[]>(
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

    const categories = Array.isArray(categoriesRaw) ? categoriesRaw : []

    // --- State ---

    // --- State ---

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    useAutoPaginationCorrection(currentPage, savings.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(savings.length / itemsPerPage)

    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        setCurrentPage(1)
    }, [month, year])

    const paginatedSavings = savings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

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

    const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'edit', id: string } | null>(null)

    // Optimistic delete for instant UI feedback
    const { deleteItem: optimisticDeleteSaving } = useOptimisticDelete<SavingsData>(
        ['savings', month, year, budgetType],
        (id) => deleteSaving(id, 'SINGLE'),
        {
            getOptimisticData: (current, id) => ({
                ...current,
                savings: current.savings.filter(saving => saving.id !== id)
            }),
            successMessage: 'החיסכון נמחק בהצלחה',
            errorMessage: 'שגיאה במחיקת החיסכון'
        }
    )

    async function handleDelete(saving: Saving) {
        if (saving.isRecurring) {
            setPendingAction({ type: 'delete', id: saving.id })
            setRecurrenceDialogOpen(true)
            return
        }

        try {
            await optimisticDeleteSaving(saving.id)
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } catch (error) {
            // Error handled by hook
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
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
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
        const cat = Array.isArray(categories) ? categories.find(c => c.name === catName) : null

        // Use theme-aware fallback instead of gray
        let colorClass = cat?.color || 'bg-blue-500 text-white border-transparent'

        // Force upgrade legacy pale colors to bold colors
        if (colorClass.includes('bg-') && colorClass.includes('-100')) {
            colorClass = colorClass
                .replace(/bg-(\w+)-100/g, 'bg-$1-500')
                .replace(/text-(\w+)-700/g, 'text-white')
                .replace(/border-(\w+)-200/g, 'border-transparent')
        }
        return colorClass
    }

    return (
        <div className="space-y-6 w-full pb-10 px-2 md:px-0" dir="rtl">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="monday-card border-l-4 border-l-[#0073ea] p-6 flex flex-col justify-center gap-2 dark:bg-slate-800 dark:border-l-blue-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">סך הפקדות חודשיות</h3>
                    <div className={`text-2xl font-bold text-[#0073ea] dark:text-blue-400 break-all ${loadingSavings ? 'animate-pulse' : ''}`}>
                        {loadingSavings ? '...' : formatCurrency(stats.totalMonthlyDepositILS, '₪')}
                    </div>
                </div>

                <div className="monday-card border-l-4 border-l-[#0073ea] p-6 flex flex-col justify-center gap-2 dark:bg-slate-800 dark:border-l-blue-500">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">מספר חסכונות</h3>
                    <div className={`text-2xl font-bold text-[#0073ea] dark:text-blue-400 ${loadingSavings ? 'animate-pulse' : ''}`}>
                        {loadingSavings ? '...' : stats.count}
                    </div>
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Add New Saving - Desktop Only */}
                <div className="hidden md:block glass-panel p-5 h-fit">
                    <SavingForm
                        categories={categories}
                        onCategoriesChange={mutateCategories}
                    />
                </div>

                {/* Mobile FAB and Dialog */}
                <div className="md:hidden">
                    <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <DialogTrigger asChild>
                            <FloatingActionButton
                                onClick={() => setIsMobileOpen(true)}
                                colorClass="bg-blue-600"
                                label="הוסף חיסכון"
                            />
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                            <DialogTitle className="sr-only">הוספת חיסכון</DialogTitle>
                            <SavingForm
                                categories={categories}
                                onCategoriesChange={mutateCategories}
                                isMobile={true}
                                onSuccess={() => setIsMobileOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Savings List */}
                <div className="glass-panel p-5 block">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">רשימת חסכונות</h3>
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
                                    className="group relative flex flex-col sm:flex-row items-center justify-between p-3 sm:p-3 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    {editingId === saving.id ? (
                                        <div className="flex flex-col gap-3 w-full animate-in fade-in zoom-in-95 duration-200">
                                            <div className="flex flex-wrap gap-2 w-full">
                                                <select
                                                    className="p-2 border rounded-lg h-9 bg-white dark:bg-slate-800 dark:border-slate-700 text-sm min-w-[100px] flex-1 dark:text-slate-100"
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
                                                    className="p-2 border rounded-lg h-9 bg-white dark:bg-slate-800 dark:border-slate-700 text-sm min-w-[80px] flex-1 dark:text-slate-100"
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
                                                        <span className="font-bold text-sm sm:text-base text-[#323338] dark:text-gray-100">{saving.name}</span>
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
