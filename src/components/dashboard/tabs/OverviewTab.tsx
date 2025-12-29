'use client'

import useSWR from 'swr'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, TrendingUp, Wallet, Loader2, PieChart as PieChartIcon, TrendingDown, CreditCard, Settings, Save, AlertCircle, PiggyBank, Briefcase } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getOverviewData } from '@/lib/actions/overview'
import { getHexFromClass, PRESET_COLORS } from '@/lib/constants'
import { NetWorthChart } from '../charts/NetWorthChart'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getUserSettings, updateUserSettings } from '@/lib/actions/user'
import { CategoryManager } from '@/components/dashboard/CategoryManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { swrConfig } from '@/lib/swr-config'
import { FinancialAdvisorButton } from '@/components/dashboard/FinancialAdvisorButton'
import { FeedbackButton } from '@/components/dashboard/FeedbackButton'
import { BusinessSettings } from '@/components/settings/BusinessSettings'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { CustomTooltip } from '../charts/CustomTooltip'
import { EmptyChartState } from '@/components/dashboard/charts/EmptyChartState'

interface Category {
    id: string
    name: string
    color: string | null
}

const COLORS = {
    income: '#22C55E',
    expenses: '#EF4444',
    bills: '#F59E0B',
    savings: '#3B82F6'
}

function getBoldColor(colorClass: string | null) {
    let c = colorClass || 'bg-gray-500 text-white'
    if (c.includes('bg-') && c.includes('-100')) {
        c = c.replace(/bg-(\w+)-100/g, 'bg-$1-500')
            .replace(/text-(\w+)-700/g, 'text-white')
            .replace(/border-(\w+)-200/g, 'border-$1-600')
    }
    return c
}

