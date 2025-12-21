'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, PiggyBank, TrendingUp, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'

// פלטת צבעים מעודכנת לפי התמונה
const COLORS = {
    income: '#22C55E',      // ירוק חזק
    expenses: '#EF4444',    // אדום
    food: '#22C55E',        // ירוק (מזון)
    transport: '#10B981',   // ירוק טורקיז
    entertainment: '#84CC16', // ירוק ליים
    bills: '#F59E0B',       // כתום/צהוב
    other: '#94A3B8',       // אפור
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

    // Mock data - מותאם לערכים שבתמונה
    const mockData = {
        totalIncome: 15000,
        totalExpenses: 8620,
        totalBills: 3500,
        totalDebts: 2600,
    }

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
    ].sort((a, b) => b.value - a.value);

    const totalForPie = 27120.00; // ערך תואם לתמונה

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
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={incomeVsExpenses}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={65}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    labelLine={true}
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
                                <Legend verticalAlign="bottom" align="center" formatter={(value) => <span className="mr-2">{value}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-right">הוצאות לפי קטגוריה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={expensesByCategory} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} reversed={false} tick={{ fontSize: 12 }} />
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

            {/* Budget Progress Section */}
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
    // במינוס (trendUp=false) -> צבע אדום וחץ למטה
    const trendColor = trendUp ? 'text-green-600' : 'text-red-600';
    const Icon = trendUp ? ArrowUp : ArrowDown;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`${bgColor} ${color} p-2 rounded-lg`}>{icon}</div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold tracking-tight">{value}</div>
                <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${trendColor}`}>
                    <span style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                        {trendUp ? '+' : '-'}{trend.replace(/[+-]/g, '')}
                    </span>
                    <Icon className="h-3 w-3" />
                    <span className="text-muted-foreground font-normal mr-1">מהחודש הקודם</span>
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