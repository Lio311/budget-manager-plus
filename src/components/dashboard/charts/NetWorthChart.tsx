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
        <div className="w-full h-full glass-panel p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="text-lg font-bold text-[#323338] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        שווי נקי לאורך זמן
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">מגמת צמיחה בנכסים נטו</p>
                </div>
            </div>

            <div className="w-full h-full min-h-[200px] flex-1" dir="ltr">
                {loading ? (
                    <div className="h-full w-full flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-400/50" />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={dataWithFormattedDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="formattedDate"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fill: '#64748B' }}
                                dy={10}
                            />
                            <YAxis
                                hide
                                domain={['auto', 'auto']}
                            />
                            <Tooltip content={<CustomTooltip currency="₪" />} cursor={{ stroke: '#3B82F6', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Area
                                type="monotone"
                                dataKey="netWorth"
                                name="שווי נקי"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorNetWorth)"
                                animationDuration={2000}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Background Glow Effect */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-400/20 transition-all duration-500" />
        </div>
    )
}
