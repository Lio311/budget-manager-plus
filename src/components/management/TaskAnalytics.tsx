'use client'

import { Card } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'

// Define types for task analytics props
interface TaskAnalyticsProps {
    tasks: any[]
}

export function TaskAnalytics({ tasks }: TaskAnalyticsProps) {
    // 1. Calculate Metrics
    const totalTasks = tasks.length
    if (totalTasks === 0) return null

    const now = new Date()

    let onTime = 0
    let late = 0
    let pending = 0

    tasks.forEach(task => {
        const dueDate = task.dueDate ? new Date(task.dueDate) : null
        const isDone = task.status === 'DONE'
        const updatedAt = new Date(task.updatedAt)

        if (!dueDate) {
            // If no due date, we consider it pending or onTime if done
            if (isDone) onTime++
            else pending++
            return
        }

        if (isDone) {
            // Task completed. Check if it was done before due date.
            // Comparison: Set times to midnight to avoid hour sensitivity if needed,
            // but exact comparison is safer for "deadline". 
            if (updatedAt <= dueDate) {
                onTime++
            } else {
                late++
            }
        } else {
            // Task NOT done. Check if due date passed.
            if (now > dueDate) {
                late++
            } else {
                pending++
            }
        }
    })

    const data = [
        { name: 'בוצע בזמן', value: onTime, color: '#10B981' }, // emerald-500
        { name: 'באיחור', value: late, color: '#EF4444' }, // red-500
        { name: 'בתהליך', value: pending, color: '#3B82F6' }, // blue-500
    ]

    const onTimeRate = Math.round((onTime / (onTime + late)) * 100) || 0

    return (
        <Card className="p-4 mb-6 bg-white shadow-sm border-none">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">עמידה ביעדים</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* Stats Text */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="text-green-600 h-5 w-5" />
                            <span className="text-gray-700 font-medium">בוצע בזמן</span>
                        </div>
                        <span className="text-xl font-bold text-green-700">{onTime}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="text-red-600 h-5 w-5" />
                            <span className="text-gray-700 font-medium">באיחור / פג תוקף</span>
                        </div>
                        <span className="text-xl font-bold text-red-700">{late}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Clock className="text-blue-600 h-5 w-5" />
                            <span className="text-gray-700 font-medium">בתהליך / עתידי</span>
                        </div>
                        <span className="text-xl font-bold text-blue-700">{pending}</span>
                    </div>

                    {/* <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-500">אחוז עmiדה ביעדים (מתוך משימות שהסתיימו/איחרו)</p>
                        <p className="text-3xl font-bold text-gray-800">{onTimeRate}%</p>
                    </div> */}
                </div>

                {/* Chart */}
                <div className="h-[250px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [value, 'משימות']}
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                    direction: 'rtl',
                                    fontSize: '12px'
                                }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                formatter={(value, entry: any) => <span className="text-sm font-medium text-slate-600 px-2">{value}</span>}
                                wrapperStyle={{ paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Centered Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-8">
                        {/* mb-8 to account for legend space roughly */}
                        <div className="text-3xl font-bold text-slate-800">
                            {onTimeRate}%
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-1">
                            עמידה ביעדים
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}
