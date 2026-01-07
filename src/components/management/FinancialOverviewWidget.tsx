'use client'

import { Card } from '@/components/ui/card'
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatNumberWithCommas } from '@/lib/utils'

export function FinancialOverview({ data }: { data: any }) {
    const { revenue, expenses, profit } = data

    return (
        <Card className="p-6 h-full shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="text-xl font-bold mb-6 text-gray-800">פיננסי (פרויקט כולל)</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue - Green */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-emerald-500 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">הכנסות</p>
                        <span className="text-2xl font-bold text-emerald-600 whitespace-nowrap">{formatNumberWithCommas(revenue.toFixed(2))} ₪</span>
                        <p className="text-emerald-600/70 text-xs mt-1">+12% מחודש שעבר</p>
                    </div>
                </motion.div>

                {/* Expenses - Red */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-rose-500 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
                        <TrendingDown size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">הוצאות</p>
                        <span className="text-2xl font-bold text-rose-600 whitespace-nowrap">{formatNumberWithCommas(expenses.toFixed(2))} ₪</span>
                        <p className="text-rose-600/70 text-xs mt-1">+5% מחודש שעבר</p>
                    </div>
                </motion.div>

                {/* Profit - Blue */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-blue-500 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium">רווח נקי</p>
                        <span className="text-2xl font-bold text-blue-600 whitespace-nowrap">{formatNumberWithCommas(profit.toFixed(2))} ₪</span>
                        <p className="text-blue-600/70 text-xs mt-1">מרווח נקי: {((profit / revenue) * 100 || 0).toFixed(1)}%</p>
                    </div>
                </motion.div>
            </div>
        </Card>
    )
}
