'use client'

import useSWR from 'swr'
import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, PiggyBank, TrendingUp, Wallet, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label as RechartsLabel } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getIncomes } from '@/lib/actions/income'
import { getExpenses } from '@/lib/actions/expense'
import { getBills } from '@/lib/actions/bill'
import { getCategories } from '@/lib/actions/category'
import { getNetWorthHistory } from '@/lib/actions/analytics'
import { getHexFromClass } from '@/lib/constants'
import { NetWorthChart } from '@/components/dashboard/NetWorthChart'
import { getDebts } from '@/lib/actions/debts'
import { getSavings } from '@/lib/actions/savings'
import { Settings, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getUserSettings, updateUserSettings } from '@/lib/actions/user'
import { CategoryManager } from '@/components/dashboard/CategoryManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

interface Category {
    id: string
    name: string
    color: string | null
}

const COLORS = {
    income: '#22C55E',
    expenses: '#EF4444',
    bills: '#F59E0B',
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
        const title = label || (payload[0].payload && payload[0].payload.name) || payload[0].name;
        return (
            <div className="bg-white p-2 border rounded shadow-md text-right dir-rtl">
                <span className="font-bold text-gray-900 block mb-1">{title}</span>
                <span className="text-sm text-gray-600">
                    {formatCurrency(Number(payload[0].value), currency)}
                </span>
            </div>
        )
    }
    return null
}

