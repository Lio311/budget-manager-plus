'use client'

import { Card } from '@/components/ui/card'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function TaskVelocity({ data }: { data: any[] }) {
    // data is array of { date: string, count: number }

    return (
        <Card className="p-6 h-[400px] shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">קצב סגירת משימות (30 ימים אחרונים)</h3>
            <div className="h-[320px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00C875" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00C875" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E0E0E0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} minTickGap={30} />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#00C875" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
