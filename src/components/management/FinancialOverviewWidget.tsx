'use client'

import { Card } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, DollarSign, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatNumberWithCommas } from '@/lib/utils'

export function FinancialOverview({ data }: { data: any }) {
    const { revenue, expenses, profit } = data

    return (
        <Card className="p-6 h-full shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xl font-bold mb-6 text-gray-800">פיננסי (פרויקט כולל)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col justify-between h-32"
                >
                    <div className="flex items-center justify-between text-emerald-600">
                        <span className="font-bold text-sm">הכנסות</span>
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <ArrowUpRight size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-bold text-emerald-700">{formatNumberWithCommas(revenue.toFixed(2))} ₪</span>
                        <p className="text-emerald-600/70 text-xs mt-1">+12% מחודש שעבר</p>
                    </div>
                </motion.div>

                {/* Expenses */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex flex-col justify-between h-32"
                >
                    <div className="flex items-center justify-between text-rose-600">
                        <span className="font-bold text-sm">הוצאות</span>
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <ArrowDownRight size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-bold text-rose-700">{formatNumberWithCommas(expenses.toFixed(2))} ₪</span>
                        <p className="text-rose-600/70 text-xs mt-1">+5% מחודש שעבר</p>
                    </div>
                </motion.div>

                {/* Profit */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col justify-between h-32"
                >
                    <div className="flex items-center justify-between text-blue-600">
                        <span className="font-bold text-sm">רווח נקי</span>
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <Wallet size={16} />
                        </div>
                    </div>
                    <div>
                        <span className="text-2xl font-bold text-blue-700">{formatNumberWithCommas(profit.toFixed(2))} ₪</span>
                        <p className="text-blue-600/70 text-xs mt-1">מרווח נקי: {((profit / revenue) * 100 || 0).toFixed(1)}%</p>
                    </div>
                </motion.div>
            </div>
        </Card>
    )
}