export function OverviewTab() {
    const { month, year, currency } = useBudget()

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [initialBalance, setInitialBalance] = useState('')
    const [initialSavings, setInitialSavings] = useState('')

    // Calculate previous date
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Data Fetchers
    const fetchIncomesData = useCallback(async () => (await getIncomes(month, year)).data || [], [month, year])
    const fetchExpensesData = useCallback(async () => (await getExpenses(month, year)).data || [], [month, year])
    const fetchBillsData = useCallback(async () => (await getBills(month, year)).data || [], [month, year])

    const fetchPrevIncomesData = useCallback(async () => (await getIncomes(prevMonth, prevYear)).data || [], [prevMonth, prevYear])
    const fetchPrevExpensesData = useCallback(async () => (await getExpenses(prevMonth, prevYear)).data || [], [prevMonth, prevYear])
    const fetchPrevBillsData = useCallback(async () => (await getBills(prevMonth, prevYear)).data || [], [prevMonth, prevYear])
    const fetchDebtsData = useCallback(async () => (await getDebts(month, year)).data || [], [month, year])
    const fetchSavingsData = useCallback(async () => (await getSavings(month, year)).data || [], [month, year])
    const fetchPrevDebtsData = useCallback(async () => (await getDebts(prevMonth, prevYear)).data || [], [prevMonth, prevYear])
    const fetchPrevSavingsData = useCallback(async () => (await getSavings(prevMonth, prevYear)).data || [], [prevMonth, prevYear])
    const fetchCategoriesData = useCallback(async () => (await getCategories('expense')).data || [], [])
    const fetchNetWorthData = useCallback(async () => (await getNetWorthHistory()).data || [], [])

    // SWR Hooks
    // SWR Options
    const swrOptions = useMemo(() => ({
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        refreshInterval: 0
    }), [])

    // SWR Hooks
    const { data: incomes = [], isLoading: loadingIncomes } = useSWR(['incomes', month, year], fetchIncomesData, swrOptions)
    const { data: expenses = [], isLoading: loadingExpenses } = useSWR(['expenses', month, year], fetchExpensesData, swrOptions)
    const { data: bills = [], isLoading: loadingBills } = useSWR(['bills', month, year], fetchBillsData, swrOptions)

    const { data: prevIncomes = [], isLoading: loadingPrevIncomes } = useSWR(['incomes', prevMonth, prevYear], fetchPrevIncomesData, swrOptions)
    const { data: prevExpenses = [], isLoading: loadingPrevExpenses } = useSWR(['expenses', prevMonth, prevYear], fetchPrevExpensesData, swrOptions)
    const { data: prevBills = [], isLoading: loadingPrevBills } = useSWR(['bills', prevMonth, prevYear], fetchPrevBillsData, swrOptions)

    const { data: debts = [], isLoading: loadingDebts } = useSWR(['debts', month, year], fetchDebtsData, swrOptions)
    const { data: savingsItems = [], isLoading: loadingSavingsItems } = useSWR(['savings', month, year], fetchSavingsData, swrOptions)
    const { data: prevDebts = [], isLoading: loadingPrevDebts } = useSWR(['debts', prevMonth, prevYear], fetchPrevDebtsData, swrOptions)
    const { data: prevSavingsItems = [], isLoading: loadingPrevSavingsItems } = useSWR(['savings', prevMonth, prevYear], fetchPrevSavingsData, swrOptions)

    const { data: categories = [], isLoading: loadingCategories } = useSWR<Category[]>(['categories', 'expense'], fetchCategoriesData, swrOptions)
    const { data: netWorthHistory = [], isLoading: loadingNetWorth, mutate: mutateNetWorth } = useSWR(['netWorth'], fetchNetWorthData, swrOptions)

    const loading = loadingIncomes || loadingExpenses || loadingBills || loadingPrevIncomes || loadingPrevExpenses || loadingPrevBills ||
        loadingCategories || loadingNetWorth || loadingDebts || loadingSavingsItems || loadingPrevDebts || loadingPrevSavingsItems

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Calculations
    const totalIncome = incomes.reduce((sum: number, i: any) => sum + i.amount, 0)
    const standardExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)

    // Bills splitting
    const totalPaidBills = bills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + b.amount, 0)
    const totalRemainingBills = bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + b.amount, 0)
    const combinedTotalBills = totalPaidBills + totalRemainingBills
    const currentBillsDisplay = totalRemainingBills // We will show remaining bills in the "Bills" card

    const totalPaidDebts = debts.filter((d: any) => d.isPaid).reduce((sum: number, d: any) => sum + d.monthlyPayment, 0)
    const totalDebtsPlanned = debts.reduce((sum: number, d: any) => sum + d.monthlyPayment, 0)
    const totalSavingsDeposits = savingsItems.reduce((sum: number, s: any) => sum + s.monthlyDeposit, 0)

    // Combined Outflows (everything that leaves the account)
    const totalExpenses = standardExpenses + totalPaidDebts + totalSavingsDeposits + totalPaidBills

    const prevTotalIncome = prevIncomes.reduce((sum: number, i: any) => sum + i.amount, 0)
    const prevStandardExpenses = prevExpenses.reduce((sum: number, e: any) => sum + e.amount, 0)

    const prevPaidBills = prevBills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + b.amount, 0)
    const prevRemainingBills = prevBills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + b.amount, 0)
    const prevCombinedBills = prevPaidBills + prevRemainingBills

    const prevTotalPaidDebts = prevDebts.filter((d: any) => d.isPaid).reduce((sum: number, d: any) => sum + d.monthlyPayment, 0)
    const prevTotalSavingsDeposits = prevSavingsItems.reduce((sum: number, s: any) => sum + s.monthlyDeposit, 0)

    const prevTotalExpenses = prevStandardExpenses + prevTotalPaidDebts + prevTotalSavingsDeposits + prevPaidBills

    const savingsRemainder = totalIncome - totalExpenses - totalRemainingBills
    const prevSavingsRemainder = prevTotalIncome - prevTotalExpenses - prevRemainingBills

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    }

    // Net Worth Calculations
    const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].accumulatedNetWorth : 0
    const prevNetWorth = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 2].accumulatedNetWorth : 0
    const netWorthChange = calculateChange(currentNetWorth, prevNetWorth)

    // Fetch user settings when dialog opens
    const loadSettings = async () => {
        const result = await getUserSettings()
        if (result.success && result.data) {
            setInitialBalance((result.data as any).initialBalance?.toString() || '0')
            setInitialSavings((result.data as any).initialSavings?.toString() || '0')
        }
    }

    const handleSaveSettings = async () => {
        const result = await updateUserSettings({
            initialBalance: parseFloat(initialBalance) || 0,
            initialSavings: parseFloat(initialSavings) || 0
        })

        if (result.success) {
            toast.success('הגדרות עודכנו בהצלחה')
            setIsSettingsOpen(false)
            // Re-fetch net worth history without reloading the whole page
            mutateNetWorth()
        } else {
            toast.error('שגיאה בעדכון הגדרות')
        }
    }

    // Group expenses by category
    const categoryMap = new Map<string, number>()
    expenses.forEach(expense => {
        const current = categoryMap.get(expense.category) || 0
        categoryMap.set(expense.category, current + expense.amount)
    })

    const expensesByCategory = Array.from(categoryMap.entries())
        .map(([name, value]) => {
            const category = categories.find(c => c.name === name)
            const color = getHexFromClass(category?.color || null)
            return { name, value, color }
        })

    // Add Debts, Savings and Paid Bills as virtual categories
    if (totalPaidDebts > 0) {
        expensesByCategory.push({ name: 'חובות ששולמו', value: totalPaidDebts, color: '#A855F7' }) // Purple 500
    }
    if (totalSavingsDeposits > 0) {
        expensesByCategory.push({ name: 'חיסכון', value: totalSavingsDeposits, color: '#3B82F6' }) // Blue 500
    }
    if (totalPaidBills > 0) {
        expensesByCategory.push({ name: 'חשבונות ששולמו', value: totalPaidBills, color: '#F59E0B' }) // Amber 500
    }

    expensesByCategory.sort((a, b) => b.value - a.value)

    // Derived Data Object for compatibility
    const data = {
        totalIncome,
        totalExpenses,
        totalBills: currentBillsDisplay,
        expensesByCategory
    }

    const previousData = {
        totalIncome: prevTotalIncome,
        totalExpenses: prevTotalExpenses,
        totalBills: prevCombinedBills
    }

    const incomeChange = calculateChange(totalIncome, prevTotalIncome)
    const expensesChange = calculateChange(totalExpenses, prevTotalExpenses)
    const savingsChange = calculateChange(savingsRemainder, prevSavingsRemainder)
    const billsChange = calculateChange(currentBillsDisplay, prevRemainingBills)

    const incomeVsExpenses = [
        { name: 'הכנסות', value: totalIncome, color: COLORS.income },
        { name: 'הוצאות', value: standardExpenses, color: COLORS.expenses },
        { name: 'חובות', value: totalPaidDebts, color: '#A855F7' }, // Purple 500
        { name: 'חיסכון', value: totalSavingsDeposits, color: '#3B82F6' }, // Blue 500
        { name: 'חשבונות', value: combinedTotalBills, color: COLORS.bills }, // Orange
    ]

    const totalForPie = totalIncome + standardExpenses + totalPaidDebts + totalSavingsDeposits + combinedTotalBills

    return (
        <div className="space-y-6 p-2" dir="rtl">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">סקירה כללית</h2>
                <Dialog open={isSettingsOpen} onOpenChange={(open) => {
                    setIsSettingsOpen(open)
                    if (open) loadSettings()
                }}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Settings className="h-4 w-4" />
                            הגדרות
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col" dir="rtl">
                        <DialogHeader>
                            <DialogTitle className="text-right">הגדרות מערכת</DialogTitle>
                            <DialogDescription className="sr-only">
                                הגדרות וניהול קטגוריות
                            </DialogDescription>
                        </DialogHeader>

                        <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="general">הון ראשוני</TabsTrigger>
                                <TabsTrigger value="categories">ניהול קטגוריות</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="mt-4 space-y-4">
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Input
                                            id="initialBalance"
                                            type="number"
                                            value={initialBalance}
                                            onChange={(e) => setInitialBalance(e.target.value)}
                                            className="col-span-3"
                                            dir="rtl"
                                        />
                                        <Label htmlFor="initialBalance" className="text-right col-span-1">
                                            עובר ושב
                                        </Label>
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Input
                                            id="initialSavings"
                                            type="number"
                                            min="0"
                                            value={initialSavings}
                                            onChange={(e) => setInitialSavings(e.target.value)}
                                            className="col-span-3"
                                            dir="rtl"
                                        />
                                        <Label htmlFor="initialSavings" className="text-right col-span-1">
                                            חסכונות קיימים
                                        </Label>
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveSettings} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        שמור שינויים
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="categories" className="flex-1 overflow-hidden mt-4">
                                <CategoryManager />
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            </div>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                <StatCard
                    title="סך הכנסות"
                    value={formatCurrency(data.totalIncome, currency)}
                    icon={<TrendingUp className="h-4 w-4" />}
                    color="text-green-600"
                    bgColor="bg-green-50"
                    change={incomeChange}
                    changeType="income"
                />
                <StatCard
                    title="סך הוצאות"
                    value={formatCurrency(data.totalExpenses, currency)}
                    icon={<ArrowDown className="h-4 w-4" />}
                    color="text-red-600"
                    bgColor="bg-red-50"
                    change={expensesChange}
                    changeType="expense"
                />
                <StatCard
                    title="חיסכון חודשי"
                    value={formatCurrency(savingsRemainder, currency)}
                    icon={<PiggyBank className="h-4 w-4" />}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    change={savingsChange}
                    changeType="income"
                />
                <StatCard
                    title="יתרת חשבונות"
                    value={formatCurrency(currentBillsDisplay, currency)}
                    icon={<Wallet className="h-4 w-4" />}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                    change={billsChange}
                    changeType="expense"
                />
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
                {/* Top Row: Pie Chart + Expenses Breakdown */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Income vs Expenses Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>התפלגות תקציב</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {totalForPie === 0 ? (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    אין נתונים להצגה
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={incomeVsExpenses}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {incomeVsExpenses.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip currency={currency} />} />
                                        <Legend
                                            formatter={(value) => <span className="mr-2">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    {/* Budget Overview Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>התפלגות תקציב</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {totalForPie === 0 ? (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    אין נתונים להצגה
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart
                                        data={incomeVsExpenses}
                                        margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                                        layout="horizontal"
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                        />

                                        <YAxis
                                            orientation="left"
                                            width={45}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => formatCurrency(Number(value), currency).split('.')[0]}
                                        />
                                        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'transparent' }} />

                                        // 2. הסר את ההגבלה ב-Bar
                                        <Bar
                                            dataKey="value"
                                            radius={[4, 4, 0, 0]}
                                        // maxBarSize={100}  <--- מחק את השורה הזו או הגדל ל-1000
                                        >
                                            {incomeVsExpenses.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom Row: Net Worth + Budget Progress (if enough data) vs Just Budget Progress */}
                <div className={`grid gap-6 ${netWorthHistory.length > 0 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                    {netWorthHistory.length > 0 && (
                        <div className="grid gap-6">
                            <NetWorthChart data={netWorthHistory} />
                        </div>
                    )}

                    {/* Budget Progress (reverted from BarChart) */}
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>מצב תקציב חודשי</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <BudgetProgress
                                    label="הוצאות שוטפות"
                                    current={standardExpenses}
                                    total={totalIncome}
                                    currency={currency}
                                    color="bg-red-500"
                                />
                                <BudgetProgress
                                    label="חשבונות (שולם)"
                                    current={totalPaidBills}
                                    total={combinedTotalBills}
                                    currency={currency}
                                    color="bg-orange-500"
                                />
                                <BudgetProgress
                                    label="חובות ששולמו"
                                    current={totalPaidDebts}
                                    total={totalDebtsPlanned}
                                    currency={currency}
                                    color="bg-purple-500"
                                />
                                <BudgetProgress
                                    label="חיסכון והפקדות"
                                    current={totalSavingsDeposits}
                                    total={totalIncome}
                                    currency={currency}
                                    color="bg-blue-500"
                                />
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-semibold">ניצול תקציב כולל</span>
                                        <span className="text-sm font-bold">
                                            {totalIncome > 0 ? (((totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3">
                                        <div
                                            className="bg-green-600 h-3 rounded-full transition-all"
                                            style={{ width: `${Math.min(totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function StatCard({
    title,
    value,
    icon,
    color,
    bgColor,
    change,
    changeType = 'income'
}: {
    title: string
    value: string
    icon: React.ReactNode
    color: string
    bgColor: string
    change?: number
    changeType?: 'income' | 'expense'
}) {
    // For income/savings: green if up, red if down
    // For expenses/bills: red if up, green if down
    const isPositiveChange = changeType === 'income' ? change && change > 0 : change && change < 0
    const changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600'
    const ChangeIcon = change && change > 0 ? ArrowUp : ArrowDown

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`${bgColor} ${color} p-2 rounded-lg`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="budget-stat">{value}</div>
                {change !== undefined && change !== 0 && (
                    <div className={`flex items-center gap-1 text-xs ${changeColor} mt-1`}>
                        <ChangeIcon className="h-3 w-3" />
                        <span>{Math.abs(change).toFixed(1)}%</span>
                        <span className="text-muted-foreground">מהחודש הקודם</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function BudgetProgress({
    label,
    current,
    total,
    currency,
    color,
}: {
    label: string
    current: number
    total: number
    currency: string
    color: string
}) {
    const percentage = total > 0 ? (current / total) * 100 : 0

    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                    {formatCurrency(current, currency)} / {formatCurrency(total, currency)}
                </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 text-left">
                <span dir="ltr">{percentage.toFixed(1)}%</span>
            </p>
        </div>
    )
}
