'use client'

import { useState, useEffect } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { useSearchParams } from 'next/navigation'

import {
    Check, Loader2, Pencil, Plus, Trash2, TrendingDown, X,
    ShoppingCart, Utensils, Bus, Heart, GraduationCap, Popcorn,
    Fuel, Car, Phone, Smartphone, Briefcase, Zap, Home, Plane, RefreshCw,
    Umbrella, Dumbbell, Shield, ArrowUpDown, Info
} from 'lucide-react'
import { ExpensesTutorial } from '@/components/dashboard/tutorial/ExpensesTutorial'
import { format } from 'date-fns'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { ExpenseForm } from '@/components/dashboard/forms/ExpenseForm'
import { DatePicker } from '@/components/ui/date-picker'
import { Pagination } from '@/components/ui/Pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, cn, formatNumberWithCommas } from '@/lib/utils'
import { PRESET_COLORS } from '@/lib/constants'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { deleteExpense, getExpenses, updateExpense, importExpenses, toggleExpenseStatus } from '@/lib/actions/expense'
import { getSuppliers } from '@/lib/actions/suppliers'
import { useOptimisticDelete } from '@/hooks/useOptimisticMutation'
import { getCategories } from '@/lib/actions/category'
import { getCategoryBudgets, CategoryBudgetUsage } from '@/lib/actions/budget-limits'
import { RecurrenceActionDialog } from '../dialogs/RecurrenceActionDialog'

import { useConfirm } from '@/hooks/useConfirm'
import { useDemo } from '@/contexts/DemoContext'


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
    paymentDate?: Date | null
    paidBy?: string | null
}

interface ExpenseData {
    expenses: Expense[]
    totalILS: number
    totalNetILS?: number
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
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()

    const confirm = useConfirm()
    const { isDemo, data: demoData, interceptAction } = useDemo()
    const [showTutorial, setShowTutorial] = useState(false)

    const isBusiness = budgetType === 'BUSINESS'

    // --- Data Fetching ---

    const fetcherExpenses = async () => {
        const result = await getExpenses(month, year, budgetType)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch expenses')
    }

    const { data: realData, isLoading: loadingExpenses, mutate: mutateExpenses } = useSWR<ExpenseData>(
        isDemo ? null : ['expenses', month, year, budgetType],
        fetcherExpenses,
        { revalidateOnFocus: false }
    )

    const expenses = isDemo ? demoData.expenses as any[] : (realData?.expenses || [])
    const totalExpensesILS = isDemo ? demoData.overview.totalExpenses : (realData?.totalILS || 0)
    const totalNetExpensesILS = isDemo ? demoData.overview.totalExpenses : (realData?.totalNetILS || 0)

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

    const { data: categoriesRaw, mutate: mutateCategories } = useSWR<Category[]>(
        ['categories', 'expense', budgetType],
        fetcherCategories,
        { revalidateOnFocus: false }
    )

    const categories = Array.isArray(categoriesRaw) ? categoriesRaw : []

    // Fetch Budget Usage
    const fetcherCategoryBudgets = async () => {
        const result = await getCategoryBudgets(month, year)
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categoryBudgets = [] } = useSWR<CategoryBudgetUsage[]>(
        ['categoryBudgets', month, year],
        fetcherCategoryBudgets
    )

    // Fetch Clients for Dropdown
    const { data: clientsList = [] } = useSWR(
        ['clients-list'],
        async () => {
            const { getClientsList } = await import('@/lib/actions/clients')
            return await getClientsList()
        }
    )

