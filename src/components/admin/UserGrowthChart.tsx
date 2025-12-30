'use client'

import { useState, useMemo } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { subDays, subMonths, format, startOfDay, endOfDay, eachDayOfInterval, eachMonthOfInterval, isSameDay, isSameMonth } from 'date-fns'
import { enUS } from 'date-fns/locale'

interface UserGrowthChartProps {
    users: any[]
}

type Period = 'week' | 'month' | 'year'

export function UserGrowthChart({ users }: UserGrowthChartProps) {
    const [period, setPeriod] = useState<Period>('week')

    const chartData = useMemo(() => {
        const now = new Date()
        let data: { date: string; count: number; label: string }[] = []

        if (period === 'week') {
            const start = subDays(now, 6) // Last 7 days including today
            const days = eachDayOfInterval({ start, end: now })

            data = days.map(day => {
                const count = users.filter(user =>
                    isSameDay(new Date(user.createdAt), day)
                ).length
                return {
                    date: day.toISOString(),
                    count,
                    label: format(day, 'dd/MM')
                }
            })
        } else if (period === 'month') {
            const start = subDays(now, 29) // Last 30 days
            const days = eachDayOfInterval({ start, end: now })

            data = days.map(day => {
                const count = users.filter(user =>
                    isSameDay(new Date(user.createdAt), day)
                ).length
                return {
                    date: day.toISOString(),
                    count,
                    label: format(day, 'dd/MM')
                }
            })
        } else if (period === 'year') {
            const start = subMonths(now, 11) // Last 12 months
            const months = eachMonthOfInterval({ start, end: now })

            data = months.map(month => {
                const count = users.filter(user =>
                    isSameMonth(new Date(user.createdAt), month)
                ).length
                return {
                    date: month.toISOString(),
                    count,
                    label: format(month, 'MMM yyyy')
                }
            })
        }

        return data
    }, [users, period])

    return (
        <Card className="col-span-4 shadow-none border-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0">
                <CardTitle className="text-base font-bold">User Registration Trends</CardTitle>
                <div className="w-[180px]">
                    <Select value={period} onValueChange={(val) => setPeriod(val as Period)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="week">Last Week</SelectItem>
                            <SelectItem value="month">Last Month</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="label"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                                allowDecimals={false}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelStyle={{ color: '#6b7280' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#f43f5e"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCount)"
                                dot={{ fill: '#f43f5e', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