export function OverviewTab({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
    const { month, year, currency, budgetType } = useBudget()

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [initialBalance, setInitialBalance] = useState('')
    const [initialSavings, setInitialSavings] = useState('')
    const [showProgress, setShowProgress] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setShowProgress(true), 100)
        return () => clearTimeout(timer)
    }, [])

    const fetchOverviewData = useCallback(async () => {
        const result = await getOverviewData(month, year, budgetType)
        if (result.success && result.data) {
            return result.data
        }
        throw new Error(result.error || 'Failed to fetch overview data')
    }, [month, year, budgetType])

    const { data: overviewData, isLoading: loading, mutate: mutateOverview } = useSWR(
        ['overview', month, year, budgetType],
        fetchOverviewData,
        swrConfig
    )

    useEffect(() => {
        mutateOverview()
    }, [mutateOverview])

    useEffect(() => {
        if (overviewData?.user) {
            setInitialBalance(overviewData.user.initialBalance?.toString() || '')
            setInitialSavings(overviewData.user.initialSavings?.toString() || '')
        }
    }, [overviewData])

    const isBusiness = budgetType === 'BUSINESS'
    const current = overviewData?.current || { incomes: [], expenses: [], bills: [], debts: [], savings: [] }
    const previous = overviewData?.previous || { incomes: [], expenses: [], bills: [], debts: [], savings: [] }
    const categories = overviewData?.categories || []
    const netWorthHistory = overviewData?.netWorthHistory || []

    const totalIncome = current.incomes.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const totalExpenses = current.expenses.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const totalBills = current.bills.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const totalDebts = current.debts.reduce((sum: number, item: any) => sum + (item.monthlyPaymentILS || 0), 0)
    const totalSavingsObserved = current.savings.reduce((sum: number, item: any) => sum + (item.monthlyDepositILS || 0), 0)

    const totalOutflow = totalExpenses + totalBills + totalDebts

    // Net Worth / Balance Logic
    const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].accumulatedNetWorth : 0

    // Calculate previous month's metrics for trends
    const prevTotalIncome = previous.incomes.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const prevTotalExpenses = previous.expenses.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)

    const prevPaidBills = previous.bills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)
    const prevPaidDebts = previous.debts.reduce((sum: number, item: any) => sum + (item.monthlyPaymentILS || 0), 0)
    const prevSavingsObserved = previous.savings.reduce((sum: number, item: any) => sum + (item.monthlyDepositILS || 0), 0)
    const prevMonthlySavings = prevTotalIncome - prevTotalExpenses - prevPaidBills - prevSavingsObserved - prevPaidDebts

    // Net Worth (Business) or Bills Balance (Personal)
    const prevNetWorth = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 2].accumulatedNetWorth : 0
    // For personal "Bills Balance", let's compare current bills total vs prev bills total (or unpaid?)
    // The card displays "isBusiness ? currentNetWorth : currentBillsDisplay" (Unpaid Bills)
    const prevBillsDisplay = previous.bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)


    const incomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0
    const expensesChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0
    // If prev savings was 0 or negative (loss), calculation gets weird. If 0 -> 0.
    const savingsChange = prevMonthlySavings !== 0 ? ((monthlySavingsCalculated - prevMonthlySavings) / Math.abs(prevMonthlySavings)) * 100 : 0

    // For 4th card
    const fourthMetricCurrent = isBusiness ? currentNetWorth : currentBillsDisplay
    const fourthMetricPrev = isBusiness ? prevNetWorth : prevBillsDisplay
    const fourthMetricChange = fourthMetricPrev !== 0 ? ((fourthMetricCurrent - fourthMetricPrev) / Math.abs(fourthMetricPrev)) * 100 : 0

    const incomeVsExpenses = [
        { name: isBusiness ? 'מכירות' : 'הכנסות', value: totalIncome, color: COLORS.income },
        { name: isBusiness ? 'הוצאות' : 'הוצאות', value: totalExpenses, color: COLORS.expenses },
        { name: 'חשבונות', value: totalBills, color: COLORS.bills },
        { name: 'חובות', value: totalDebts, color: '#A855F7' }, // Purple for debts
        { name: 'חיסכון', value: totalSavingsObserved, color: COLORS.savings },
    ].filter(item => item.value > 0)

    // Helper for rendering trend
    const renderTrend = (change: number, label: string, inverse: boolean = false) => {
        if (change === 0) return <span className="text-gray-400 flex items-center gap-1 justify-end text-xs"><ArrowUp className="w-3 h-3 rotate-90" /> ללא שינוי</span>

        const isPositive = change > 0
        // If inverse (like expenses), Positive change (More expenses) is Bad (Red)
        const isGood = inverse ? !isPositive : isPositive

        const colorClass = isGood ? 'text-emerald-500' : 'text-red-500'
        const Icon = isPositive ? ArrowUp : ArrowDown

        return (
            <span className={`${colorClass} flex items-center gap-1 justify-end text-xs`}>
                <Icon className="w-3 h-3" /> {Math.abs(change).toFixed(0)}% {label}
            </span>
        )
    }

    // Monthly Savings Calculation (User Requested Formula)
    const paidBills = current.bills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)
    const paidDebts = current.debts.reduce((sum: number, item: any) => sum + (item.monthlyPaymentILS || 0), 0)

    // Formula: Income - Expenses - PaidBills - Savings(Observed) - PaidDebts
    const monthlySavingsCalculated = totalIncome - totalExpenses - paidBills - totalSavingsObserved - paidDebts

    // Data for "Expenses by Category" (True Category Breakdown)
    const expensesByCategoryMap = current.expenses.reduce((acc: any, item: any) => {
        const cat = item.category || 'שונות'
        acc[cat] = (acc[cat] || 0) + (item.amountILS || 0)
        return acc
    }, {})

    // Top 6 categories
    const expensesByCategoryData = Object.entries(expensesByCategoryMap)
        .map(([name, value]) => {
            const cat = overviewData?.categories?.find((c: any) => c.name === name)
            const color = cat ? getHexFromClass(cat.color) : '#64748B'
            return { name, value, color }
        })
        .sort((a: any, b: any) => b.value - a.value)


    const handleSaveSettings = async () => {
        const result = await updateUserSettings({
            initialBalance: parseFloat(initialBalance) || 0,
            initialSavings: parseFloat(initialSavings) || 0
        })

        if (result.success) {
            toast.success('הגדרות עודכנו בהצלחה')
            setIsSettingsOpen(false)
            mutateOverview()
        } else {
            toast.error('שגיאה בעדכון הגדרות')
        }
    }

    const currentBillsDisplay = current.bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)

    // Prepare data for AI Advisor (injecting month/year)
    const aiFinancialData = {
        ...current,
        totalIncome,
        totalExpenses,
        savingsRemainder: monthlySavingsCalculated,
        month,
        year,
        currency,
        initialBalance: overviewData?.user?.initialBalance,
        initialSavings: overviewData?.user?.initialSavings
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in-50 duration-500 font-sans" dir="rtl">

            {/* Header & Action Buttons Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">

                {/* Title - First in DOM -> Right in RTL */}
                <div className="flex items-center gap-2">
                    <PieChartIcon className="w-6 h-6 text-[#323338]" />
                    <h1 className="text-2xl font-bold text-[#323338]">סקירה כללית</h1>
                </div>

                {/* Buttons Group - Second in DOM -> Left in RTL */}
                <div className="flex gap-2 items-center w-full md:w-auto justify-end md:justify-end">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-white hover:bg-gray-50 text-gray-700"
                        title="הגדרות תצוגה"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                    <FinancialAdvisorButton financialData={aiFinancialData} />
                    <FeedbackButton />
                </div>

            </div>

            {/* Top Row: Key Metrics - ORDER for RTL (Visual Right to Left) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {/* 1. Income (Rightmost) */}
                <Card className="glass-panel border-r-4 border-r-green-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('income')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'מכירות' : 'סך הכנסות'}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#323338]">
                            {loading ? '...' : <AnimatedNumber value={totalIncome} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {renderTrend(incomeChange, 'חודש שעבר', false)}
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Expenses */}
                <Card className="glass-panel border-r-4 border-r-red-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('expenses')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'הוצאות תפעול' : 'סך הוצאות'}</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#323338]">
                            {loading ? '...' : <AnimatedNumber value={totalExpenses} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {renderTrend(expensesChange, 'חודש שעבר', true)}
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Month Savings (Calculated) */}
                <Card className="glass-panel border-r-4 border-r-blue-500 shadow-sm transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'רווח נקי' : 'חיסכון חודשי'}</CardTitle>
                        <PiggyBank className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#323338]">
                            {loading ? '...' : <AnimatedNumber value={monthlySavingsCalculated} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {renderTrend(savingsChange, 'חודש שעבר', false)}
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Equity / Bills (Leftmost) */}
                <Card className="glass-panel border-r-4 border-r-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('bills')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'הון עצמי' : 'יתרת חשבונות'}</CardTitle>
                        <Wallet className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#323338]">
                            {/* If Business -> Net Worth. If Personal -> Bills to Pay (Unpaid) */}
                            {loading ? '...' : <AnimatedNumber value={isBusiness ? currentNetWorth : currentBillsDisplay} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {renderTrend(fourthMetricChange, 'חודש שעבר', isBusiness ? false : true)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">

                {/* 2. Distribution Pie Chart (Visually Right in RTL) */}
                <Card className="glass-panel shadow-sm min-h-[400px]">
                    <CardHeader>
                        <CardTitle>התפלגות תקציב</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {incomeVsExpenses.length > 0 ? (
                            <div className="h-[300px] w-full relative" style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={incomeVsExpenses}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80} // Large inner radius
                                            outerRadius={110} // Large outer radius
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                            style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.15))' }}
                                            animationBegin={0}
                                            animationDuration={1500}
                                            animationEasing="ease-out"
                                        >
                                            {incomeVsExpenses.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0];
                                                    return (
                                                        <div className="glass-panel px-3 py-2 border border-white/50 shadow-xl rounded-xl backdrop-blur-xl text-right">
                                                            <p className="font-bold text-[#323338] text-sm mb-0.5">{data.name}</p>
                                                            <p className="font-mono text-gray-600 font-medium text-xs">
                                                                ₪{Number(data.value).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={8} // Small dots
                                            className="scrollbar-hide"
                                            formatter={(value) => <span className="text-black mx-1 text-xs font-medium whitespace-nowrap">{value}</span>}
                                            wrapperStyle={{
                                                paddingTop: '10px',
                                                display: 'flex',
                                                width: '100%',
                                                justifyContent: 'center',
                                                flexWrap: 'nowrap',
                                                gap: '5px',
                                                overflowX: 'auto'
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                        ) : (
                            <EmptyChartState title="התפלגות תקציב" />
                        )}
                    </CardContent>
                </Card>

                {/* 1. Expenses By Category Chart (Visually Left in RTL) */}
                <Card className="glass-panel shadow-sm min-h-[400px]">
                    <CardHeader>
                        <CardTitle>הוצאות לפי קטגוריה</CardTitle>
                    </CardHeader>
                    <CardContent className="px-2 pb-6">
                        {expensesByCategoryData.length > 0 ? (
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={expensesByCategoryData} barSize={32} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={false} padding={{ left: 50, right: 10 }} />
                                        <YAxis axisLine={false} tickLine={false} width={45} tickFormatter={(val) => `₪${val}`} tick={{ fill: '#6b7280', fontSize: 11 }} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="glass-panel px-3 py-2 border border-white/50 shadow-xl rounded-xl backdrop-blur-xl text-right">
                                                            <p className="font-bold text-[#323338] text-sm mb-0.5">{label}</p>
                                                            <p className="font-mono text-gray-600 font-medium text-xs">
                                                                ₪{Number(payload[0].value).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1500} animationBegin={0}>
                                            {expensesByCategoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>

                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <EmptyChartState title="הוצאות לפי קטגוריה" />
                        )}
                    </CardContent>
                </Card >

                {/* 4. Net Worth (Green Area Chart) (Visually Right in RTL) */}
                <Card className="glass-panel shadow-sm min-h-[350px]">
                    <CardHeader>
                        <CardTitle>הון עצמי</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] -ml-4">
                        {netWorthHistory && netWorthHistory.length > 0 ? (
                            <NetWorthChart data={netWorthHistory} loading={loading} />
                        ) : (
                            <div className="pl-4 h-full">
                                <EmptyChartState title="הון עצמי" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Budget Status (Progress Bars) (Visually Left in RTL) */}
                <Card className="glass-panel shadow-sm col-span-1 md:col-span-1 min-h-[350px]">
                    <CardHeader>
                        <CardTitle>מצב תקציב חודשי</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-4">
                        {/* Expenses (Red) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">הוצאות שוטפות</span>
                                <span className="font-medium text-gray-900">{formatCurrency(totalExpenses)}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-red-500 rounded-full transition-all duration-1000 ease-out ${showProgress ? '' : 'w-0'}`} style={{ width: showProgress ? `${Math.min((totalExpenses / (totalIncome || 1)) * 100, 100)}%` : '0%' }} />
                            </div>
                        </div>

                        {/* Bills (Orange) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">חשבונות (שולם)</span>
                                <span className="font-medium text-gray-900">{formatCurrency(paidBills)}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out ${showProgress ? '' : 'w-0'}`} style={{ width: showProgress ? `${Math.min((paidBills / (totalBills || 1)) * 100, 100)}%` : '0%' }} />
                            </div>
                        </div>

                        {/* Debts (Purple) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">חובות ששולמו</span>
                                <span className="font-medium text-gray-900">{formatCurrency(paidDebts)}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-purple-500 rounded-full transition-all duration-1000 ease-out ${showProgress ? '' : 'w-0'}`} style={{ width: showProgress ? `${Math.min((paidDebts / (totalDebts || 1)) * 100, 100)}%` : '0%' }} />
                            </div>
                        </div>

                        {/* Savings (Blue) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">חיסכון והפקדות</span>
                                <span className="font-medium text-gray-900">{formatCurrency(totalSavingsObserved)}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out ${showProgress ? '' : 'w-0'}`} style={{ width: showProgress ? `${Math.min((totalSavingsObserved / (totalIncome * 0.2 || 1)) * 100, 100)}%` : '0%' }} />
                            </div>
                        </div>
                    </CardContent>
                </Card >
            </div >

            {/* Settings Dialog */}
            < Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} >
                <DialogContent dir="rtl" className="sm:max-w-[425px]">
                    <DialogHeader className="text-right sm:text-right">
                        <DialogTitle className="text-right">הגדרות תצוגה</DialogTitle>
                    </DialogHeader>
                    {/* Settings Form Content */}
                    <div className="space-y-4 py-4 text-right">
                        <div className="space-y-2">
                            <Label className="text-right block">יתרה התחלתית בעו"ש</Label>
                            <Input
                                value={initialBalance}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value)
                                    if (val < 0) return
                                    setInitialBalance(e.target.value)
                                }}
                                type="number"
                                min="0"
                                dir="ltr"
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block">יתרה התחלתית בחסכונות</Label>
                            <Input
                                value={initialSavings}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value)
                                    if (val < 0) return
                                    setInitialSavings(e.target.value)
                                }}
                                type="number"
                                min="0"
                                dir="ltr"
                                className="text-right"
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-end gap-2">
                        <Button onClick={handleSaveSettings} className="bg-emerald-500 hover:bg-emerald-600">שמור הגדרות</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    )
}
