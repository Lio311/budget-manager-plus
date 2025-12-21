'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, DollarSign, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'

// Mock data - will be replaced with real API calls
const mockData = {
    totalIncome: 15000,
    totalExpenses: 8620,
    totalBills: 3500,
    totalDebts: 2600,
}

const COLORS = {
    income: 'hsl(142, 76%, 36%)', // Green
    expenses: 'hsl(0, 84%, 60%)', // Red
    food: 'hsl(142, 76%, 36%)', // Green (Primary)
    transport: 'hsl(160, 84%, 39%)', // Teal-ish Green
    entertainment: 'hsl(80, 80%, 45%)', // Lime Green
    bills: 'hsl(45, 93%, 47%)', // Yellow/Orange
    other: 'hsl(200, 10%, 65%)', // Gray
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border rounded shadow-md text-right dir-rtl">
                <span className="font-bold text-gray-900 block mb-1">{payload[0].name}</span>
                <span className="text-sm text-gray-600">
                    {formatCurrency(Number(payload[0].value), currency)}
                </span>
            </div>
        )
    }
    return null
}

export function OverviewTab() {
    const { currency } = useBudget()

    const savings = mockData.totalIncome - mockData.totalExpenses - mockData.totalBills

    const incomeVsExpenses = [
        { name: 'הכנסות', value: mockData.totalIncome, color: COLORS.income },
        { name: 'הוצאות', value: mockData.totalExpenses, color: COLORS.expenses },
        { name: 'חשבונות', value: mockData.totalBills, color: COLORS.bills },
    ]

    const expensesByCategory = [
        { name: 'מזון', value: 3200, color: COLORS.food },
        { name: 'תחבורה', value: 1800, color: COLORS.transport },
        { name: 'בילויים', value: 1500, color: COLORS.entertainment },
        { name: 'קניות', value: 1200, color: COLORS.other },
        { name: 'אחר', value: 920, color: COLORS.other },
    ]

    const totalForPie = mockData.totalIncome + mockData.totalExpenses + mockData.totalBills

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="סך הכנסות"
                    value={formatCurrency(mockData.totalIncome, currency)}
                    icon={<TrendingUp className="h-4 w-4" />}
                    trend="+12%"
                    trendUp={true}
                    color="text-green-600"
                    bgColor="bg-green-50"
                />
                <StatCard
                    title="סך הוצאות"
                    value={formatCurrency(mockData.totalExpenses, currency)}
                    icon={<ArrowDown className="h-4 w-4" />}
                    trend="-5%"
                    trendUp={false}
                    color="text-red-600"
                    bgColor="bg-red-50"
                />
                <StatCard
                    title="חיסכון חודשי"
                    value={formatCurrency(savings, currency)}
                    icon={<PiggyBank className="h-4 w-4" />}
                    trend="+18%"
                    trendUp={true}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="סך חובות"
                    value={formatCurrency(mockData.totalDebts, currency)}
                    icon={<Wallet className="h-4 w-4" />}
                    trend="-10%"
                    trendUp={true}
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
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={incomeVsExpenses}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
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
                    </CardContent>
                </Card>

                {/* Expenses by Category */}
                <Card>
                    <CardHeader>
                        <CardTitle>הוצאות לפי קטגוריה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={expensesByCategory}
                                margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
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
                                    {expensesByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
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
                            current={mockData.totalExpenses}
                            total={mockData.totalIncome}
                            currency={currency}
                            color="bg-purple-500"
                        />
                        <BudgetProgress
                            label="חשבונות קבועים"
                            current={mockData.totalBills}
                            total={mockData.totalIncome}
                            currency={currency}
                            color="bg-yellow-500"
                        />
                        <BudgetProgress
                            label="חיסכון"
                            current={savings}
                            total={mockData.totalIncome}
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
    trend,
    trendUp,
    color,
    bgColor,
}: {
    title: string
    value: string
    icon: React.ReactNode
    trend: string
    trendUp: boolean
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
                <p className={`text-xs ${trendUp ? 'text-green-600' : 'text-red-600'} flex items-center gap-1 mt-1`}>
                    {trendUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {trend} מהחודש הקודם
                </p>
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
    const percentage = (current / total) * 100

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
