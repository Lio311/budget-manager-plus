'use client'

import { useState, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'

import {
    Check, Loader2, Pencil, Plus, Trash2, TrendingDown, X,
    ShoppingCart, Utensils, Bus, Heart, GraduationCap, Popcorn,
    Fuel, Car, Phone, Smartphone, Briefcase, Zap, Home, Plane, RefreshCw,
    Umbrella, Dumbbell, Shield
} from 'lucide-react'
import { format } from 'date-fns'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { ExpenseForm } from '@/components/dashboard/forms/ExpenseForm'
import { DatePicker } from '@/components/ui/date-picker'
import { Pagination } from '@/components/ui/Pagination'
import { formatCurrency, cn } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
<<<<
import { deleteExpense, getExpenses, updateExpense, importExpenses } from '@/lib/actions/expense'
====
const handleDeleteAll = async () => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את כל ההוצאות של אותו חודש?')) return

    setLoading(true) // Reusing loading state if possible or add local
    try {
        const result = await deleteAllMonthlyExpenses(month, year, budgetType)
        if (result.success) {
            toast({ title: 'הצלחה', description: 'כל ההוצאות נמחקו בהצלחה' })
            await mutateExpenses()
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } else {
            toast({ title: 'שגיאה', description: 'מחיקת ההוצאות נכשלה', variant: 'destructive' })
        }
    } catch (error) {
        console.error(error)
        toast({ title: 'שגיאה', description: 'שגיאה במחיקת נתונים', variant: 'destructive' })
    } finally {
        setLoading(false)
    }
}

