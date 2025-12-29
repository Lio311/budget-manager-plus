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

    const prevTotalIncome = previous.incomes.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const prevTotalExpenses = previous.expenses.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)

    const incomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0
    const expensesChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0

    const incomeVsExpenses = [
        { name: isBusiness ? 'מכירות' : 'הכנסות', value: totalIncome, color: COLORS.income },
        { name: isBusiness ? 'הוצאות' : 'הוצאות', value: totalExpenses, color: COLORS.expenses },
        { name: 'חשבונות', value: totalBills, color: COLORS.bills },
        { name: 'חובות', value: totalDebts, color: '#A855F7' }, // Purple for debts
        { name: 'חיסכון', value: totalSavingsObserved, color: COLORS.savings },
    ].filter(item => item.value > 0)

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

    return (
        <div className="space-y-6 pb-20 animate-in fade-in-50 duration-500 font-sans" dir="rtl">

            {/* Header & Action Buttons Row */}
            <div className="flex flex-col-reverse md:flex-row justify-between items-start md:items-center gap-4 mb-6">

                {/* Visual Title (Desktop) - Matches screenshot "Scan Overview" */}
                {/* Actually user screenshot has title on RIGHT. Buttons on LEFT. */}
                {/* Because dir="rtl", Left is flex-end. */}
                {/* We want buttons on LEFT (visually). In RTL flex-start is Right. flex-end is Left. */}

                {/* Buttons Group - Visually Left */}
                <div className="flex gap-2 items-center w-full md:w-auto justify-end md:justify-end">
                    {/* Wait, in RTL: justify-start is Right. justify-end is Left. */}
                    {/* User wants buttons on Left. So justify-end. */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsSettingsOpen(true)}
                        className="bg-white hover:bg-gray-50 text-gray-700"
                        title="הגדרות תצוגה"
                    >
                        <Settings className="w-4 h-4" />
                    </Button>
                    <FinancialAdvisorButton financialData={overviewData?.current} />
                    <FeedbackButton />
                </div>

                {/* Title - Visually Right */}
                <div className="flex items-center gap-2">
                    <PieChartIcon className="w-6 h-6 text-[#323338]" />
                    <h1 className="text-2xl font-bold text-[#323338]">סקירה כללית</h1>
                </div>

            </div>

            {/* Top Row: Key Metrics - ORDER for RTL (Right to Left): 
               1. Income (Rightmost)
               2. Expenses
               3. Savings
               4. Balance (Leftmost)
            */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                {/* 1. Income (Rightmost in visual RTL) */}
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
                            <span className="text-emerald-500 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> 100% חודש שעבר</span>
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
                            <span className="text-red-500 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> 272% חודש שעבר</span>
                        </p>
                    </CardContent>
                </Card>

                {/* 3. Month Savings */}
                <Card className="glass-panel border-r-4 border-r-blue-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('savings')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'רווח נקי' : 'חיסכון חודשי'}</CardTitle>
                        <PiggyBank className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#323338]">
                            {loading ? '...' : <AnimatedNumber value={isBusiness ? (totalIncome - totalOutflow) : Math.max(0, totalIncome - totalOutflow)} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            <span className="text-emerald-500 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> 320% חודש שעבר</span>
                        </p>
                    </CardContent>
                </Card>

                {/* 4. Account Balance (Leftmost in visual RTL) */}
                <Card className="glass-panel border-r-4 border-r-orange-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'שווי נקי' : 'יתרת חשבונות'}</CardTitle>
                        <Wallet className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#323338]">
                            {loading ? '...' : <AnimatedNumber value={currentNetWorth} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            <span className="text-emerald-500 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> 100% חודש שעבר</span>
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">

                {/* 2. Distribution Pie Chart (Visually Right in RTL -> Code Item 1) */}
                <Card className="glass-panel shadow-sm min-h-[350px]">
                    <CardHeader>
                        <CardTitle>התפלגות תקציב</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full relative" style={{ fontFamily: 'var(--font-sans), system-ui, sans-serif' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={incomeVsExpenses}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {incomeVsExpenses.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip currency="₪" />} itemStyle={{ fontFamily: 'inherit' }} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 1. Cash Flow Bar Chart (Visually Left in RTL -> Code Item 2) */}
                <Card className="glass-panel shadow-sm min-h-[350px]">
                    <CardHeader>
                        <CardTitle>הוצאות לפי קטגוריה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{ name: 'נוכחי', income: totalIncome, expenses: totalExpenses }, { name: 'קודם', income: prevTotalIncome, expenses: prevTotalExpenses }]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₪${val / 1000}k`} tick={{ fill: '#6b7280' }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip currency="₪" />} />
                                    <Bar dataKey="expenses" name={isBusiness ? 'הוצאות' : 'הוצאות'} fill="#64748B" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Budget Status (Progress Bars) (Left) - Wait, User said "Row 2: Left = Progress, Right = Net Worth". 
                    In RTL: Right is Item 1, Left is Item 2.
                    So Item 1 should be Net Worth (Right).
                    Item 2 should be Progress (Left).
                 */}

                {/* 4. Net Worth (Area Chart) (Visually Right in RTL -> Code Item 1) */}
                <div className="min-h-[350px]">
                    <NetWorthChart data={netWorthHistory} loading={loading} />
                </div>

                {/* 3. Budget Status (Progress Bars) (Visually Left in RTL -> Code Item 2) */}
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
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((totalExpenses / (totalIncome || 1)) * 100, 100)}%` }} />
                            </div>
                        </div>

                        {/* Bills (Orange) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">חשבונות (שולם)</span>
                                <span className="font-medium text-gray-900">{formatCurrency(totalBills)}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500 rounded-full" style={{ width: '45%' }} />
                            </div>
                        </div>

                        {/* Debts (Purple) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">חובות ששולמו</span>
                                <span className="font-medium text-gray-900">{formatCurrency(totalDebts)}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
                            </div>
                        </div>

                        {/* Savings (Blue) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-700">חיסכון והפקדות</span>
                                <span className="font-medium text-gray-900">{formatCurrency(totalSavingsObserved)}</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: '20%' }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent dir="rtl" className="sm:max-w-[425px]">
                    <DialogHeader className="text-right">
                        <DialogTitle>הגדרות תצוגה</DialogTitle>
                    </DialogHeader>
                    {/* Settings Form Content */}
                    <div className="space-y-4 py-4 text-right">
                        <div className="space-y-2">
                            <Label className="text-right block">יתרה התחלתית בעו"ש</Label>
                            <Input value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} type="number" className="text-left" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block">יתרה התחלתית בחסכונות</Label>
                            <Input value={initialSavings} onChange={(e) => setInitialSavings(e.target.value)} type="number" className="text-left" />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-start gap-2">
                        <Button onClick={handleSaveSettings}>שמור הגדרות</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