    // --- State ---

    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [isEditMobileOpen, setIsEditMobileOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const [recurrenceDialogOpen, setRecurrenceDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'edit', id: string } | null>(null)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    // Deep Linking Support: Auto-open dialog if params exist
    const searchParams = useSearchParams()

    useEffect(() => {
        const shouldAutoOpen = searchParams.get('autoOpen') === 'true' || searchParams.has('amount') || searchParams.has('date')
        if (shouldAutoOpen && !isMobileOpen) {
            setIsMobileOpen(true)
        }
    }, [searchParams])

    // Optimistic delete for instant UI feedback
    const { deleteItem: optimisticDeleteExpense } = useOptimisticDelete<ExpenseData>(
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
        if (isDemo) { interceptAction(); return; }

        if (exp.isRecurring) {
            setPendingAction({ type: 'delete', id: exp.id })
            setRecurrenceDialogOpen(true)
            return
        }

        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?', 'מחיקת הוצאה')
        if (!confirmed) return

        try {
            await optimisticDeleteExpense(exp.id)
            globalMutate(key => Array.isArray(key) && key[0] === 'overview')
        } catch (error) {
            // Error already handled by hook
        }
    }

    function handleEdit(expense: any) {
        setEditingExpense(expense)
        setIsEditMobileOpen(true)
    }

    // Removed handleUpdate and executeUpdate as they are now handled by ExpenseForm


    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5

    // Sorting State
    const [sortMethod, setSortMethod] = useState<'DATE' | 'AMOUNT' | 'DESCRIPTION' | 'CATEGORY' | 'PAYMENT'>('DATE')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

    const sortExpenses = (items: Expense[]) => {
        return [...items].sort((a, b) => {
            let diff = 0
            switch (sortMethod) {
                case 'DATE':
                    const dateA = a.date ? new Date(a.date).getTime() : 0
                    const dateB = b.date ? new Date(b.date).getTime() : 0
                    diff = dateA - dateB
                    break
                case 'AMOUNT':
                    diff = a.amount - b.amount
                    break
                case 'DESCRIPTION':
                    diff = (a.description || '').localeCompare(b.description || '', 'he')
                    break
                case 'CATEGORY':
                    diff = (a.category || '').localeCompare(b.category || '', 'he')
                    break
                case 'PAYMENT':
                    const payA = a.paymentMethod || ''
                    const payB = b.paymentMethod || ''
                    diff = payA.localeCompare(payB, 'he')
                    break
                default:
                    diff = 0
            }
            return sortDirection === 'asc' ? diff : -diff
        })
    }

    const sortedExpenses = sortExpenses(expenses)

    useAutoPaginationCorrection(currentPage, sortedExpenses.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(sortedExpenses.length / itemsPerPage)

    const paginatedExpenses = sortedExpenses.slice(
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
        return { percentage, spent: budget.spent, limit: budget.limit, currency: budget.currency }
    }

    const handleImportExpenses = async (data: any[]) => {
        const expensesToImport = data.map(row => ({
            description: row.description,
            amount: parseFloat(row.billingAmount),
            category: row.branchName || 'כללי',
            currency: 'ILS' as 'ILS' | 'USD' | 'EUR' | 'GBP',
            date: row.date,
            isRecurring: false,
            paymentMethod: row.paymentMethod || 'כרטיס אשראי',
            vatAmount: row.vatAmount,
            amountBeforeVat: row.amountBeforeVat,
            vatRate: row.vatRate,
            isDeductible: row.isDeductible,
            deductibleRate: row.deductibleRate
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
            toast({ title: 'שגיאה', description: 'רענון קטגוריות נכשל', variant: 'destructive' })
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
            // Re-open edit dialog if confirmed
            if (pendingAction.id) {
                const expense = expenses.find(e => e.id === pendingAction.id)
                if (expense) {
                    setEditingExpense(expense)
                    setIsEditMobileOpen(true)
                }
            }
        }
        setPendingAction(null)
    }

    return (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-10 px-2 md:px-0" dir="rtl">
            <div className="flex justify-between items-start">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#e2445c] to-[#ff5d75] bg-clip-text text-transparent mb-4">
                    {isBusiness ? 'הוצאות ותשלומים' : 'הוצאות שוטפות'}
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                    onClick={() => setShowTutorial(true)}
                    title="הדרכה"
                >
                    <Info className="h-5 w-5" />
                </Button>
            </div>

            {/* Summary Card */}
            <div className={`monday-card border-r-4 p-3 md:p-5 flex flex-col justify-center gap-2 ${isBusiness ? 'border-r-orange-600' : 'border-r-[#e2445c]'} dark:bg-slate-800`} id="expenses-stats-cards">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{isBusiness ? 'סך עלויות / הוצאות חודשיות (נקי)' : 'סך הוצאות חודשיות'}</h3>
                <div className={`text-3xl font-bold ${isBusiness ? 'text-red-600' : 'text-[#e2445c]'} ${loadingExpenses ? 'animate-pulse' : ''}`}>
                    {loadingExpenses ? '...' : formatCurrency(isBusiness ? totalNetExpensesILS : totalExpensesILS, '₪')}
                </div>
            </div>

            {/* Split View */}
            <div className="grid gap-4 lg:grid-cols-12">
                {/* Add Form */}
                {/* Add Form - Desktop Only */}
                <div className="hidden lg:block lg:col-span-5 glass-panel p-5 h-fit lg:sticky lg:top-4" id="expenses-add-section">
                    <ExpenseForm
                        categories={categories}
                        suppliers={suppliersData}
                        clients={clientsList}
                        onCategoriesChange={mutateCategories}
                    />
                </div>

                {/* Mobile FAB and Dialog */}
                <div className="lg:hidden">
                    <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <DialogTrigger asChild>
                            <FloatingActionButton id="expenses-add-fab" onClick={() => {
                                if (isDemo) { interceptAction(); return; }
                                setIsMobileOpen(true)
                            }} colorClass={isBusiness ? 'bg-red-600' : 'bg-[#e2445c]'} label="הוסף הוצאה" />
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                            <DialogTitle className="sr-only">הוספת הוצאה</DialogTitle>
                            <ExpenseForm
                                categories={categories}
                                suppliers={suppliersData}
                                clients={clientsList}
                                onCategoriesChange={mutateCategories}
                                isMobile={true}
                                onSuccess={() => setIsMobileOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Edit Dialog */}
                <Dialog open={isEditMobileOpen} onOpenChange={setIsEditMobileOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                        <DialogTitle className="text-right">עריכת הוצאה</DialogTitle>
                        {editingExpense && (
                            <ExpenseForm
                                categories={categories}
                                suppliers={suppliersData}
                                clients={clientsList}
                                onCategoriesChange={mutateCategories}
                                isMobile={true}
                                onSuccess={() => setIsEditMobileOpen(false)}
                                initialData={editingExpense}
                            />
                        )}
                    </DialogContent>
                </Dialog>

                {/* List View */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between px-1 flex-wrap gap-2">
                        <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">{isBusiness ? 'פירוט עלויות והוצאות' : 'רשימת הוצאות'}</h3>

                        <div className="flex items-center gap-2" id="expenses-controls">
                            {/* Sort Controls */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:inline">מיון:</span>
                                <Select value={sortMethod} onValueChange={(val: any) => setSortMethod(val)}>
                                    <SelectTrigger className="h-8 text-xs w-[100px] bg-white/80 border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-200">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="DATE">תאריך</SelectItem>
                                        <SelectItem value="AMOUNT">סכום</SelectItem>
                                        <SelectItem value="DESCRIPTION">תיאור</SelectItem>
                                        <SelectItem value="CATEGORY">קטגוריה</SelectItem>
                                        <SelectItem value="PAYMENT">אמצעי תשלום</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="h-8 w-8 p-0 border border-gray-200 bg-white/80 hover:bg-white dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700"
                                    title={sortDirection === 'asc' ? 'סדר עולה' : 'סדר יורד'}
                                >
                                    <ArrowUpDown className={`w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                                </Button>
                            </div>

                            <span className="text-xs text-gray-400 font-medium">{expenses.length} שורות</span>
                        </div>
                    </div>

                    <div id="expenses-list-container" className="space-y-3">
                        {paginatedExpenses.length === 0 ? (
                            <div className="glass-panel text-center py-20 text-gray-400">
                                לא נמצאו נתונים לחודש זה
                            </div>
                        ) : (
                            paginatedExpenses.map(exp => {
                                const usage = getUsage(exp.category)

                                return (
                                    <div key={exp.id} className="glass-panel p-3 sm:p-4 hover:shadow-md transition-all group relative">
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">

                                            {/* Icon Section - Spans 1 column on desktop, Auto on mobile */}
                                            <div className="sm:col-span-1 flex justify-start">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(exp.category)} shadow-sm shrink-0`}>
                                                    {getCategoryIcon(exp.category)}
                                                </div>
                                            </div>

                                            {/* Main Content Section - Spans 6 columns */}
                                            <div className="sm:col-span-6 flex flex-col gap-1.5 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-[#323338] dark:text-gray-100 text-sm sm:text-base truncate max-w-full">
                                                        {exp.description}
                                                    </span>
                                                    {exp.isRecurring && (
                                                        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 ${isBusiness ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                            <span className="w-1 h-1 rounded-full bg-current" />
                                                            קבועה
                                                        </div>
                                                    )}
                                                    {isBusiness && exp.isDeductible && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 bg-blue-50 text-blue-600 border border-blue-100">
                                                            <span className="w-1 h-1 rounded-full bg-current" />
                                                            הוצאה מוכרת
                                                        </div>
                                                    )}
                                                    {exp.paidBy && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium shrink-0 bg-purple-50 text-purple-600 border border-purple-100">
                                                            <span className="w-1 h-1 rounded-full bg-current" />
                                                            {exp.paidBy}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-xs text-[#676879] dark:text-gray-400">
                                                    <span>{exp.date ? format(new Date(exp.date), 'dd/MM/yyyy') : 'ללא תאריך'}</span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className="truncate">{exp.category}</span>
                                                    {exp.paymentMethod && (
                                                        <>
                                                            <span className="text-gray-300">•</span>
                                                            <span className="truncate">{PAYMENT_METHOD_LABELS[exp.paymentMethod] || exp.paymentMethod}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Financials Section - Spans 5 columns */}
                                            <div className="sm:col-span-5 flex flex-col items-end gap-1 mt-2 sm:mt-0 border-t sm:border-0 pt-2 sm:pt-0 border-gray-100 dark:border-gray-800">
                                                {/* Amount Display */}
                                                {isBusiness && exp.isDeductible ? (
                                                    <div className="flex flex-col items-end w-full">
                                                        <div className="flex flex-row-reverse sm:flex-row items-baseline gap-2 w-full justify-between sm:justify-end">
                                                            <span className="text-base sm:text-lg font-bold text-red-600 whitespace-nowrap">
                                                                {formatNumberWithCommas(exp.amount)} {getCurrencySymbol(exp.currency || 'ILS')}
                                                            </span>
                                                            {/* Mobile Breakdown moved here or kept stacked? Keeping stacked for clean look */}
                                                        </div>

                                                        {/* VAT Breakdown - Always visible but smaller */}
                                                        <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                                                            <span>לפני מע"מ: {formatNumberWithCommas((exp.amount - (exp.vatAmount || 0)))}</span>
                                                            <span>מע"מ: {formatNumberWithCommas(exp.vatAmount || 0)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-base sm:text-lg font-bold text-[#e2445c] whitespace-nowrap">
                                                        {formatNumberWithCommas(exp.amount)} {getCurrencySymbol(exp.currency || 'ILS')}
                                                    </div>
                                                )}

                                                {/* Action Bar */}
                                                <div className="flex items-center justify-end gap-2 w-full mt-1">
                                                    {/* Status Badge */}
                                                    {(exp as any).clientId && (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation()
                                                                const newStatus = exp.paymentDate ? 'PENDING' : 'PAID'
                                                                const res = await toggleExpenseStatus(exp.id, newStatus)
                                                                if (res.success) {
                                                                    mutateExpenses()
                                                                    toast({ title: newStatus === 'PAID' ? 'סומן כשולם' : 'סומן כבהמתנה', variant: 'default' })
                                                                }
                                                            }}
                                                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${!exp.paymentDate
                                                                ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-100'
                                                                : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                                }`}
                                                        >
                                                            {!exp.paymentDate ? 'בהמתנה לתשלום' : 'שולם'}
                                                        </button>
                                                    )}

                                                    {/* Edit/Delete Buttons */}
                                                    <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(exp)} className="h-7 w-7 text-blue-500 hover:bg-blue-50 rounded-full">
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => handleDelete(exp)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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

            <ExpensesTutorial
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />
        </div>
    )
}
