'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { formatCurrency, getMonthName } from '@/lib/utils'
import { useBudget } from '@/contexts/BudgetContext'
import { Loader2, TrendingUp } from 'lucide-react'
import { CustomTooltip } from './CustomTooltip'

interface NetWorthData {
    month: number
    year: number
    accumulatedNetWorth: number
}

export function NetWorthChart({ data, loading }: { data: NetWorthData[], loading?: boolean }) {
    const { currency, budgetType } = useBudget()

    // Different colors and titles for business vs personal
    const isBusiness = budgetType === 'BUSINESS'
    const chartColor = isBusiness ? '#10b981' : '#8b5cf6' // green for business, purple for personal
    const chartTitle = isBusiness ? 'שווי העסק נטו' : 'הון עצמי'

    const dataWithFormattedDate = data.map(item => ({
        ...item,
        netWorth: item.accumulatedNetWorth,
        formattedDate: new Date(item.year, item.month - 1).toLocaleDateString('he-IL', { month: 'short', year: '2-digit' })
    }))

    return (
        <div className="w-full h-full min-h-[200px]" dir="ltr">
            {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-400/50" />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dataWithFormattedDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="formattedDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#ffffff' }}
                            dy={10}
                        />
                        <YAxis
                            hide
                            domain={['auto', 'auto']}
                        />
                        <Tooltip content={<CustomTooltip currency="₪" />} cursor={{ stroke: '#22C55E', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                            type="monotone"
                            dataKey="netWorth"
                            name={chartTitle}
                            stroke="#22C55E"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorNetWorth)"
                            animationDuration={2000}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}
