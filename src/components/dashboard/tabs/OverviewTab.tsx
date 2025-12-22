'use client'

import useSWR from 'swr'

import { useState } from 'react'
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
import { Settings, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getUserSettings, updateUserSettings } from '@/lib/actions/user'
import { CategoryManager } from '@/components/dashboard/CategoryManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

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

    // Calculate previous date
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Data Fetchers
    const fetchIncomesData = async () => (await getIncomes(month, year)).data || []
    const fetchExpensesData = async () => (await getExpenses(month, year)).data || []
    const fetchBillsData = async () => (await getBills(month, year)).data || []

    const fetchPrevIncomesData = async () => (await getIncomes(prevMonth, prevYear)).data || []
    const fetchPrevExpensesData = async () => (await getExpenses(prevMonth, prevYear)).data || []
    const fetchPrevBillsData = async () => (await getBills(prevMonth, prevYear)).data || []
    const fetchCategoriesData = async () => (await getCategories('expense')).data || []
    const fetchNetWorthData = async () => (await getNetWorthHistory()).data || []

    // SWR Hooks
    const { data: incomes = [], isLoading: loadingIncomes } = useSWR(['incomes', month, year], fetchIncomesData)
    const { data: expenses = [], isLoading: loadingExpenses } = useSWR(['expenses', month, year], fetchExpensesData)
    const { data: bills = [], isLoading: loadingBills } = useSWR(['bills', month, year], fetchBillsData)

    const { data: prevIncomes = [], isLoading: loadingPrevIncomes } = useSWR(['incomes', prevMonth, prevYear], fetchPrevIncomesData)
    const { data: prevExpenses = [], isLoading: loadingPrevExpenses } = useSWR(['expenses', prevMonth, prevYear], fetchPrevExpensesData)
    const { data: prevBills = [], isLoading: loadingPrevBills } = useSWR(['bills', prevMonth, prevYear], fetchPrevBillsData)
    const { data: categories = [], isLoading: loadingCategories } = useSWR<Category[]>(['categories', 'expense'], fetchCategoriesData)
    const { data: netWorthHistory = [], isLoading: loadingNetWorth } = useSWR(['netWorth'], fetchNetWorthData)

    const loading = loadingIncomes || loadingExpenses || loadingBills || loadingPrevIncomes || loadingPrevExpenses || loadingPrevBills || loadingCategories || loadingNetWorth

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    // Calculations
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalBills = bills.reduce((sum, b) => sum + b.amount, 0)

    const prevTotalIncome = prevIncomes.reduce((sum, i) => sum + i.amount, 0)
    const prevTotalExpenses = prevExpenses.reduce((sum, e) => sum + e.amount, 0)
    const prevTotalBills = prevBills.reduce((sum, b) => sum + b.amount, 0)

    const savings = totalIncome - totalExpenses - totalBills
    const prevSavings = prevTotalIncome - prevTotalExpenses - prevTotalBills

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    }

    // Net Worth Calculations
    const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].accumulatedNetWorth : 0
    const prevNetWorth = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 2].accumulatedNetWorth : 0
    const netWorthChange = calculateChange(currentNetWorth, prevNetWorth)

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [initialBalance, setInitialBalance] = useState('')
    const [initialSavings, setInitialSavings] = useState('')

    // Fetch user settings when dialog opens
    const loadSettings = async () => {
        const result = await getUserSettings()
        if (result.success && result.data) {
            setInitialBalance(result.data.initialBalance?.toString() || '0')
            setInitialSavings(result.data.initialSavings?.toString() || '0')
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
            // Re-fetch net worth history
            window.location.reload() // Simple reload to refresh everything for now or use mutate
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
        .sort((a, b) => b.value - a.value)

    // Derived Data Object for compatibility
    const data = {
        totalIncome,
        totalExpenses,
        totalBills,
        expensesByCategory
    }

    const previousData = {
        totalIncome: prevTotalIncome,
        totalExpenses: prevTotalExpenses,
        totalBills: prevTotalBills
    }

    // Calculate percentage changes
    // Removed duplicate definition here. Using the one defined earlier or defining it once.
    // Actually, in the previous file content, I see I inserted it before Net Worth calculations but I might have left the old one?
    // Let's check the file content again.
    // I see in step 2624 diff: I added calculateChange before Net Worth Calculations.
    // The original calculateChange was around line 133 (before edits).
    // I probably have two now.
    // I will remove the one I added in the WRONG place or the duplicate.
    // Ideally, define it once at the top of calculations.

    // Let's just define it once at the top of the function to be safe.
    // But for this tool call, I will remove the one at line 133 (original location) if I added one at line 99.
    // Wait, the diff shows I added it at line 95+.
    // So the one at line 133 is the duplicate now.


    const incomeChange = calculateChange(data.totalIncome, previousData.totalIncome)
    const expensesChange = calculateChange(data.totalExpenses, previousData.totalExpenses)
    const savingsChange = calculateChange(savings, prevSavings)
    const billsChange = calculateChange(data.totalBills, previousData.totalBills)

    const incomeVsExpenses = [
        { name: 'הכנסות', value: data.totalIncome, color: COLORS.income },
        { name: 'הוצאות', value: data.totalExpenses, color: COLORS.expenses },
        { name: 'חשבונות', value: data.totalBills, color: COLORS.bills },
    ]

    const totalForPie = data.totalIncome + data.totalExpenses + data.totalBills

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
                        </DialogHeader>

                        <Tabs defaultValue="general" className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="general">כללי</TabsTrigger>
                                <TabsTrigger value="categories">ניהול קטגוריות</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general" className="mt-4 space-y-4">
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="initialBalance" className="text-right col-span-1">
                                            עובר ושב
                                        </Label>
                                        <Input
                                            id="initialBalance"
                                            type="number"
                                            value={initialBalance}
                                            onChange={(e) => setInitialBalance(e.target.value)}
                                            className="col-span-3"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="initialSavings" className="text-right col-span-1">
                                            חסכונות קיימים
                                        </Label>
                                        <Input
                                            id="initialSavings"
                                            type="number"
                                            value={initialSavings}
                                            onChange={(e) => setInitialSavings(e.target.value)}
                                            className="col-span-3"
                                            dir="ltr"
                                        />
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
                    title="שווי נקי"
                    value={formatCurrency(currentNetWorth, currency)}
                    icon={<TrendingUp className="h-4 w-4" />}
                    color="text-purple-600"
                    bgColor="bg-purple-50"
                    change={netWorthChange}
                    changeType="income"
                />
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
                    value={formatCurrency(savings, currency)}
                    icon={<PiggyBank className="h-4 w-4" />}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    change={savingsChange}
                    changeType="income"
                />
                <StatCard
                    title="סך חשבונות"
                    value={formatCurrency(data.totalBills, currency)}
                    icon={<Wallet className="h-4 w-4" />}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                    change={billsChange}
                    changeType="expense"
                />
            </div>

            {/* Net Worth Chart */}
            <div className="grid gap-6">
                <NetWorthChart data={netWorthHistory} />
            </div>

            {/* Charts Row */}
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
                </Card >

                {/* Expenses by Category */}
                < Card >
                    <CardHeader>
                        <CardTitle>הוצאות לפי קטגוריה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.expensesByCategory.length === 0 ? (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                אין הוצאות להצגה
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart
                                    data={data.expensesByCategory}
                                    margin={{ top: 20, right: 10, left: 60, bottom: 5 }}
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
                                        width={60}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => formatCurrency(Number(value), currency).split('.')[0]}
                                    />
                                    <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
                                        {data.expensesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card >
            </div >

            {/* Budget Progress */}
            < Card >
                <CardHeader>
                    <CardTitle>מצב תקציב חודשי</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <BudgetProgress
                            label="הוצאות מתוך תקציב"
                            current={data.totalExpenses}
                            total={data.totalIncome}
                            currency={currency}
                            color="bg-purple-500"
                        />
                        <BudgetProgress
                            label="חשבונות קבועים"
                            current={data.totalBills}
                            total={data.totalIncome}
                            currency={currency}
                            color="bg-yellow-500"
                        />
                        <BudgetProgress
                            label="חיסכון"
                            current={savings}
                            total={data.totalIncome}
                            currency={currency}
                            color="bg-green-500"
                        />
                    </div>
                </CardContent>
            </Card >
        </div >
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
            <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{label}</span>
                <span className="text-sm text-muted-foreground">
                    {formatCurrency(current, currency)} / {formatCurrency(total, currency)}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                    className={`${color} h-2.5 rounded-full transition-all`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</p>
        </div>
    )
}