'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, PiggyBank, TrendingUp, Wallet, Loader2 } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getIncomes } from '@/lib/actions/income'
import { getExpenses } from '@/lib/actions/expense'
import { getBills } from '@/lib/actions/bill'

const COLORS = {
    income: '#22C55E',
    expenses: '#EF4444',
    bills: '#F59E0B',
    'מזון': '#22C55E',
    'תחבורה': '#10B981',
    'בילויים': '#84CC16',
    'קניות': '#EC4899',
    'בריאות': '#EF4444',
    'חינוך': '#F59E0B',
    'אחר': '#94A3B8',
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
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        totalIncome: 0,
        totalExpenses: 0,
        totalBills: 0,
        expensesByCategory: [] as { name: string; value: number; color: string }[]
    })

    useEffect(() => {
        loadData()
    }, [month, year])

    async function loadData() {
        setLoading(true)

        const [incomesResult, expensesResult, billsResult] = await Promise.all([
            getIncomes(month, year),
            getExpenses(month, year),
            getBills(month, year)
        ])

        const totalIncome = incomesResult.success && incomesResult.data
            ? incomesResult.data.reduce((sum, income) => sum + income.amount, 0)
            : 0

        const totalExpenses = expensesResult.success && expensesResult.data
            ? expensesResult.data.reduce((sum, expense) => sum + expense.amount, 0)
            : 0

        const totalBills = billsResult.success && billsResult.data
            ? billsResult.data.reduce((sum, bill) => sum + bill.amount, 0)
            : 0

        // Group expenses by category
        const categoryMap = new Map<string, number>()
        if (expensesResult.success && expensesResult.data) {
            expensesResult.data.forEach(expense => {
                const current = categoryMap.get(expense.category) || 0
                categoryMap.set(expense.category, current + expense.amount)
            })
        }

        const expensesByCategory = Array.from(categoryMap.entries())
            .map(([name, value]) => ({
                name,
                value,
                color: COLORS[name as keyof typeof COLORS] || COLORS['אחר']
            }))
            .sort((a, b) => b.value - a.value)

        setData({
            totalIncome,
            totalExpenses,
            totalBills,
            expensesByCategory
        })
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const savings = data.totalIncome - data.totalExpenses - data.totalBills

    const incomeVsExpenses = [
        { name: 'הכנסות', value: data.totalIncome, color: COLORS.income },
        { name: 'הוצאות', value: data.totalExpenses, color: COLORS.expenses },
        { name: 'חשבונות', value: data.totalBills, color: COLORS.bills },
    ]

    const totalForPie = data.totalIncome + data.totalExpenses + data.totalBills

    return (
        <div className="space-y-6 p-2" dir="rtl">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="סך הכנסות"
                    value={formatCurrency(data.totalIncome, currency)}
                    icon={<TrendingUp className="h-4 w-4" />}
                    color="text-green-600"
                    bgColor="bg-green-50"
                />
                <StatCard
                    title="סך הוצאות"
                    value={formatCurrency(data.totalExpenses, currency)}
                    icon={<ArrowDown className="h-4 w-4" />}
                    color="text-red-600"
                    bgColor="bg-red-50"
                />
                <StatCard
                    title="חיסכון חודשי"
                    value={formatCurrency(savings, currency)}
                    icon={<PiggyBank className="h-4 w-4" />}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="סך חשבונות"
                    value={formatCurrency(data.totalBills, currency)}
                    icon={<Wallet className="h-4 w-4" />}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                />
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
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {incomeVsExpenses.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                        <Label
                                            value={formatCurrency(totalForPie, currency)}
                                            position="center"
                                            className="text-lg font-bold fill-foreground"
                                        />
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

                {/* Expenses by Category */}
                <Card>
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
                                    margin={{ top: 20, right: 60, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        reversed={true}
                                    />
                                    <YAxis
                                        orientation="right"
                                        width={70}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => formatCurrency(Number(value), currency).split('.')[0]}
                                    />
                                    <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {data.expensesByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Budget Progress */}
            <Card>
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
            </Card>
        </div>
    )
}

function StatCard({
    title,
    value,
    icon,
    color,
    bgColor,
}: {
    title: string
    value: string
    icon: React.ReactNode
    color: string
    bgColor: string
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className={`${bgColor} ${color} p-2 rounded-lg`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="budget-stat">{value}</div>
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