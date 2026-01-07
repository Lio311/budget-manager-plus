'use client'

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = {
    'CRITICAL': '#E2445C', // Red
    'HIGH': '#FF642E',     // Orange/Red
    'MEDIUM': '#FDAB3D',   // Orange
    'LOW': '#00C875',      // Green
}

export function PriorityBreakdown({ data }: { data: any[] }) {
    // data is array of { priority: string, _count: { id: number } }

    const chartData = data.map(item => ({
        name: item.priority,
        value: item._count.id
    }))

    // Fallback if no data
    if (chartData.length === 0) {
        chartData.push({ name: 'No Active Tasks', value: 1 })
    }

    return (
        <Card className="p-6 h-[400px] shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">התפלגות עדיפויות (משימות פתוחות)</h3>
            <div className="h-[320px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[entry.name as keyof typeof COLORS] || '#e0e0e0'}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
