'use client'

import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { useBudget } from '@/contexts/BudgetContext'

interface NetWorthData {
    month: number
    year: number
    income: number
    expenses: number
    netChange: number
    accumulatedNetWorth: number
}

interface NetWorthChartProps {
    data: NetWorthData[]
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border rounded shadow-md text-right dir-rtl">
                <p className="font-bold text-gray-900 mb-1">{label}</p>
                <div className="space-y-1">
                    <p className="text-sm text-purple-600 font-medium">
                        שווי נקי: {formatCurrency(payload[0].value, currency)}
                    </p>
                    {payload[1] && (
                        <p className={`text-xs ${payload[1].value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            שינוי חודשי: {formatCurrency(payload[1].value, currency)}
                        </p>
                    )}
                </div>
            </div>
        )
    }
    return null
}

export function NetWorthChart({ data }: NetWorthChartProps) {
    const { currency } = useBudget()

    if (!data || data.length === 0) {
        return (
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>שווי נקי לאורך זמן</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        אין מספיק נתונים להצגה
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Format data for chart
    const chartData = data.map(item => ({
        name: `${item.month}/${item.year.toString().slice(2)}`,
        netWorth: item.accumulatedNetWorth,
        netChange: item.netChange,
        fullDate: `${item.month}/${item.year}`
    }))

    // Calculate gradient offsets if needed, but simple area is fine
    // We want the area to be purple/blue

    return (
        <Card className="col-span-1 md:col-span-2 shadow-sm border-purple-100 bg-gradient-to-b from-white to-purple-50/20">
            <CardHeader>
                <CardTitle className="text-purple-700 flex items-center gap-2">
                    <span className="text-xl">📈</span> שווי נקי לאורך זמן
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis
                                dataKey="name"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                tickFormatter={(value) => formatCurrency(value, currency).split('.')[0]}
                                dx={-10}
                            />
                            <Tooltip content={<CustomTooltip currency={currency} />} />

                            {/* Hidden line for netChange to be available in tooltip but not rendered */}
                            <Area
                                type="monotone"
                                dataKey="netChange"
                                stroke="none"
                                fill="none"
                                activeDot={false}
                            />

                            <Area
                                type="monotone"
                                dataKey="netWorth"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorNetWorth)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#7c3aed' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
