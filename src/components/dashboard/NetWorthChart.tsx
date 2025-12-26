'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { useBudget } from '@/contexts/BudgetContext'
import { Loader2 } from 'lucide-react'

interface NetWorthData {
    month: number
    year: number
    accumulatedNetWorth: number
}

export function NetWorthChart({ data, loading }: { data: NetWorthData[], loading?: boolean }) {
    const { currency } = useBudget()

    const translatedData = data.map(item => ({
        ...item,
        name: `${getMonthName(item.month)} ${item.year % 100}`
    }))

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg text-right dir-rtl">
                    <p className="font-bold mb-1">{label}</p>
                    <p className="text-purple-600 font-bold text-lg">
                        {formatCurrency(payload[0].value, currency)}
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <Card className="h-full border-0 shadow-sm glass-panel bg-white/60">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">הון עצמי</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                {loading ? (
                    <div className="h-[300px] w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : data.length === 0 ? (
                    <div className="h-[300px] w-full flex flex-col items-center justify-center text-center px-4" dir="rtl">
                        <svg className="h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                        <p className="text-gray-500 font-medium mb-1">טרם נאספו נתונים</p>
                        <p className="text-sm text-gray-400">
                            הגרף יתחיל להציג נתונים החל מהחודש הבא
                        </p>
                    </div>
                ) : (
                    <div className="h-[300px] w-full pr-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={translatedData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    dy={10}
                                />
                                <YAxis
                                    hide
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Area
                                    type="monotone"
                                    dataKey="accumulatedNetWorth"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorNetWorth)"
                                    animationDuration={1500}
                                    animationBegin={0}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
