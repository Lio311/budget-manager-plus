'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Calendar, CreditCard, DollarSign, Menu, PieChart, TrendingDown, Wallet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OverviewTab } from './tabs/OverviewTab'
import { IncomeTab } from './tabs/IncomeTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { BillsTab } from './tabs/BillsTab'
import { DebtsTab } from './tabs/DebtsTab'
import { CalendarTab } from './tabs/CalendarTab'
import { SavingsTab } from './tabs/SavingsTab'

export function DashboardTabs() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('overview')

    const tabs = [
        { value: 'overview', label: 'סקירה כללית', icon: PieChart },
        { value: 'income', label: 'הכנסות', icon: TrendingDown, rotate: true },
        { value: 'expenses', label: 'הוצאות', icon: TrendingDown },
        { value: 'bills', label: 'חשבונות קבועים', icon: CreditCard },
        { value: 'debts', label: 'חובות', icon: Wallet },
        { value: 'savings', label: 'חסכונות', icon: DollarSign },
        { value: 'calendar', label: 'לוח שנה', icon: Calendar },
    ]

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setMobileMenuOpen(false)
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full" dir="rtl">
            {/* Mobile Menu Button */}
            <div className="md:hidden border-b bg-white/80 backdrop-blur-sm sticky top-[57px] z-20">
                <div className="container mx-auto px-2 py-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMobileMenuOpen(true)}
                        className="gap-2"
                    >
                        <Menu className="h-4 w-4" />
                        תפריט
                    </Button>
                </div>
            </div>

            {/* Mobile Sidebar */}
            {mobileMenuOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Sidebar */}
                    <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50 md:hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-bold">תפריט</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                        <div className="p-2 space-y-1">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                return (
                                    <button
                                        key={tab.value}
                                        onClick={() => handleTabChange(tab.value)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${activeTab === tab.value
                                            ? 'bg-primary text-primary-foreground'
                                            : 'hover:bg-accent'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${tab.rotate ? 'rotate-180' : ''}`} />
                                        <span>{tab.label}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* Desktop Tabs */}
            <div className="hidden md:block border-b bg-white/80 backdrop-blur-sm sticky top-[73px] z-10">
                <div className="container mx-auto px-4">
                    <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-1">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                                >
                                    <Icon className={`w-4 h-4 ${tab.rotate ? 'rotate-180' : ''}`} />
                                    {tab.label}
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </div>
            </div>

            <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
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
                <TabsContent value="savings">
                    <SavingsTab />
                </TabsContent>
                <TabsContent value="calendar">
                    <CalendarTab />
                </TabsContent>
            </div>
        </Tabs>
    )
}
