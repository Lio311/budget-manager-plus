'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { useBudget } from '@/contexts/BudgetContext'

interface NetWorthData {
    month: number
    year: number
    accumulatedNetWorth: number
}

export function NetWorthChart({ data }: { data: NetWorthData[] }) {
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
        <Card className="w-full h-full shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold text-purple-800">הון עצמי לאורך זמן (מגמה)</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
        </Card>
    )
}
