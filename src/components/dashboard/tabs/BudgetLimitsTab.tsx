'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Umbrella, Shield, Dumbbell, Sparkles, Info, Save, RefreshCw, Loader2, Pencil, Trash2, ShoppingCart, Utensils, Bus, Heart, GraduationCap, Popcorn, Fuel, Car, Phone, Smartphone, Briefcase, Zap, Home, Plane } from 'lucide-react'
import { formatCurrency, cn } from '@/lib/utils'
import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { getCategoryBudgets, updateCategoryLimit, getSmartRecommendations, CategoryBudgetUsage } from '@/lib/actions/budget-limits'

import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Pagination } from '@/components/ui/Pagination'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const getCategoryIcon = (name: string) => {
    switch (name) {
        case 'מזון': return <Utensils className="h-6 w-6" />
        case 'תחבורה': return <Bus className="h-6 w-6" />
        case 'בילויים': return <Popcorn className="h-6 w-6" />
        case 'קניות': return <ShoppingCart className="h-6 w-6" />
        case 'בריאות': return <Heart className="h-6 w-6" />
        case 'חינוך': return <GraduationCap className="h-6 w-6" />
        case 'דלק': return <Fuel className="h-6 w-6" />
        case 'חנייה': return <Car className="h-6 w-6" />
        case 'תקשורת': return <Phone className="h-6 w-6" />
        case 'אפליקציות ומינויים': return <Smartphone className="h-6 w-6" />
        case 'משכורת': return <Briefcase className="h-6 w-6" />
        case 'חשמל': return <Zap className="h-6 w-6" />
        case 'שכירות': return <Home className="h-6 w-6" />
        case 'חופשה': return <Plane className="h-6 w-6" />
        case 'ביטוחים': return <Shield className="h-6 w-6" />
        case 'ספורט': return <Dumbbell className="h-6 w-6" />
        default: return <span className="text-xl font-bold">{name.charAt(0)}</span>
    }
}

