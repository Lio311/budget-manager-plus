'use client'

import useSWR from 'swr'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, TrendingUp, Wallet, Loader2, PieChart as PieChartIcon, TrendingDown, CreditCard, Settings, Save, AlertCircle, PiggyBank, Briefcase, Share2, Info } from 'lucide-react'
import { OverviewTutorial } from '@/components/dashboard/tutorial/OverviewTutorial'
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
import { DataExportSettings } from '@/components/settings/DataExportSettings'
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
    const [isTutorialOpen, setIsTutorialOpen] = useState(false)
    const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false)

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
        .reduce((sum: number, item: any) => sum + (isBusiness ? (item.amountBeforeVatILS || 0) : (item.amountILS || 0)), 0)
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

    // Tax Rate Logic
    const taxRate = (overviewData?.user as any)?.taxRate || 0
    const incomeAfterTaxes = isBusiness ? totalIncome * (1 - (taxRate / 100)) : totalIncome

    const monthlySavingsCalculated = incomeAfterTaxes - totalExpenses - paidBills - totalSavingsObserved - paidDebts
    const currentBillsDisplay = current.bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)

    const incomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0
    const expensesChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0
    // If prev savings was 0 or negative (loss), calculation gets weird. If 0 -> 0.
    const savingsChange = prevMonthlySavings !== 0 ? ((monthlySavingsCalculated - prevMonthlySavings) / Math.abs(prevMonthlySavings)) * 100 : 0

    // For 4th card
    const fourthMetricCurrent = isBusiness ? currentNetWorth : currentBillsDisplay
    const fourthMetricPrev = isBusiness ? prevNetWorth : prevBillsDisplay
    const fourthMetricChange = fourthMetricPrev !== 0 ? ((fourthMetricCurrent - fourthMetricPrev) / Math.abs(fourthMetricPrev)) * 100 : 0

    const incomeVsExpenses = (isBusiness ? [
        { name: 'הכנסות', value: totalIncome, color: '#22c55e' }, // Green
        { name: 'הוצאות', value: totalExpenses, color: '#ef4444' } // Red
    ] : [
        { name: 'הכנסות', value: totalIncome, color: COLORS.income },
        { name: 'הוצאות', value: totalExpenses, color: COLORS.expenses },
        { name: 'חשבונות', value: totalBills, color: COLORS.bills },
        { name: 'חובות', value: totalDebts, color: '#A855F7' },
        { name: 'חיסכון', value: totalSavingsObserved, color: COLORS.savings },
    ]).filter(item => item.value > 0)

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
    const totalWorkHours = current.incomes.reduce((sum: number, item: any) => sum + (parseFloat(item.workTime) || 0), 0)
    const hourlyWage = totalWorkHours > 0 ? salesBeforeVat / totalWorkHours : 0

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
            <OverviewTutorial
                isOpen={isTutorialOpen}
                onClose={() => setIsTutorialOpen(false)}
                isBusiness={isBusiness}
            />

            {/* Header & Action Buttons Row */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">

                {/* Title - First in DOM -> Right in RTL */}
                <div className="flex items-center gap-2">
                    <PieChartIcon className="w-6 h-6 text-[#323338] dark:text-gray-100" />
                    <h1 className="text-2xl font-bold text-[#323338] dark:text-gray-100">סקירה כללית</h1>
                </div>

                {/* Buttons Group - Second in DOM -> Left in RTL */}
                <div className="flex gap-2 items-center w-full md:w-auto justify-end md:justify-end">


                    <Button
                        id="overview-settings-btn"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                            if (isDemo) { interceptAction(); return; }
                            if (isBusiness) setActiveSettingsTab('details')
                            setIsSettingsOpen(true)
                        }}
                        className="relative overflow-hidden group border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        title="הגדרות"
                    >
                        <Settings className="w-4 h-4" />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/40 dark:to-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                    </Button>

                    {!isBusiness && (
                        <Button
                            id="overview-automations-btn"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                if (isDemo) { interceptAction(); return; }
                                setIsIntegrationsOpen(true)
                            }}
                            className="relative overflow-hidden group border-input bg-background hover:bg-accent hover:text-accent-foreground md:hidden"
                            title="אוטומציות (iPhone Shortcuts)"
                        >
                            <svg className="w-4 h-4 fill-current text-[#323338] dark:text-gray-100" viewBox="0 0 384 512" xmlns="http://www.w3.org/2000/svg">
                                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 49 126.7 83.6 126.1 27.2-.5 38-19.1 82.9-19.1s54.9 19.1 83.6 18.9c35.5-.3 67.2-76.5 87.8-109.2-25.2-13.8-49.9-46.7-47.6-102.7zM245.8 48.9c30.1-39.1 24.8-82.5 24.4-86.4-29.2 2.8-55.5 17.5-74 40.6-16.7 20.9-24.6 57-19.8 86.1 32 3.8 54.4-23.9 69.4-40.3z" />
                            </svg>
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-stone-50 dark:from-gray-950/40 dark:to-stone-950/40 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                        </Button>
                    )}

                    <div id="overview-ai-btn">
                        <FinancialAdvisorButton
                            financialData={aiFinancialData}
                            isOpen={isAiAdvisorOpen}
                            onOpenChange={setIsAiAdvisorOpen}
                        />
                    </div>

                    <FeedbackButton />

                    {!isBusiness && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                if (isDemo) { interceptAction(); return; }
                                setIsReferralOpen(true)
                            }}
                            className="relative overflow-hidden group border-input bg-background hover:bg-accent hover:text-accent-foreground"
                            title="חבר מביא חבר"
                        >
                            <Share2
                                className={`w-4 h-4 transition-colors duration-300 ${(overviewData?.user as any)?.referralProgramActive
                                    ? 'text-green-600'
                                    : 'text-[#323338] dark:text-gray-100'
                                    }`}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                        onClick={() => setIsTutorialOpen(true)}
                        title="הדרכה"
                    >
                        <Info className="h-5 w-5" />
                    </Button>
                </div>

            </div>

            {/* Top Row: Key Metrics - ORDER for RTL (Visual Right to Left) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {/* 1. Income (Rightmost) */}
                <Card id="overview-card-income" className="glass-panel border-r-4 border-r-green-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('income')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">{isBusiness ? 'מכירות' : 'סך הכנסות'}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6">
                        <div className="text-xl md:text-2xl font-bold text-[#323338] dark:text-gray-100">
                            {loading ? '...' : <AnimatedNumber value={totalIncome} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {renderTrend(incomeChange, 'חודש שעבר', false)}
                        </p>
                    </CardContent>
                </Card>

                {/* 2. Expenses */}
                <Card id="overview-card-expenses" className="glass-panel border-r-4 border-r-red-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('expenses')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">{isBusiness ? 'הוצאות תפעול' : 'סך הוצאות'}</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6">
                        <div className="text-xl md:text-2xl font-bold text-[#323338] dark:text-gray-100">
                            {loading ? '...' : <AnimatedNumber value={totalExpenses} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {renderTrend(expensesChange, 'חודש שעבר', true)}
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Month Savings (Calculated) */}
                <Card id="overview-card-profit" className="glass-panel border-r-4 border-r-blue-500 shadow-sm transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">{isBusiness ? 'רווח נקי' : 'יתרה חודשית'}</CardTitle>
                        <PiggyBank className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6">
                        <div className="text-xl md:text-2xl font-bold text-[#323338] dark:text-gray-100">
                            {loading ? '...' : <AnimatedNumber value={monthlySavingsCalculated} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {renderTrend(savingsChange, 'חודש שעבר', false)}
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Equity / Bills (Leftmost) */}
                <Card id="overview-card-balance" className="glass-panel border-r-4 border-r-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => {
                    if (isBusiness) {
                        setActiveSettingsTab('financials')
                        setIsSettingsOpen(true)
                    }
                    else onNavigateToTab?.('bills')
                }}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground whitespace-nowrap">{isBusiness ? 'שווי העסק' : 'יתרת חשבונות'}</CardTitle>
                        <Wallet className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent className="p-3 md:p-6">
                        <div className="text-xl md:text-2xl font-bold text-[#323338] dark:text-gray-100">
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
                <Card id="overview-graph-budget" className="glass-panel shadow-sm min-h-[400px]">
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
                                            animationDuration={800}
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
                                                            <p className="font-bold text-[#323338] dark:text-gray-100 text-sm mb-0.5">{data.name}</p>
                                                            <p className="font-mono text-gray-600 dark:text-white font-medium text-xs">
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
                                            formatter={(value) => <span className="text-black dark:text-gray-100 mx-1 text-xs font-medium whitespace-nowrap">{value}</span>}
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
                <Card id="overview-graph-expenses" className="glass-panel shadow-sm min-h-[400px]">
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
                                        <YAxis axisLine={false} tickLine={false} width={45} tickFormatter={(val) => `₪${val}`} tick={{ fill: '#ffffff', fontSize: 11 }} domain={[0, 'auto']} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="glass-panel px-3 py-2 border border-white/50 dark:border-slate-700/50 shadow-xl rounded-xl backdrop-blur-xl text-right dark:bg-slate-800/90">
                                                            <p className="font-bold text-[#323338] dark:text-gray-100 text-sm mb-0.5">{label}</p>
                                                            <p className="font-mono text-gray-600 dark:text-white font-medium text-xs">
                                                                ₪{Number(payload[0].value).toLocaleString()}
                                                            </p>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={800} animationBegin={0}>
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
                {/* 4. Net Worth (Green Area Chart) (Visually Right in RTL) */}
                <Card
                    id="overview-graph-networth"
                    className="glass-panel shadow-sm min-h-[350px] cursor-pointer hover:shadow-md transition-all"
                    onClick={() => {
                        setActiveSettingsTab('financials')
                        setIsSettingsOpen(true)
                    }}
                >
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle>{isBusiness ? 'שווי העסק' : 'הון עצמי'}</CardTitle>
                        {isBusiness && <Settings className="h-4 w-4 text-muted-foreground opacity-70" />}
                    </CardHeader>
                    <CardContent className="h-[300px] -ml-4">
                        {netWorthHistory && netWorthHistory.length > 0 && (parseFloat(initialBalance) > 0 || parseFloat(initialSavings) > 0) ? (
                            <NetWorthChart data={netWorthHistory} loading={loading} />
                        ) : (
                            <div className="pl-4 h-full">
                                <EmptyChartState
                                    title={isBusiness ? 'הגדרת שווי העסק' : 'הגדרת הון עצמי'}
                                    subtitle="לחץ כאן כדי להגדיר יתרה התחלתית ולהציג נתונים"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* 3. Budget Status (Progress Bars) (Visually Left in RTL) */}
                <Card id="overview-graph-status" className="glass-panel shadow-sm col-span-1 md:col-span-1 min-h-[350px]">
                    <CardHeader>
                        <CardTitle>מצב תקציב חודשי</CardTitle>
                    </CardHeader>
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
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {isBusiness ? 'הכנסות החודש' : 'הכנסות החודש'}
                                </p>
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
                                    {isBusiness ? 'מכירות ללא מע"מ' : 'הלוואות ששולמו'}
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

                        {/* Hourly Wage Bar (Blue) - Business Only, if hours exist */}
                        {isBusiness && totalWorkHours > 0 && (
                            <div className="space-y-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 p-1 rounded-md transition-colors">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        שכר שעתי (ממוצע)
                                    </span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">
                                        {formatCurrency(hourlyWage).replace('₪', '')} <span className="text-sm">₪ / שעה</span>
                                    </span>
                                </div>
                                <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: showProgress ? '100%' : '0%' }}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 text-right">
                                    מחושב ע"פ {totalWorkHours} שעות עבודה שדווחו החודש
                                </p>
                            </div>
                        )}

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

            {/* Settings Dialog */}
            < Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} >
                {
                    isBusiness ? (
                        <DialogContent dir="rtl" className="w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-xl" >
                            <DialogHeader className="text-right">
                                <DialogTitle className="text-right">הגדרות עסק</DialogTitle>
                            </DialogHeader>
                            <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="details">פרטי העסק</TabsTrigger>
                                    <TabsTrigger value="financials">הגדרות כספיות</TabsTrigger>
                                    <TabsTrigger value="export">ייצוא נתונים</TabsTrigger>
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
                                <TabsContent value="export" className="mt-4">
                                    <DataExportSettings />
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
