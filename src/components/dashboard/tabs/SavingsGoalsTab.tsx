'use client'

import useSWR from 'swr'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Target, TrendingUp, DollarSign, Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useBudget } from '@/contexts/BudgetContext'
import { getSavingsGoals, SavingsGoalsData } from '@/lib/actions/savings-goals'
import { format } from 'date-fns'
import { getCurrencySymbol } from '@/lib/currency'

export function SavingsGoalsTab() {
    const { month, year, budgetType } = useBudget()

    // Fetch savings goals data
    const { data: goalsData, isLoading } = useSWR<SavingsGoalsData>(
        ['savingsGoals', month, year, budgetType],
        async () => {
            const result = await getSavingsGoals(month, year, budgetType)
            if (result.success && result.data) return result.data
            throw new Error(result.error || 'Failed to fetch savings goals')
        },
        { revalidateOnFocus: false }
    )

    const goals = goalsData?.goals || []
    const stats = goalsData?.stats || {
        totalGoals: 0,
        totalSavedILS: 0,
        totalTargetILS: 0,
        overallProgress: 0
    }

    return (
        <div className="space-y-6 w-full pb-10 px-2 md:px-0" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl">
                    <Target className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">יעדי חיסכון</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">עקוב אחר ההתקדמות שלך לעבר יעדי החיסכון</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-cyan-500 dark:border-l-cyan-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            מספר יעדים
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold text-cyan-600 dark:text-cyan-400 ${isLoading ? 'animate-pulse' : ''}`}>
                            {isLoading ? '...' : stats.totalGoals}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-cyan-500 dark:border-l-cyan-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            סך נחסך
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold text-cyan-600 dark:text-cyan-400 break-all ${isLoading ? 'animate-pulse' : ''}`}>
                            {isLoading ? '...' : formatCurrency(stats.totalSavedILS, '₪')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-cyan-500 dark:border-l-cyan-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            יעד כולל
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold text-cyan-600 dark:text-cyan-400 break-all ${isLoading ? 'animate-pulse' : ''}`}>
                            {isLoading ? '...' : formatCurrency(stats.totalTargetILS, '₪')}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-cyan-500 dark:border-l-cyan-400">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            התקדמות כללית
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold text-cyan-600 dark:text-cyan-400 ${isLoading ? 'animate-pulse' : ''}`}>
                            {isLoading ? '...' : `${Math.round(stats.overallProgress)}%`}
                        </div>
                        <Progress
                            value={stats.overallProgress}
                            className="h-2 mt-2 rotate-180 bg-gray-100 dark:bg-slate-700"
                            indicatorClassName="bg-cyan-500 dark:bg-cyan-400"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Goals List */}
            <div className="glass-panel p-5">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 px-2">יעדי החיסכון שלי</h3>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-400">טוען...</div>
                    ) : goals.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl">
                            <Target className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 dark:text-gray-500">אין יעדי חיסכון מוגדרים</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                הגדר יעדים בלשונית "חסכונות" כדי לעקוב אחר ההתקדמות
                            </p>
                        </div>
                    ) : (
                        goals.map((goal) => {
                            const isComplete = goal.progress >= 100
                            const progressColor = isComplete
                                ? 'bg-green-500 dark:bg-green-400'
                                : 'bg-cyan-500 dark:bg-cyan-400'

                            return (
                                <div
                                    key={goal.id}
                                    className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className="shrink-0">
                                                <span className="monday-pill bg-cyan-500 text-white opacity-90 text-xs sm:text-sm">
                                                    {goal.category}
                                                </span>
                                            </div>
                                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                                                        {goal.name}
                                                    </span>
                                                    {isComplete && (
                                                        <Award className="h-5 w-5 text-green-500 dark:text-green-400" />
                                                    )}
                                                </div>
                                                {goal.notes && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        יעד: {goal.notes}
                                                    </p>
                                                )}
                                                {goal.targetDate && (
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                        תאריך יעד: {format(new Date(goal.targetDate), 'dd/MM/yyyy')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left shrink-0">
                                            <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                                                {Math.round(goal.progress)}%
                                            </div>
                                            {goal.monthlyDeposit && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatCurrency(goal.monthlyDeposit, getCurrencySymbol(goal.currency))}/חודש
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Progress
                                            value={goal.progress}
                                            className="h-3 rotate-180 bg-gray-100 dark:bg-slate-700"
                                            indicatorClassName={progressColor}
                                        />
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">
                                                {formatCurrency(goal.currentAmount, getCurrencySymbol(goal.currency))} / {formatCurrency(goal.targetAmount, getCurrencySymbol(goal.currency))}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                נותרו {formatCurrency(goal.remainingAmount, getCurrencySymbol(goal.currency))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
