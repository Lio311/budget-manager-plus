'use client'

import useSWR from 'swr'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, TrendingUp, Wallet, Loader2, PieChart as PieChartIcon, TrendingDown, CreditCard, Settings, Save, AlertCircle, PiggyBank, Briefcase, Share2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getOverviewData } from '@/lib/actions/overview'
import { getHexFromClass, PRESET_COLORS } from '@/lib/constants'
import { getCurrentBudget, updateBudgetBalances } from '@/lib/actions/budget'
import { NetWorthChart } from '../charts/NetWorthChart'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useDemo } from '@/contexts/DemoContext'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { getUserSettings, updateUserSettings } from '@/lib/actions/user'
import { CategoryManager } from '@/components/dashboard/CategoryManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { swrConfig } from '@/lib/swr-config'
import { FinancialAdvisorButton } from '@/components/dashboard/FinancialAdvisorButton'
import { FeedbackButton } from '@/components/dashboard/FeedbackButton'
import { ReferralDashboard } from '@/components/dashboard/referral/ReferralDashboard'
import { BusinessSettings } from '@/components/settings/BusinessSettings'
import { IntegrationsSettings } from '@/components/settings/IntegrationsSettings'
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
    const router = useRouter()
    const isBusiness = budgetType === 'BUSINESS'
    const { isDemo, data: demoData, interceptAction } = useDemo()

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [initialBalance, setInitialBalance] = useState('')
    const [initialSavings, setInitialSavings] = useState('')
    const [showProgress, setShowProgress] = useState(false)
    const [activeSettingsTab, setActiveSettingsTab] = useState('details')
    const [isReferralOpen, setIsReferralOpen] = useState(false)
    const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false)

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

    const { data: realOverviewData, isLoading: loading, mutate: mutateOverview } = useSWR(
        isDemo ? null : ['overview', month, year, budgetType],
        fetchOverviewData,
        swrConfig
    )

    // Merge logic: use demo data if isDemo, else real data
    const overviewData = isDemo ? {
        current: {
            incomes: [{ amountILS: demoData.overview.totalIncome, vatAmountILS: 0 }],
            expenses: [{ amountILS: demoData.overview.totalExpenses, vatAmountILS: 0 }],
            bills: [{ amountILS: demoData.overview.upcomingBills, isPaid: false }],
            debts: [{ monthlyPaymentILS: demoData.overview.debts }],
            savings: [{ monthlyDepositILS: demoData.overview.savings }]
        },
        previous: { incomes: [], expenses: [], bills: [], debts: [], savings: [] },
        categories: [],
        netWorthHistory: [],
        user: {
            initialBalance: 0,
            initialSavings: 0,
            businessInitialBalance: 0,
            businessInitialSavings: 0,
            monthlyBalanceOverride: null,
            monthlySavingsOverride: null
        }
    } : realOverviewData

    useEffect(() => {
        mutateOverview()
    }, [mutateOverview])

    useEffect(() => {
        if (overviewData?.user) {
            if (budgetType === 'BUSINESS') {
                const overrideBalance = (overviewData.user as any).monthlyBalanceOverride
                const overrideSavings = (overviewData.user as any).monthlySavingsOverride

                setInitialBalance(overrideBalance !== undefined && overrideBalance !== null
                    ? overrideBalance.toString()
                    : (overviewData.user as any).businessInitialBalance?.toString() || '')

                setInitialSavings(overrideSavings !== undefined && overrideSavings !== null
                    ? overrideSavings.toString()
                    : (overviewData.user as any).businessInitialSavings?.toString() || '')
            } else {
                setInitialBalance(overviewData.user.initialBalance?.toString() || '')
                setInitialSavings(overviewData.user.initialSavings?.toString() || '')
            }
        }
    }, [overviewData, budgetType])

    const current = overviewData?.current || { incomes: [], expenses: [], bills: [], debts: [], savings: [] }
    const previous = overviewData?.previous || { incomes: [], expenses: [], bills: [], debts: [], savings: [] }
    const categories = overviewData?.categories || []
    const netWorthHistory = overviewData?.netWorthHistory || []

    const totalIncome = current.incomes
        .filter((item: any) => item.status !== 'PENDING' && item.status !== 'UNPAID')
        .reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    // For expenses: If it's a business expense and deductible, we deduct Amount BEFORE VAT from profit (since VAT is reclaimed).
    // If it's not deductible (or personal), the full amount is the expense.
    const totalExpenses = current.expenses.reduce((sum: number, item: any) => {
        let expenseValue = item.amountILS || 0

        // Check for business logic
        if (isBusiness && item.isDeductible && item.amountBeforeVatILS !== undefined) {
            // Use the pre-converted ILS value from server action
            expenseValue = item.amountBeforeVatILS
        }

        return sum + expenseValue
    }, 0)
    const totalBills = current.bills.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const totalDebts = current.debts.reduce((sum: number, item: any) => sum + (item.monthlyPaymentILS || 0), 0)
    const totalSavingsObserved = current.savings.reduce((sum: number, item: any) => sum + (item.monthlyDepositILS || 0), 0)

    const totalOutflow = totalExpenses + totalBills + totalDebts

    // VAT Calculations
    const totalVatCollected = current.incomes.reduce((sum: number, item: any) => sum + (item.vatAmountILS || 0), 0)
    // Fix: Only sum VAT for expenses that are deductible (recognized for tax/VAT)
    const totalVatPaid = current.expenses.reduce((sum: number, item: any) => {
        if (isBusiness && item.isDeductible === false) return sum
        return sum + (item.vatAmountILS || 0)
    }, 0)

    // Net Worth / Balance Logic
    const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].accumulatedNetWorth : 0

    // Calculate previous month's metrics for trends
    const prevTotalIncome = previous.incomes.reduce((sum: number, item: any) => sum + (isBusiness ? item.amountBeforeVatILS || 0 : item.amountILS || 0), 0)
    const prevTotalExpenses = previous.expenses.reduce((sum: number, item: any) => {
        let expenseValue = item.amountILS || 0
        if (isBusiness && item.isDeductible && item.amountBeforeVatILS !== undefined) {
            expenseValue = item.amountBeforeVatILS
        }
        return sum + expenseValue
    }, 0)

    const prevPaidBills = previous.bills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)
    const prevPaidDebts = previous.debts.reduce((sum: number, item: any) => sum + (item.monthlyPaymentILS || 0), 0)
    const prevSavingsObserved = previous.savings.reduce((sum: number, item: any) => sum + (item.monthlyDepositILS || 0), 0)
    const prevMonthlySavings = prevTotalIncome - prevTotalExpenses - prevPaidBills - prevSavingsObserved - prevPaidDebts

    // Net Worth (Business) or Bills Balance (Personal)
    const prevNetWorth = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 2].accumulatedNetWorth : 0
    // For personal "Bills Balance", let's compare current bills total vs prev bills total (or unpaid?)
    // The card displays "isBusiness ? currentNetWorth : currentBillsDisplay" (Unpaid Bills)
    const prevBillsDisplay = previous.bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)

    // Current Month Calculations (Moved up for dependencies)
    const paidBills = current.bills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)
    const paidDebts = current.debts.filter((d: any) => d.isPaid).reduce((sum: number, item: any) => sum + (item.monthlyPaymentILS || 0), 0)
    const monthlySavingsCalculated = totalIncome - totalExpenses - paidBills - totalSavingsObserved - paidDebts
    const currentBillsDisplay = current.bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)

    const incomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0
    const expensesChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0
    // If prev savings was 0 or negative (loss), calculation gets weird. If 0 -> 0.
    const savingsChange = prevMonthlySavings !== 0 ? ((monthlySavingsCalculated - prevMonthlySavings) / Math.abs(prevMonthlySavings)) * 100 : 0

    // For 4th card
    const fourthMetricCurrent = isBusiness ? currentNetWorth : currentBillsDisplay
    const fourthMetricPrev = isBusiness ? prevNetWorth : prevBillsDisplay
    const fourthMetricChange = fourthMetricPrev !== 0 ? ((fourthMetricCurrent - fourthMetricPrev) / Math.abs(fourthMetricPrev)) * 100 : 0

    const incomeVsExpenses = isBusiness ? [
        { name: 'מכירות', value: totalIncome, color: '#22c55e' }, // Green
        { name: 'הוצאות', value: totalExpenses, color: '#ef4444' } // Red
    ] : [
        { name: 'הכנסות', value: totalIncome, color: COLORS.income },
        { name: 'הוצאות', value: totalExpenses, color: COLORS.expenses },
        { name: 'חשבונות', value: totalBills, color: COLORS.bills },
        { name: 'חובות', value: totalDebts, color: '#A855F7' },
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
        let result;

        if (isBusiness) {
            // For business, we now save to the monthly budget
            result = await updateBudgetBalances(month, year, 'BUSINESS', {
                initialBalance: parseFloat(initialBalance) || 0,
                initialSavings: parseFloat(initialSavings) || 0
            })
        } else {
            // For personal, keep global (or change to monthly too?)
            // User requested "Business Equity" specifically, so let's stick to business for monthly for now.
            const payload = {
                initialBalance: parseFloat(initialBalance) || 0,
                initialSavings: parseFloat(initialSavings) || 0
            }
            result = await updateUserSettings(payload)
        }

        if (result.success) {
            toast.success('הגדרות עודכנו בהצלחה')
            setIsSettingsOpen(false)
            mutateOverview()
        } else {
            toast.error('שגיאה בעדכון הגדרות')
        }
    }

    // Prepare data for AI Advisor (injecting month/year)
    const aiFinancialData = {
        ...current,
        totalIncome,
        totalExpenses,
        savingsRemainder: monthlySavingsCalculated,
        month,
        year,
        currency,
        initialBalance: isBusiness ? (overviewData?.user as any)?.businessInitialBalance : overviewData?.user?.initialBalance,
        initialSavings: isBusiness ? (overviewData?.user as any)?.businessInitialSavings : overviewData?.user?.initialSavings
    }

    const newClientsCount = (overviewData as any)?.businessStats?.newClientsCount || 0
    const salesBeforeVat = current.incomes.reduce((sum: number, item: any) => sum + (item.amountBeforeVatILS || 0), 0)

    // Helper to calculate bar width correctly
    // If business metric (no target): 0 -> 0%, >0 -> 100% (as "Active")
    // If personal metric (has target/total): Calculate %
    const calculateWidth = (value: number, total: number | null, isBusinessMetric: boolean) => {
        if (!showProgress) return '0%'

        if (isBusinessMetric) {
            return value > 0 ? '100%' : '0%'
        }

        // Personal logic
        return `${Math.min((value / (total || 1)) * 100, 100)}%`
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in-50 duration-500 font-sans px-2 md:px-0" dir="rtl">
            {/* Header ... */}

            {/* ... (Skipping to CardContent) ... */}

            <CardContent className="space-y-6 pt-4">
                {/* Expenses (Red) - Clickable */}
                <div
                    className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1 rounded-md transition-colors"
                    onClick={() => router.push('?tab=expenses')}
                >
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">הוצאות שוטפות</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(totalExpenses)}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-red-500 rounded-full transition-all duration-1000 ease-out ${showProgress ? '' : 'w-0'}`} style={{ width: showProgress ? `${Math.min((totalExpenses / (totalIncome || 1)) * 100, 100)}%` : '0%' }} />
                    </div>
                </div>

                {/* Bills / New Clients (Orange) */}
                <div
                    className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1 rounded-md transition-colors"
                    onClick={() => isBusiness ? router.push('?tab=clients') : router.push('?tab=bills')}
                >
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {isBusiness ? 'לקוחות חדשים' : 'חשבונות ששולמו'}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {isBusiness ? newClientsCount : formatCurrency(paidBills)}
                        </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-orange-500 rounded-full transition-all duration-1000 ease-out ${showProgress ? '' : 'w-0'}`}
                            style={{
                                width: calculateWidth(
                                    isBusiness ? newClientsCount : paidBills,
                                    isBusiness ? null : totalBills,
                                    isBusiness
                                )
                            }}
                        />
                    </div>
                </div>

                {/* Debts / Sales Before VAT (Purple/Green) */}
                <div
                    className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1 rounded-md transition-colors"
                    onClick={() => !isBusiness ? router.push('?tab=debts') : router.push('?tab=income')}
                >
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                            {isBusiness ? 'מכירות לפני מע"מ' : 'הלוואות ששולמו'}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {isBusiness
                                ? formatCurrency(salesBeforeVat)
                                : formatCurrency(paidDebts)
                            }
                        </span>
                    </div>
                    <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${isBusiness ? 'bg-green-500' : 'bg-purple-500'} rounded-full transition-all duration-1000 ease-out ${showProgress ? '' : 'w-0'}`}
                            style={{
                                width: calculateWidth(
                                    isBusiness ? salesBeforeVat : paidDebts,
                                    isBusiness ? null : totalDebts,
                                    isBusiness
                                )
                            }}
                        />
                    </div>
                </div>

                {/* Savings (Blue) - Hidden for Business */}
                {!isBusiness && (
                    <div
                        className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1 rounded-md transition-colors"
                        onClick={() => router.push('?tab=savings')}
                    >
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-gray-700 dark:text-gray-300">חיסכון והפקדות</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(totalSavingsObserved)}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out ${showProgress ? '' : 'w-0'}`} style={{ width: showProgress ? `${Math.min((totalSavingsObserved / (totalIncome * 0.2 || 1)) * 100, 100)}%` : '0%' }} />
                        </div>
                    </div>
                )}
            </CardContent>

            {isBusiness && (
                <div className="px-6 pb-6 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        {/* VAT Refund (Green) */}
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">החזר מע"מ צפוי</div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(totalVatPaid)}
                            </div>
                        </div>

                        {/* VAT Pay (Red) */}
                        <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">מע"מ לתשלום</div>
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(totalVatCollected)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Card >



            </div >

        {/* Settings Dialog */ }
        < Dialog open = { isSettingsOpen } onOpenChange = { setIsSettingsOpen } >
        {
            isBusiness?(
                    <DialogContent dir = "rtl" className = "w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl" >
                        <DialogHeader className="text-right">
                            <DialogTitle className="text-right">הגדרות עסק</DialogTitle>
                        </DialogHeader>
                        <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="details">פרטי העסק</TabsTrigger>
                                <TabsTrigger value="financials">הגדרות כספיות</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details" className="mt-4">
                                <BusinessSettings onSuccess={() => setIsSettingsOpen(false)} />
                            </TabsContent>
                            <TabsContent value="financials" className="mt-4 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base text-right">הגדרות יתרה</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-right block">יתרה התחלתית (עו"ש)</Label>
                                            <FormattedNumberInput
                                                value={initialBalance}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value)
                                                    if (val < 0) return
                                                    setInitialBalance(e.target.value)
                                                }}
                                                min="0"
                                                dir="ltr"
                                                className="text-right"
                                            />
                                            <p className="text-xs text-muted-foreground text-right">היתרה בבנק לפני תחילת השימוש במערכת</p>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-right block">יתרה התחלתית</Label>
                                            <FormattedNumberInput
                                                value={initialSavings}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value)
                                                    if (val < 0) return
                                                    setInitialSavings(e.target.value)
                                                }}
                                                min="0"
                                                dir="ltr"
                                                className="text-right"
                                            />
                                            <p className="text-xs text-muted-foreground text-right">יתרת החסכונות/השקעות קודמת</p>
                                        </div>
                                        <Button onClick={handleSaveSettings} className="w-full bg-emerald-500 hover:bg-emerald-600 mt-4">
                                            שמור הגדרות כספיות
                                        </Button>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                ) : (
        <DialogContent dir="rtl" className="sm:max-w-[425px]">
            <DialogHeader className="text-right sm:text-right">
                <DialogTitle className="text-right">הגדרות</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="display" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="display">תצוגה</TabsTrigger>
                </TabsList>

                <TabsContent value="display">
                    {/* Settings Form Content */}
                    <div className="space-y-4 py-4 text-right">
                        <div className="space-y-2">
                            <Label className="text-right block">יתרה התחלתית בעו"ש</Label>
                            <FormattedNumberInput
                                value={initialBalance}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value)
                                    if (val < 0) return
                                    setInitialBalance(e.target.value)
                                }}
                                min="0"
                                dir="ltr"
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block">יתרה התחלתית בחסכונות</Label>
                            <FormattedNumberInput
                                value={initialSavings}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value)
                                    if (val < 0) return
                                    setInitialSavings(e.target.value)
                                }}
                                min="0"
                                dir="ltr"
                                className="text-right"
                            />
                        </div>
                        <div className="pt-4">
                            <Button onClick={handleSaveSettings} className="w-full bg-emerald-500 hover:bg-emerald-600">שמור הגדרות</Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </DialogContent>
    )
}
            </Dialog >

            <Dialog open={isIntegrationsOpen} onOpenChange={setIsIntegrationsOpen}>
                <DialogContent dir="rtl" className="w-[95vw] sm:w-full sm:max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                    <DialogHeader className="text-right">
                        <DialogTitle className="text-right">אוטומציות (iPhone Shortcuts)</DialogTitle>
                    </DialogHeader>
                    <IntegrationsSettings />
                </DialogContent>
            </Dialog>

            <ReferralDashboard open={isReferralOpen} onOpenChange={setIsReferralOpen} />
        </div >
    )
}
