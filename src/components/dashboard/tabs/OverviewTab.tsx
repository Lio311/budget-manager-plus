'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'

const COLORS = {
    income: '#22C55E',      // ירוק
    expenses: '#EF4444',    // אדום
    bills: '#F59E0B',       // צהוב-כתום
    food: '#22C55E',
    transport: '#10B981',
    entertainment: '#84CC16',
    other: '#94A3B8',
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
    const { currency } = useBudget()

    const mockData = {
        totalIncome: 15000,
        totalExpenses: 8620,
        totalBills: 3500,
        totalDebts: 2600,
    }

    const savings = mockData.totalIncome - mockData.totalExpenses - mockData.totalBills

    // סידור הנתונים לפי סדר ההופעה במקרא (מימין לשמאל)
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
    ].sort((a, b) => b.value - a.value);

    return (
        <div className="space-y-6 p-2" dir="rtl">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="סך הכנסות"
                    value={formatCurrency(mockData.totalIncome, currency)}
                    icon={<TrendingUp className="h-4 w-4" />}
                    trend="12%"
                    trendUp={true}
                    color="text-green-600"
                    bgColor="bg-green-50"
                />
                <StatCard
                    title="סך הוצאות"
                    value={formatCurrency(mockData.totalExpenses, currency)}
                    icon={<ArrowDown className="h-4 w-4" />}
                    trend="5%"
                    trendUp={false}
                    color="text-red-600"
                    bgColor="bg-red-50"
                />
                <StatCard
                    title="חיסכון חודשי"
                    value={formatCurrency(savings, currency)}
                    icon={<PiggyBank className="h-4 w-4" />}
                    trend="18%"
                    trendUp={true}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="סך חובות"
                    value={formatCurrency(mockData.totalDebts, currency)}
                    icon={<Wallet className="h-4 w-4" />}
                    trend="10%"
                    trendUp={false}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                    isDebt={true}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-right">התפלגות תקציב</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={incomeVsExpenses}
                                    cx="50%"
                                    cy="45%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    label={false}
                                    labelLine={false}
                                >
                                    {incomeVsExpenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                    <Label
                                        value={formatCurrency(27120, currency)}
                                        position="center"
                                        className="text-xl font-bold fill-foreground"
                                    />
                                </Pie>
                                <Tooltip content={<CustomTooltip currency={currency} />} />
                                <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="square"
                                    iconSize={14}
                                    formatter={(value) => (
                                        <span className="text-sm font-medium mr-2 ml-6 text-gray-700">
                                            {value}
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-right">הוצאות לפי קטגוריה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={expensesByCategory} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                <YAxis orientation="right" axisLine={false} tickLine={false} tickFormatter={(val) => `₪${val}`} tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                    {expensesByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-right font-bold">מצב תקציב חודשי</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ title, value, icon, trend, trendUp, color, bgColor, isDebt }: any) {
    const trendColor = trendUp ? 'text-green-600' : 'text-red-600';
    const Icon = trendUp ? ArrowUp : ArrowDown;

    return (
        <Card className="overflow-hidden border-none shadow-sm bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
                <div className={`${bgColor} ${color} p-2 rounded-lg`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight text-gray-900">{value}</div>
                <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${trendColor}`}>
                    <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                        {trendUp ? '+' : '-'}{trend.replace(/[+-]/g, '')}
                    </span>
                    <Icon className="h-3 w-3" />
                    <span className="text-gray-400 font-normal mr-1">מהחודש הקודם</span>
                </div>
            </CardContent>
        </Card>
    )
}

function BudgetProgress({ label, current, total, currency, color }: any) {
    const percentage = Math.min((current / total) * 100, 100)
    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-muted-foreground tabular-nums">
                    {formatCurrency(current, currency)} / {formatCurrency(total, currency)}
                </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }} />
            </div>
            <div className="flex justify-end text-[10px] text-muted-foreground">
                {percentage.toFixed(1)}%
            </div>
        </div>
    )
}