'use client'

import { Card } from '@/components/ui/card'
import { ExpensesTab } from '@/components/dashboard/tabs/ExpensesTab'
import { BudgetProvider } from '@/contexts/BudgetContext'

export default function ManagementExpensesPage() {
    return (
        <div className="space-y-8 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">הוצאות העסק</h2>
                    <p className="text-gray-500">ניהול ומעקב אחרי הוצאות שוטפות</p>
                </div>
            </div>

            <BudgetProvider initialPlan="BUSINESS">
                <Card className="p-6 shadow-sm bg-white min-h-[600px] management-expenses-wrapper">
                    <ExpensesTab />
                </Card>
            </BudgetProvider>
        </div>
    )
}
