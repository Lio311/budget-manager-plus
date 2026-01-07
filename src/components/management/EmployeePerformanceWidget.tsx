'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export function EmployeePerformance({ data }: { data: any[] }) {
    // Transform data for chart
    // data is array of { assignee, _count: { id } }

    // Sort to ensure specific employees are highlighted if needed
    // Colors for specific employees
    const COLORS: Record<string, string> = {
        'Lior': '#00C875', // Monday Green
        'Ron': '#FDAB3D', // Monday Orange
        'Leon': '#E2445C', // Monday Red
    }
    const DEFAULT_COLOR = '#579BFC' // Monday Blue

    const chartData = data.map(item => ({
        name: item.assignee || 'Unassigned',
        tasks: item._count.id
    }))

    return (
        <Card className="p-6 h-[400px] shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">משימות שהושלמו</h3>
            <div className="h-[320px] w-full" dir="ltr">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip
                            cursor={{ fill: '#F5F6F8' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="tasks" radius={[4, 4, 0, 0]} barSize={40}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || DEFAULT_COLOR} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
