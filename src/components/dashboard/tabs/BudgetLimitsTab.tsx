'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Sparkles, Info, Save, RefreshCw } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { getCategoryBudgets, updateCategoryLimit, getSmartRecommendations, CategoryBudgetUsage } from '@/lib/actions/budget-limits'

import { Pagination } from '@/components/ui/Pagination'

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

    // Load Data
    useEffect(() => {
        loadBudgets()
    }, [month, year])

    async function loadBudgets() {
        setLoading(true)
        const res = await getCategoryBudgets(month, year)
        if (res.success && res.data) {
            setBudgets(res.data)
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

    // Pagination Logic
    const totalPages = Math.ceil(budgets.length / itemsPerPage)
    const paginatedBudgets = budgets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    if (loading) return <div className="p-10 text-center">טוען נתוני תקציב...</div>

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
                        <Progress value={Math.min(totalProgress, 100)} className={`h-2 mt-2 ${totalProgress > 100 ? 'bg-red-100' : ''}`} />
                        <p className="text-xs text-muted-foreground mt-1">
                            {totalProgress.toFixed(0)}% מנוצל
                        </p>
                    </CardContent>
                </Card>
                <Card className="flex flex-col justify-center items-center p-6 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                    <Button
                        onClick={handleSmartRecommendations}
                        disabled={activeDefaults}
                        className="w-full h-full bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm gap-2"
                        variant="outline"
                    >
                        {activeDefaults ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 text-indigo-500" />}
                        <div className="flex flex-col items-start gap-1">
                            <span className="font-bold">המלץ לי על תקציב</span>
                            <span className="text-[10px] text-muted-foreground font-normal">מבוסס על היסטוריית ההוצאות שלך</span>
                        </div>
                    </Button>
                </Card>
            </div>

            <div className="grid gap-3">
                {paginatedBudgets.map((budget) => {
                    const progress = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0
                    const isOverLimit = budget.spent > budget.limit && budget.limit > 0
                    const maxSlider = Math.max(5000, budget.limit * 2, budget.spent * 1.5)

                    return (
                        <Card key={budget.categoryId} className={`transition-all ${isOverLimit ? 'border-red-200 bg-red-50/30' : ''}`}>
                            <CardContent className="p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-base text-gray-800">{budget.categoryName}</div>
                                        {isOverLimit && (
                                            <Badge variant="destructive" className="text-[10px] h-4 px-1">חריגה!</Badge>
                                        )}
                                        {saving === budget.categoryId && (
                                            <span className="text-[10px] text-yellow-500 animate-pulse">שומר...</span>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-xs text-gray-500">
                                            נוצל: <span className={`font-bold ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(budget.spent)}</span>
                                            {' / '}
                                            <span className="text-gray-400">{formatCurrency(budget.limit)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Slider
                                        value={[budget.limit]}
                                        min={0}
                                        max={maxSlider}
                                        step={50}
                                        onValueChange={(val) => handleLimitChange(budget.categoryId, val)}
                                        onValueCommit={(val) => handleLimitCommit(budget.categoryId, val)}
                                        className="py-1 cursor-grab active:cursor-grabbing [&>.relative>.bg-primary]:bg-yellow-500 [&>.relative>.border-primary]:border-yellow-500" // Custom yellow styling via utility classes if current slider supports specific targeting, or generic override
                                    />
                                    {/* Note: ShadCN slider usually uses 'bg-primary'. To force yellow we might need explicit class overrides or inline styles if standard props don't reach. 
                                        Assuming standard slider structure:
                                        We can try to wrap or apply global styles, but let's try direct class override if permitted.
                                    */}

                                    <div className="flex items-center gap-2">
                                        <Progress
                                            value={Math.min(progress, 100)}
                                            className={`h-1.5 flex-1 [&>div]:${isOverLimit ? 'bg-red-500' : 'bg-yellow-500'}`}
                                        />
                                        <span className={`text-[10px] w-8 text-left font-mono ${isOverLimit ? 'text-red-600 font-bold' : ''}`}>
                                            {progress.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {budgets.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    לא נמצאו קטגוריות להגדרת תקציב.
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
    )
}
