'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Calendar, CreditCard, DollarSign, Menu, PieChart, TrendingDown, Wallet, X, PiggyBank, Users, Building2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OverviewTab } from './tabs/OverviewTab'
import { IncomeTab } from './tabs/IncomeTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { BillsTab } from './tabs/BillsTab'
import { DebtsTab } from './tabs/DebtsTab'
import { CalendarTab } from './tabs/CalendarTab'
import { SavingsTab } from './tabs/SavingsTab'
import { ClientsTab } from './tabs/ClientsTab'
import { SuppliersTab } from './tabs/SuppliersTab'
import { InvoicesTab } from './tabs/InvoicesTab'
import { useBudget } from '@/contexts/BudgetContext'

interface DashboardTabsProps {
    mobileMenuOpen: boolean
    setMobileMenuOpen: (open: boolean) => void
}

export function DashboardTabs({ mobileMenuOpen, setMobileMenuOpen }: DashboardTabsProps) {
    const [activeTab, setActiveTab] = useState('overview')
    const { budgetType } = useBudget()

    const personalTabs = [
        { value: 'overview', label: 'סקירה כללית', icon: PieChart, activeClass: 'data-[state=active]:bg-black' },
        { value: 'income', label: 'הכנסות', icon: TrendingDown, rotate: true, activeClass: 'data-[state=active]:bg-green-600' },
        { value: 'expenses', label: 'הוצאות', icon: TrendingDown, activeClass: 'data-[state=active]:bg-red-600' },
        { value: 'bills', label: 'חשבונות קבועים', icon: CreditCard, activeClass: 'data-[state=active]:bg-orange-500' },
        { value: 'debts', label: 'חובות', icon: Wallet, activeClass: 'data-[state=active]:bg-purple-600' },
        { value: 'savings', label: 'חסכונות', icon: PiggyBank, activeClass: 'data-[state=active]:bg-blue-600' },
        { value: 'calendar', label: 'לוח שנה', icon: Calendar, activeClass: 'data-[state=active]:bg-black' },
    ]

    const businessTabs = [
        { value: 'overview', label: 'סקירה כללית', icon: PieChart, activeClass: 'data-[state=active]:bg-black' },
        { value: 'clients', label: 'לקוחות', icon: Users, activeClass: 'data-[state=active]:bg-green-600' },
        { value: 'suppliers', label: 'ספקים', icon: Building2, activeClass: 'data-[state=active]:bg-blue-600' },
        { value: 'invoices', label: 'חשבוניות', icon: FileText, activeClass: 'data-[state=active]:bg-purple-600' },
        { value: 'income', label: 'מכירות', icon: TrendingDown, rotate: true, activeClass: 'data-[state=active]:bg-green-600' },
        { value: 'expenses', label: 'עלויות', icon: TrendingDown, activeClass: 'data-[state=active]:bg-red-600' },
        { value: 'calendar', label: 'לוח שנה', icon: Calendar, activeClass: 'data-[state=active]:bg-black' },
    ]

    const tabs = budgetType === 'BUSINESS' ? businessTabs : personalTabs

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setMobileMenuOpen(false)
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex min-h-[calc(100vh-65px)] bg-[#F5F5F7]" dir="rtl">

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar Navigation - Shared Desktop/Mobile Structure */}
            <aside className={`
                fixed md:sticky md:top-[65px] h-[calc(100vh-65px)] right-0 z-50
                w-72 bg-[#f2f2f7] border-l border-gray-200
                transition-transform duration-300 ease-in-out shadow-xl md:shadow-none
                ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
                flex flex-col
            `}>
                <div className="p-4 md:hidden flex justify-between items-center border-b border-gray-200 bg-[#f2f2f7]">
                    <span className="font-bold text-lg">תפריט</span>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-3 overflow-y-auto flex-1">
                    <TabsList className="flex flex-col h-auto bg-transparent gap-1 p-0 w-full text-right">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className={`w-full justify-start gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                                             ${tab.activeClass} data-[state=active]:text-white data-[state=active]:shadow-sm
                                             hover:bg-white/50
                                             text-gray-700 outline-none ring-0 focus:ring-0`}
                                >
                                    <Icon className={`h-4 w-4 ${tab.rotate ? 'rotate-180' : ''}`} />
                                    {tab.label}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 w-full md:max-w-[calc(100%-18rem)] overflow-y-auto bg-white min-h-[calc(100vh-65px)]">
                <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
                    {/* Content Wrappers - Added strict widths to prevent overflow */}
                    <TabsContent value="overview" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <OverviewTab onNavigateToTab={handleTabChange} />
                    </TabsContent>
                    <TabsContent value="income" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <IncomeTab />
                    </TabsContent>
                    <TabsContent value="expenses" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <ExpensesTab />
                    </TabsContent>
                    <TabsContent value="bills" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <BillsTab />
                    </TabsContent>
                    <TabsContent value="debts" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <DebtsTab />
                    </TabsContent>
                    <TabsContent value="savings" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <SavingsTab />
                    </TabsContent>
                    <TabsContent value="calendar" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <CalendarTab />
                    </TabsContent>
                    <TabsContent value="clients" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <ClientsTab />
                    </TabsContent>
                    <TabsContent value="suppliers" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <SuppliersTab />
                    </TabsContent>
                    <TabsContent value="invoices" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <InvoicesTab />
                    </TabsContent>
                </div>
            </div>
        </Tabs >
    )
}
