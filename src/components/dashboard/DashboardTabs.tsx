'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Calendar, CreditCard, DollarSign, PieChart, TrendingDown, Wallet } from 'lucide-react'
import { OverviewTab } from './tabs/OverviewTab'
import { IncomeTab } from './tabs/IncomeTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { BillsTab } from './tabs/BillsTab'
import { DebtsTab } from './tabs/DebtsTab'
import { CalendarTab } from './tabs/CalendarTab'

export function DashboardTabs() {
    return (
        <Tabs defaultValue="overview" className="w-full" dir="rtl">
            <div className="border-b bg-white/80 backdrop-blur-sm sticky top-[73px] z-10">
                <div className="container mx-auto px-4">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-1">
                        <TabsTrigger value="overview" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <PieChart className="w-4 h-4" />
                            סקירה כללית
                        </TabsTrigger>
                        <TabsTrigger value="income" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <TrendingDown className="w-4 h-4 rotate-180" />
                            הכנסות
                        </TabsTrigger>
                        <TabsTrigger value="expenses" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <TrendingDown className="w-4 h-4" />
                            הוצאות
                        </TabsTrigger>
                        <TabsTrigger value="bills" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <CreditCard className="w-4 h-4" />
                            חשבונות קבועים
                        </TabsTrigger>
                        <TabsTrigger value="debts" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <Wallet className="w-4 h-4" />
                            חובות
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                            <Calendar className="w-4 h-4" />
                            לוח שנה
                        </TabsTrigger>
                    </TabsList>
                </div>
            </div>

            <div className="container mx-auto px-4 py-6">
                <TabsContent value="overview">
                    <OverviewTab />
                </TabsContent>
                <TabsContent value="income">
                    <IncomeTab />
                </TabsContent>
                <TabsContent value="expenses">
                    <ExpensesTab />
                </TabsContent>
                <TabsContent value="bills">
                    <BillsTab />
                </TabsContent>
                <TabsContent value="debts">
                    <DebtsTab />
                </TabsContent>
                <TabsContent value="calendar">
                    <CalendarTab />
                </TabsContent>
            </div>
        </Tabs>
    )
}
