'use client'

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = {
    'CRITICAL': '#E2445C', // Red
    'HIGH': '#FF642E',     // Orange/Red
    'MEDIUM': '#FDAB3D',   // Orange
    'LOW': '#00C875',      // Green
}

const PRIORITY_LABELS: Record<string, string> = {
    'CRITICAL': 'קריטי',
    'HIGH': 'גבוה',
    'MEDIUM': 'בינוני',
    'LOW': 'נמוך',
    'No Active Tasks': 'אין משימות פעילות'
}

export function PriorityBreakdown({ data }: { data: any[] }) {
    // data is array of { priority: string, _count: { id: number } }

    const chartData = data.map(item => ({
        name: PRIORITY_LABELS[item.priority] || item.priority,
        priorityKey: item.priority,
        value: item._count.id
    }))

    // Fallback if no data
    if (chartData.length === 0) {
        chartData.push({ name: 'אין משימות פעילות', priorityKey: 'No Active Tasks', value: 1 })
    }

    return (
        <Card className="p-6 h-[400px] shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">משימות פתוחות</h3>
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
                                    fill={COLORS[entry.priorityKey as keyof typeof COLORS] || '#e0e0e0'}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ direction: 'rtl', textAlign: 'right', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ direction: 'rtl', textAlign: 'right' }}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            content={(props) => {
                                const { payload } = props;
                                return (
                                    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-4" dir="rtl">
                                        {payload?.map((entry: any, index: number) => (
                                            <li key={`item-${index}`} className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: entry.color }}
                                                />
                                                <span className="text-sm font-medium text-slate-600">{entry.value}</span>
                                            </li>
                                        ))}
                                    </ul>
                                );
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