function BudgetEditPopover({
    initialLimit,
    onCommit
}: {
    initialLimit: number,
    onCommit: (val: number) => void
}) {
    const [open, setOpen] = useState(false)
    const [val, setVal] = useState(String(initialLimit))

    const handleSave = () => {
        const num = parseFloat(val)
        if (!isNaN(num)) {
            onCommit(num)
            setOpen(false)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600">
                    <Pencil className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" dir="rtl">
                <div className="space-y-2">
                    <div className="font-medium text-xs text-center">ערוך תקציב</div>
                    <div className="flex gap-1">
                        <Input
                            type="number"
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave()
                            }}
                        />
                        <Button size="sm" className="h-8 w-8 p-0" onClick={handleSave}>
                            <Save className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function BudgetLimitsTab() {
    const { month, year } = useBudget()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null) // categoryId currently saving
    const [activeDefaults, setActiveDefaults] = useState(false)
    const [budgets, setBudgets] = useState<CategoryBudgetUsage[]>([])

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 5
    const [avgIncome, setAvgIncome] = useState(0)

    // Load Data
    useEffect(() => {
        loadBudgets()
    }, [month, year])

    async function loadBudgets() {
        setLoading(true)
        const res = await getCategoryBudgets(month, year)
        if (res.success && res.data) {
            setBudgets(res.data)
            if (res.avgIncome) setAvgIncome(res.avgIncome)
        } else {
            toast({ title: 'שגיאה', description: 'לא ניתן לטעון את נתוני התקציב', variant: 'destructive' })
        }
        setLoading(false)
    }

    async function handleLimitChange(categoryId: string, newValue: number[]) {
        const value = newValue[0]
        // Optimistic UI update
        setBudgets(prev => prev.map(b => b.categoryId === categoryId ? { ...b, limit: value } : b))
    }

    async function handleLimitCommit(categoryId: string, newValue: number[]) {
        const value = newValue[0]
        setSaving(categoryId)
        const res = await updateCategoryLimit(month, year, categoryId, value)
        if (!res.success) {
            toast({ title: 'שגיאה', description: 'שמירת התקציב נכשלה', variant: 'destructive' })
            loadBudgets() // Revert
        }
        setSaving(null)
    }

    async function handleSmartRecommendations() {
        setActiveDefaults(true)
        const res = await getSmartRecommendations(month, year)
        if (res.success && res.data) {
            const recommended = res.data
            setBudgets(prev => prev.map(b => ({
                ...b,
                limit: recommended[b.categoryId] || b.limit // Change only if recommendation exists
            })))

            toast({
                title: 'המלצות חכמות יושמו',
                description: 'התקציב עודכן לפי ממוצע ההוצאות שלך ב-3 החודשים האחרונים. באפשרותך לשנות ולשמור.'
            })
        }
        setActiveDefaults(false)
    }

    // Calculate total
    const totalLimit = budgets.reduce((acc, b) => acc + b.limit, 0)
    const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0)
    const totalProgress = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0

    const [newlyAddedIds, setNewlyAddedIds] = useState<string[]>([])

    // Logic for displayed budgets: Limit > 0 OR in newlyAddedIds
    const activeBudgets = budgets.filter(b => b.limit > 0 || newlyAddedIds.includes(b.categoryId))
    const availableCategories = budgets.filter(b => !activeBudgets.some(ab => ab.categoryId === b.categoryId))

    // Pagination Logic
    const totalPages = Math.ceil(activeBudgets.length / itemsPerPage)
    const paginatedBudgets = activeBudgets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)



    return (
        <div className="space-y-6 pb-20" dir="rtl">
            {/* Header / Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">תקציב חודשי כולל</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalLimit)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">נוצל בפועל</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${totalSpent > totalLimit && totalLimit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(totalSpent)}
                        </div>
                        <Progress value={Math.min(totalProgress, 100)} className={`h-2 mt-2 rotate-180 ${totalProgress > 100 ? 'bg-red-100' : ''}`} />
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalProgress.toFixed(0)}% מנוצל
                        </p>
                    </CardContent>
                </Card>
                <Card className="flex flex-col justify-center items-center p-0 bg-transparent border-none shadow-none h-full">
                    <Button
                        onClick={handleSmartRecommendations}
                        disabled={activeDefaults}
                        className="relative w-full h-full min-h-[140px] p-0 overflow-hidden border-0 rounded-2xl bg-gradient-to-br from-yellow-50/50 to-orange-50/50 hover:from-yellow-100/50 hover:to-orange-100/50 shadow-sm hover:shadow-md transition-all duration-300 group ring-1 ring-yellow-100 hover:ring-yellow-200"
                        variant="ghost"
                    >
                        {/* Decorative background sparkles */}
                        <Sparkles className="absolute -top-6 -left-6 w-32 h-32 text-yellow-200/20 rotate-12 transition-transform duration-700 group-hover:rotate-45" />
                        <Sparkles className="absolute -bottom-8 -right-8 w-24 h-24 text-orange-200/10 -rotate-12 transition-transform duration-700 group-hover:-rotate-45" />

                        <div className="relative flex flex-col items-center justify-center gap-3 w-full h-full py-4 z-10">
                            <div className="p-3 bg-white rounded-full shadow-sm ring-1 ring-yellow-100 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-md">
                                {activeDefaults ? <RefreshCw className="h-6 w-6 text-yellow-600 animate-spin" /> : <Sparkles className="h-6 w-6 text-yellow-500 fill-yellow-200" />}
                            </div>
                            <div className="flex flex-col items-center text-center gap-1 px-2">
                                <span className="text-base font-bold text-gray-800 group-hover:text-yellow-800 transition-colors">
                                    {activeDefaults ? 'מעדכן תקציב...' : 'המלץ לי על תקציב'}
                                </span>
                                <span className="text-[11px] text-gray-500 font-normal max-w-[180px] leading-tight group-hover:text-gray-600">
                                    ה-AI ינתח את ההיסטוריה שלך ויציע תקציב חכם
                                </span>
                            </div>
                        </div>
                    </Button>
                </Card>
            </div>

            {/* Add Budget Section */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800">תקציבים פעילים</h3>

                <div className="w-64">
                    <Select
                        onValueChange={(val) => {
                            setNewlyAddedIds(prev => [...prev, val])
                        }}
                    >
                        <SelectTrigger className="w-full h-10 bg-white border-gray-200 text-right direction-rtl">
                            <SelectValue placeholder="הוסף תקציב לקטגוריה" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]" dir="rtl">
                            {availableCategories.length === 0 ? (
                                <div className="p-2 text-sm text-gray-500 text-center">אין קטגוריות נוספות</div>
                            ) : (
                                availableCategories.map(cat => (
                                    <SelectItem key={cat.categoryId} value={cat.categoryId}>
                                        {cat.categoryName}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-3">
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    paginatedBudgets.map(budget => {
                        const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0
                        const isOverBudget = percentage > 100

                        return (
                            <div key={budget.categoryId} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                    {getCategoryIcon(budget.categoryName)}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="font-semibold text-gray-900 text-lg">{budget.categoryName}</div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium text-gray-500 font-mono flex items-center gap-1" dir="ltr">
                                                <span>₪{budget.spent.toLocaleString()}</span>
                                                <span>/</span>
                                                <span>₪{budget.limit.toLocaleString()}</span>
                                            </div>

                                            {/* Edit Button */}
                                            <BudgetEditPopover
                                                initialLimit={budget.limit}
                                                onCommit={(val) => handleLimitCommit(budget.categoryId, [val])}
                                            />

                                            {/* Delete Button */}
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                                                            onClick={() => {
                                                                if (confirm('האם לבטל את הגבלת התקציב לקטגוריה זו?')) {
                                                                    handleLimitCommit(budget.categoryId, [0])
                                                                    setNewlyAddedIds(prev => prev.filter(id => id !== budget.categoryId))
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>מחק תקציב</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>

                                        </div>
                                    </div>

                                    <Slider
                                        value={[budget.limit]}
                                        max={Math.max(5000, avgIncome || 0)}
                                        step={50}
                                        onValueChange={(val) => handleLimitChange(budget.categoryId, val)}
                                        onValueCommit={(val) => handleLimitCommit(budget.categoryId, val)}
                                        className="py-2 cursor-pointer"
                                        dir="rtl"
                                    />

                                    <div className="relative pt-1">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className={cn(
                                                "font-medium",
                                                isOverBudget ? "text-red-600" : "text-gray-600"
                                            )}>
                                                {Math.round(percentage)}% נוצל
                                            </span>
                                            <span className="text-gray-400">
                                                נותרו {formatCurrency(Math.max(0, budget.limit - budget.spent))}
                                            </span>
                                        </div>
                                        <Progress
                                            value={Math.min(100, percentage)}
                                            className={cn("h-2 rotate-180", isOverBudget ? "bg-red-100" : "bg-gray-100")}
                                            indicatorClassName={cn(
                                                isOverBudget ? "bg-red-500" :
                                                    percentage > 85 ? "bg-orange-500" : "bg-blue-600"
                                            )}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    }))}
                {activeBudgets.length === 0 && (
                    <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                        <p>אין תקציבים פעילים לחודש זה.</p>
                        <p className="text-sm mt-1">בחר קטגוריה מהתפריט למעלה כדי להגדיר לה תקציב.</p>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="mt-4 flex justify-center">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