return (
    <div>
        <div className="mb-4 flex items-center gap-2">
            <TrendingDown className={`h-5 w-5 ${isBusiness ? 'text-red-600' : 'text-[#e2445c]'}`} />
            <h3 className="text-lg font-bold text-[#323338]">{isBusiness ? 'תיעוד הוצאה / עלות' : 'הוספת הוצאה'}</h3>
            {!isMobile && (
                <div className="mr-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleDeleteAll}
                        title="מחק את כל ההוצאות לחודש זה"
                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <CategoryManagementDialog
                    >>>>
                        import {getSuppliers} from '@/lib/actions/suppliers'
                        import {useOptimisticDelete} from '@/hooks/useOptimisticMutation'
                        import {getCategories} from '@/lib/actions/category'
                        import {getCategoryBudgets, CategoryBudgetUsage} from '@/lib/actions/budget-limits'
                        import {RecurrenceActionDialog} from '../dialogs/RecurrenceActionDialog'


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
                        paymentMethod?: string | null
                        isDeductible?: boolean | null
                        isRecurring?: boolean | null
}

                        interface ExpenseData {
                            expenses: Expense[]
                        totalILS: number
}

                        const PAYMENT_METHOD_LABELS: Record<string, string> = {
                            'CASH': 'מזומן',
                        'CREDIT_CARD': 'כרטיס אשראי',
                        'BANK_TRANSFER': 'העברה בנקאית',
                        'CHECK': 'צ׳ק',
                        'BIT': 'ביט',
                        'OTHER': 'אחר',
                        'PAYPAL': 'PayPal'
}


const getCategoryIcon = (name: string) => {
    const trimmed = name?.trim() || '';
                        const lower = trimmed.toLowerCase();

                        // Fuzzy matching for common variations
                        if (trimmed.includes('אפליקציות') || trimmed.includes('מינוי')) return <Smartphone className="h-4 w-4" />
                        if (trimmed.includes('ביטוח')) return <Shield className="h-4 w-4" />
                        if (trimmed.includes('ביגוד') || trimmed.includes('בגדים')) return <ShoppingCart className="h-4 w-4" />
                        if (trimmed.includes('אוכל') || trimmed.includes('מזון')) return <Utensils className="h-4 w-4" />
                        if (trimmed.includes('מסיבה') || trimmed.includes('בילוי')) return <Popcorn className="h-4 w-4" />
                        if (trimmed.includes('קבוע')) return <RefreshCw className="h-4 w-4" />

                        switch (trimmed) {
        case 'תחבורה': return <Bus className="h-4 w-4" />
                        case 'קניות': return <ShoppingCart className="h-4 w-4" />
                        case 'בריאות': return <Heart className="h-4 w-4" />
                        case 'חינוך': return <GraduationCap className="h-4 w-4" />
                        case 'דלק': return <Fuel className="h-4 w-4" />
                        case 'חנייה': return <Car className="h-4 w-4" />
                        case 'תקשורת': return <Phone className="h-4 w-4" />
                        case 'משכורת': return <Briefcase className="h-4 w-4" />
                        case 'חשמל': return <Zap className="h-4 w-4" />
                        case 'שכירות': return <Home className="h-4 w-4" />
                        case 'חופשה': return <Plane className="h-4 w-4" />
                        case 'ספורט': return <Dumbbell className="h-4 w-4" />
                        default: return <span className="text-xs font-bold">{typeof name === 'string' ? name.charAt(0) : '?'}</span>
    }
}

                        export function ExpensesTab() {
    const {month, year, currency: budgetCurrency, budgetType } = useBudget()
                        const {toast} = useToast()
                        const {mutate: globalMutate } = useSWRConfig()

                        const isBusiness = budgetType === 'BUSINESS'

    // --- Data Fetching ---

    const fetcherExpenses = async () => {
        const result = await getExpenses(month, year, budgetType)
                        if (result.success && result.data) return result.data
                        throw new Error(result.error || 'Failed to fetch expenses')
    }

                        const {data, isLoading: loadingExpenses, mutate: mutateExpenses } = useSWR<ExpenseData>(
                            ['expenses', month, year, budgetType],
                            fetcherExpenses,
                            {revalidateOnFocus: false }
                            )

                            const expenses = data?.expenses || []
                            const totalExpensesILS = data?.totalILS || 0

    const fetcherSuppliers = async () => {
        const result = await getSuppliers()
                            if (result.success && result.data) return result.data
                            return []
    }

                            const {data: suppliersData = [] } = useSWR<any[]>(
                            isBusiness ? ['suppliers'] : null,
                            fetcherSuppliers
                            )

    const fetcherCategories = async () => {
        const result = await getCategories('expense', budgetType)
                            if (result.success && result.data) return result.data
                            return []
    }

                            const {data: categoriesRaw, mutate: mutateCategories } = useSWR<Category[]>(
                            ['categories', 'expense', budgetType],
                            fetcherCategories,
                            {revalidateOnFocus: false }
                            )

                            const categories = Array.isArray(categoriesRaw) ? categoriesRaw : []

    // Fetch Budget Usage
    const fetcherCategoryBudgets = async () => {
        const result = await getCategoryBudgets(month, year)
                            if (result.success && result.data) return result.data
                            return []
    }

                            const {data: categoryBudgets = [] } = useSWR<CategoryBudgetUsage[]>(
                            ['categoryBudgets', month, year],
                            fetcherCategoryBudgets
                            )

                            // --- State ---

                            const [editingId, setEditingId] = useState<string | null>(null)
                            const [editData, setEditData] = useState({
                                description: '',
                            amount: '',
                            category: '',
                            currency: 'ILS',
                            date: '',
                            supplierId: '',
                            vatAmount: '',
                            isDeductible: true,
                            paymentMethod: ''
    })

                            const [submitting, setSubmitting] = useState(false)

                            const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false)
                            const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'edit', id: string } | null>(null)
                            const [isMobileOpen, setIsMobileOpen] = useState(false)

                            // Optimistic delete for instant UI feedback
                            const {deleteItem: optimisticDeleteExpense } = useOptimisticDelete<ExpenseData>(
                                ['expenses', month, year, budgetType],
        (id) => deleteExpense(id, 'SINGLE'),
                                {
                                    getOptimisticData: (current, id) => ({
                                    ...current,
                                    expenses: current.expenses.filter(expense => expense.id !== id)
            }),
                                successMessage: 'הוצאה נמחקה בהצלחה',
                                errorMessage: 'שגיאה במחיקת ההוצאה'
        }
                                )

                                async function handleDelete(exp: Expense) {
        if (exp.isRecurring) {
                                    setPendingAction({ type: 'delete', id: exp.id })
            setRecurrenceDialogOpen(true)
                                return
        }

                                if (!confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) return

                                try {
                                    await optimisticDeleteExpense(exp.id)
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } catch (error) {
                                    // Error already handled by hook
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
                                isDeductible: exp.isDeductible ?? true,
                                paymentMethod: exp.paymentMethod || ''
        })
    }

                                async function handleUpdate() {
        if (!editingId) return

        const expense = expenses.find(e => e.id === editingId)
                                if (expense && expense.isRecurring) {
                                    setPendingAction({ type: 'edit', id: editingId })
            setRecurrenceDialogOpen(true)
                                return
        }

                                await executeUpdate('SINGLE')
    }

                                async function executeUpdate(mode: 'SINGLE' | 'FUTURE') {
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
                                isDeductible: isBusiness ? editData.isDeductible : undefined,
                                paymentMethod: editData.paymentMethod || undefined
        }, mode)

                                if (result.success) {
                                    toast({ title: 'הצלחה', description: 'ההוצאה עודכנה בהצלחה' })
            setEditingId(null)
                                await mutateExpenses()
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } else {
                                    toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן הוצאה', variant: 'destructive' })
                                }
                                setSubmitting(false)
    }





                                // Pagination
                                const [currentPage, setCurrentPage] = useState(1)
                                const itemsPerPage = 5

                                useAutoPaginationCorrection(currentPage, expenses.length, itemsPerPage, setCurrentPage)
                                const totalPages = Math.ceil(expenses.length / itemsPerPage)

                                const paginatedExpenses = expenses.slice(
                                (currentPage - 1) * itemsPerPage,
                                currentPage * itemsPerPage
                                )

    const getCategoryColor = (catName: string) => {
        const trimmed = catName?.trim() || '';

                                // FORCE specific colors for known categories (override DB)
                                if (trimmed.includes('ספורט')) {
            return 'bg-green-500 text-white border-green-600'
        }
                                if (trimmed.includes('ביטוח')) {
            return 'bg-blue-500 text-white border-blue-600'
        }
                                if (trimmed.includes('אפליקציות') || trimmed.includes('מינוי')) {
            return 'bg-purple-500 text-white border-purple-600'
        }

        // For other categories, use DB color or fallbacks
        const cat = categories.find(c => c.name === catName)
                                let c = cat?.color

                                // Apply smart fallbacks if no color OR if color is gray (default)
                                const needsFallback = !c || c.includes('bg-gray') || c.includes('text-gray-700')

                                // Debug logging for problematic categories
                                if (trimmed.includes('ספורט') || trimmed.includes('ביטוח') || trimmed.includes('אפליקציות') || trimmed.includes('מינוי')) {
                                    console.log('🔍 Category Debug:', {
                                        name: catName,
                                        trimmed,
                                        foundInDB: !!cat,
                                        colorFromDB: c,
                                        needsFallback
                                    })
                                }

                                if (needsFallback) {
            // Smart fallbacks for common categories
            if (trimmed.includes('מזון') || trimmed.includes('אוכל')) {
                                    c = 'bg-red-500 text-white border-red-600'
                                } else if (trimmed.includes('תחבורה')) {
                                    c = 'bg-cyan-500 text-white border-cyan-600'
                                } else if (trimmed.includes('בילוי')) {
                                    c = 'bg-pink-500 text-white border-pink-600'
                                } else {
                                    // Default fallback for any category with gray/no color
                                    // Use theme-aware colors: red for personal, orange for business
                                    c = isBusiness
                                        ? 'bg-red-500 text-white border-red-600'
                                        : 'bg-[#e2445c] text-white border-[#d43f55]'
                                }
        }

                                if (c && c.includes('bg-') && c.includes('-100')) {
                                    c = c.replace(/bg-(\w+)-100/g, 'bg-$1-500')
                                        .replace(/text-(\w+)-700/g, 'text-white')
                                        .replace(/border-(\w+)-200/g, 'border-transparent')
                                }

        // Ensure text-white is always present for icon visibility
                                if (c && !c.includes('text-white')) {
                                    c += ' text-white'
                                }

                                return c || 'bg-gray-500 text-white border-gray-600'
    }

    // Helper to get usage for a category
    const getUsage = (categoryName: string) => {
        const budget = Array.isArray(categoryBudgets) ? categoryBudgets.find(b => b.categoryName === categoryName) : null
                                if (!budget || budget.limit === 0) return null
                                const percentage = Math.min(100, (budget.spent / budget.limit) * 100)
                                return {percentage, spent: budget.spent, limit: budget.limit, currency: budget.currency }
    }

    const handleImportExpenses = async (data: any[]) => {
        const expensesToImport = data.map(row => ({
                                    description: row.description,
                                amount: parseFloat(row.billingAmount), // Use billing amount as the final expense amount
                                category: row.branchName || 'כללי', // Use branch as category if available
                                currency: 'ILS' as 'ILS' | 'USD' | 'EUR' | 'GBP',
                                date: row.date,
                                isRecurring: false,
                                paymentMethod: row.paymentMethod || 'כרטיס אשראי'
        }))

                                const result = await importExpenses(expensesToImport, budgetType)
                                if (result.success) {
                                    await mutateExpenses()
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } else {
            throw new Error(result.error)
        }
    }

    const handleRefreshCategories = async () => {
        try {
            const res = await fetch('/api/admin/backfill-categories')
                                if (res.ok) {
                                    toast({
                                        title: 'קטגוריות עודכנו',
                                        description: 'רשימת הקטגוריות רועננה בהצלחה',
                                        variant: 'default',
                                        className: "bg-green-500 text-white border-none"
                                    })
                // Force a reload to ensure all lists are updated
                window.location.reload()
            }
        } catch (err) {
                                    console.error(err)
            toast({title: 'שגיאה', description: 'רענון קטגוריות נכשל', variant: 'destructive' })
        }
    }





    const handleDeleteAll = async () => {
        if (!confirm('האם אתה בטוח שברצונך למחוק את כל ההוצאות של אותו חודש?')) return

                                // Ideally we should have a loading state, but for now relies on toast
                                try {
            const result = await deleteAllMonthlyExpenses(month, year, budgetType)
                                if (result.success) {
                                    toast({ title: 'הצלחה', description: 'כל ההוצאות נמחקו בהצלחה' })
                await mutateExpenses()
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            } else {
                                    toast({ title: 'שגיאה', description: 'מחיקת ההוצאות נכשלה', variant: 'destructive' })
                                }
        } catch (error) {
                                    console.error(error)
            toast({title: 'שגיאה', description: 'שגיאה במחיקת נתונים', variant: 'destructive' })
        }
    }

    const handleRecurrenceConfirm = async (mode: 'SINGLE' | 'FUTURE') => {
                                    setRecurrenceDialogOpen(false)
        if (!pendingAction) return

                                if (pendingAction.type === 'delete') {
            const result = await deleteExpense(pendingAction.id, mode)
                                if (result.success) {
                                    toast({ title: 'הצלחה', description: 'הוצאה נמחקה בהצלחה' })
                await mutateExpenses()
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')
            } else {
                                    toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק הוצאה', variant: 'destructive' })
                                }
        } else if (pendingAction.type === 'edit') {
                                    await executeUpdate(mode)
                                }
                                setPendingAction(null)
    }

                                return (
                                <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-10 px-2 md:px-0">
                                    {/* Summary Card */}
                                    <div className={`monday-card border-l-4 p-5 flex flex-col justify-center gap-2 ${isBusiness ? 'border-l-orange-600' : 'border-l-[#e2445c]'}`}>
                                        <h3 className="text-sm font-medium text-gray-500">{isBusiness ? 'סך עלויות / הוצאות חודשיות' : 'סך הוצאות חודשיות'}</h3>
                                        <div className={`text-3xl font-bold ${isBusiness ? 'text-red-600' : 'text-[#e2445c]'} ${loadingExpenses ? 'animate-pulse' : ''}`}>
                                            {loadingExpenses ? '...' : formatCurrency(totalExpensesILS, '₪')}
                                        </div>
                                    </div>

                                    {/* Split View */}
                                    <div className="grid gap-4 lg:grid-cols-12">
                                        {/* Add Form */}
                                        {/* Add Form - Desktop Only */}
                                        <div className="hidden lg:block lg:col-span-5 glass-panel p-5 h-fit lg:sticky lg:top-4">
                                            <ExpenseForm
                                                categories={categories}
                                                suppliers={suppliersData}
                                                onCategoriesChange={mutateCategories}
                                            />
                                        </div>

                                        {/* Mobile FAB and Dialog */}
                                        <div className="lg:hidden">
                                            <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                                                <DialogTrigger asChild>
                                                    <FloatingActionButton onClick={() => setIsMobileOpen(true)} colorClass={isBusiness ? 'bg-red-600' : 'bg-[#e2445c]'} label="הוסף הוצאה" />
                                                </DialogTrigger>
                                                <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                                                    <DialogTitle className="sr-only">הוספת הוצאה</DialogTitle>
                                                    <ExpenseForm
                                                        categories={categories}
                                                        suppliers={suppliersData}
                                                        onCategoriesChange={mutateCategories}
                                                        isMobile={true}
                                                        onSuccess={() => setIsMobileOpen(false)}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>

                                        {/* List View */}
                                        <div className="lg:col-span-7 space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <h3 className="text-lg font-bold text-[#323338]">{isBusiness ? 'פירוט עלויות והוצאות' : 'רשימת הוצאות'}</h3>
                                                <span className="text-xs text-gray-400 font-medium">{expenses.length} שורות</span>
                                            </div>

                                            {paginatedExpenses.length === 0 ? (
                                                <div className="glass-panel text-center py-20 text-gray-400">
                                                    לא נמצאו נתונים לחודש זה
                                                </div>
                                            ) : (
                                                paginatedExpenses.map(exp => {
                                                    const usage = getUsage(exp.category)

                                                    return (
                                                        <div key={exp.id} className="glass-panel p-2.5 sm:p-4 hover:shadow-md transition-all group relative">
                                                            {editingId === exp.id ? (
                                                                <div className="space-y-4">
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <Input value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} placeholder="תיאור" />
                                                                        <Input value={editData.amount} onChange={(e) => setEditData({ ...editData, amount: e.target.value })} type="number" placeholder="סכום" />
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <select
                                                                            className="w-full p-2 border border-blue-100 bg-blue-50/50 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                                                            value={editData.category}
                                                                            onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                                                        >
                                                                            {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                                                                        </select>
                                                                        <DatePicker date={editData.date ? new Date(editData.date) : undefined} setDate={(d) => setEditData({ ...editData, date: d ? format(d, 'yyyy-MM-dd') : '' })} />
                                                                    </div>
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>ביטול</Button>
                                                                        <Button size="sm" onClick={() => handleUpdate()} className={`${isBusiness ? 'bg-red-600' : 'bg-[#e2445c] hover:bg-[#d43f55]'} text-white`}>שמור שינויים</Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                                                                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                                        <div className="shrink-0">
                                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(exp.category)} shadow-sm`}>
                                                                                {getCategoryIcon(exp.category)}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0 gap-0.5">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-bold text-[#323338] truncate text-sm sm:text-base">{exp.description}</span>
                                                                                {exp.isRecurring && (
                                                                                    <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${isBusiness ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                                                        <span className="w-1 h-1 rounded-full bg-current" />
                                                                                        קבועה
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 sm:gap-3 text-xs text-[#676879] flex-wrap">
                                                                                <span>{exp.date ? format(new Date(exp.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                                                                <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                                                <span className="truncate max-w-[80px] sm:max-w-none">{exp.category}</span>
                                                                                {exp.paymentMethod && (
                                                                                    <>
                                                                                        <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                                                        <span className="truncate max-w-[60px] sm:max-w-none">{PAYMENT_METHOD_LABELS[exp.paymentMethod] || exp.paymentMethod}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center gap-1.5 sm:gap-6 pl-1 shrink-0">
                                                                        {isBusiness && exp.vatAmount && exp.vatAmount > 0 ? (
                                                                            <div className="hidden md:flex flex-col items-end text-[10px] text-gray-400 font-bold uppercase">
                                                                                <span>מע"מ: {formatCurrency(exp.vatAmount, getCurrencySymbol(exp.currency || 'ILS'))}</span>
                                                                                <span>נקי: {formatCurrency(exp.amount - exp.vatAmount, getCurrencySymbol(exp.currency || 'ILS'))}</span>
                                                                            </div>
                                                                        ) : null}
                                                                        <div className="text-right">
                                                                            <div className={`text-base sm:text-lg font-bold ${isBusiness ? 'text-red-600' : 'text-[#e2445c]'}`}>
                                                                                {formatCurrency(exp.amount, getCurrencySymbol(exp.currency || 'ILS'))}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)} className="h-7 w-7 sm:h-8 sm:w-8 text-blue-500 hover:bg-blue-50 rounded-full"><Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" /></Button>
                                                                            <Button size="icon" variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(exp)}>
                                                                                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })
                                            )}

                                            {totalPages > 1 && (
                                                <div className="mt-4 flex justify-center direction-ltr">
                                                    <Pagination
                                                        currentPage={currentPage}
                                                        totalPages={totalPages}
                                                        onPageChange={setCurrentPage}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <RecurrenceActionDialog
                                        isOpen={recurrenceDialogOpen}
                                        onClose={() => {
                                            setRecurrenceDialogOpen(false)
                                            setPendingAction(null)
                                        }}
                                        onConfirm={handleRecurrenceConfirm}
                                        action={pendingAction?.type || 'delete'}
                                        entityName="הוצאה"
                                    />
                                </div>
                                )
}
