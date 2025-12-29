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
        { name: 'חשבונות וחובות', value: totalBills + totalDebts, color: COLORS.bills },
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
        <div className="space-y-6 pb-20 animate-in fade-in-50 duration-500" dir="rtl">

            {/* Action Buttons Row */}
            <div className="flex gap-4 justify-end mb-2">
                <FeedbackButton />
                {/* Financial Advisor fixed to bottom left usually, but putting here if user couldn't find it */}
                <div className="md:hidden"><FinancialAdvisorButton /></div>
            </div>

            {/* Top Row: Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Balance Card */}
                <Card className="glass-panel border-r-4 border-r-blue-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'שווי נקי' : 'יתרה כוללת'}</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#323338]">
                            {loading ? '...' : <AnimatedNumber value={currentNetWorth} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            כולל עו"ש וחסכונות
                        </p>
                    </CardContent>
                </Card>

                {/* Income Card */}
                <Card className="glass-panel border-r-4 border-r-emerald-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('income')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'מכירות' : 'הכנסות'}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {loading ? '...' : <AnimatedNumber value={totalIncome} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}% מול חודש קודם
                        </p>
                    </CardContent>
                </Card>

                {/* Expenses Card */}
                <Card className="glass-panel border-r-4 border-r-red-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('expenses')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'הוצאות תפעול' : 'הוצאות'}</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {loading ? '...' : <AnimatedNumber value={totalExpenses} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {expensesChange > 0 ? '+' : ''}{expensesChange.toFixed(1)}% מול חודש קודם
                        </p>
                    </CardContent>
                </Card>

                {/* Savings / Bills Card */}
                <Card className="glass-panel border-r-4 border-r-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.(isBusiness ? 'invoices' : 'bills')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'חשבונות פתוחים' : 'חשבונות לתשלום'}</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {loading ? '...' : <AnimatedNumber value={currentBillsDisplay} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isBusiness ? 'סה"כ חשבוניות פתוחות' : 'חשבונות שלא שולמו'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">

                {/* 1. Cash Flow Bar Chart */}
                <Card className="glass-panel shadow-sm min-h-[350px]">
                    <CardHeader>
                        <CardTitle>{isBusiness ? 'תזרים עסקי' : 'תזרים הכנסות והוצאות'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{ name: 'נוכחי', income: totalIncome, expenses: totalExpenses }, { name: 'קודם', income: prevTotalIncome, expenses: prevTotalExpenses }]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₪${val / 1000}k`} tick={{ fill: '#6b7280' }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip currency="₪" />} />
                                    <Bar dataKey="income" name={isBusiness ? 'הכנסות' : 'הכנסות'} fill={COLORS.income} radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar dataKey="expenses" name={isBusiness ? 'הוצאות' : 'הוצאות'} fill={COLORS.expenses} radius={[4, 4, 0, 0]} barSize={40} />
                                    <Legend />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Distribution Pie Chart */}
                <Card className="glass-panel shadow-sm min-h-[350px]">
                    <CardHeader>
                        <CardTitle>התפלגות כספית</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full relative">
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
                                    <Tooltip content={<CustomTooltip currency="₪" />} />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Center Text */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <span className="text-xs text-gray-400 block">סה"כ הוצאות</span>
                                    <span className="font-bold text-gray-800"><AnimatedNumber value={totalExpenses} currency="₪" /></span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Net Worth Area Chart (Full Width in tablet, half in large) */}
                <div className="col-span-1 md:col-span-2">
                    <NetWorthChart data={netWorthHistory} loading={loading} />
                </div>

                {/* 4. Budget Progress / Monthly Summary - "The 4th Chart" */}
                <Card className="glass-panel shadow-sm col-span-1 md:col-span-2 min-h-[200px]">
                    <CardHeader>
                        <CardTitle>סיכום חודשי וניצול תקציב</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Income Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>הכנסות (יעד: משוער)</span>
                                <span className="font-bold text-emerald-600">{formatCurrency(totalIncome)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min((totalIncome / (prevTotalIncome || 1)) * 100, 100)}%` }} />
                            </div>
                        </div>

                        {/* Expense Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>הוצאות (מול הכנסות)</span>
                                <span className="font-bold text-red-500">{formatCurrency(totalExpenses)}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min((totalExpenses / (totalIncome || 1)) * 100, 100)}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 text-right">
                                {totalIncome > 0 ? `${((totalExpenses / totalIncome) * 100).toFixed(1)}%` : '0%'} מסך ההכנסות
                            </p>
                        </div>

                        {/* Saving/Profit Progress */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>{isBusiness ? 'רווח נקי' : 'חיסכון (נותר)'}</span>
                                <span className="font-bold text-blue-500">{formatCurrency(Math.max(0, totalIncome - totalOutflow))}</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((Math.max(0, totalIncome - totalOutflow) / (totalIncome || 1)) * 100, 100)}%` }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Settings Dialog - Fixed RTL */}
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

            {/* Floating Settings Button - Bottom Left */}
            <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3">
                <div className="hidden md:block"> <FinancialAdvisorButton /> </div>
                <Button
                    size="icon"
                    className="rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white w-12 h-12"
                    onClick={() => setIsSettingsOpen(true)}
                >
                    <Settings className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}
