'use client'

import { Card } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const MOCK_MONTHLY_DATA = [
    { name: 'ינו', income: 4000, expenses: 2400 },
    { name: 'פבר', income: 3000, expenses: 1398 },
    { name: 'מרץ', income: 2000, expenses: 9800 },
    { name: 'אפר', income: 2780, expenses: 3908 },
    { name: 'מאי', income: 1890, expenses: 4800 },
    { name: 'יוני', income: 2390, expenses: 3800 },
    { name: 'יולי', income: 3490, expenses: 4300 },
]

export default function ReportsPage() {
    return (
        <div className="space-y-8 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">דוחות מתקדמים</h2>
                    <p className="text-gray-500">ניתוח מעמיק של ביצועי העסק</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">הכנסות מול הוצאות (חצי שנתי)</h3>
                    <div className="h-[300px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={MOCK_MONTHLY_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="income" fill="#10B981" name="הכנסות" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" fill="#EF4444" name="הוצאות" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-6 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">מגמת רווחיות</h3>
                    <div className="h-[300px]" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={MOCK_MONTHLY_DATA}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    )
}
