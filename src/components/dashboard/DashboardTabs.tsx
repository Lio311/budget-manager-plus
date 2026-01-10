'use client'

import { useState, useEffect } from 'react'
import { WelcomePopup } from './WelcomePopup'
import { OnboardingPopup } from './OnboardingPopup'
import { getUserSubscriptionStatus, getOnboardingStatus } from '@/lib/actions/user'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Calendar, CreditCard, DollarSign, Menu, PieChart, TrendingDown, Wallet, X, PiggyBank, Users, Building2, FileText, Shield, TrendingUp, Calculator } from 'lucide-react'
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
import { QuotesTab } from './tabs/QuotesTab'
import { CreditNotesTab } from './tabs/CreditNotesTab'
import { BudgetLimitsTab } from './tabs/BudgetLimitsTab'
import ProfitLossTab from './tabs/ProfitLossTab'
import { useBudget } from '@/contexts/BudgetContext'
import { useSWRConfig } from 'swr'

interface DashboardTabsProps {
    mobileMenuOpen: boolean
    setMobileMenuOpen: (open: boolean) => void
}

export function DashboardTabs({ mobileMenuOpen, setMobileMenuOpen }: DashboardTabsProps) {
    const router = useRouter()

    // Popup State
    const [showWelcome, setShowWelcome] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [subscriptionStatus, setSubscriptionStatus] = useState<{
        trialEndsAt?: Date | null
        activeSubscription?: { endDate: Date | null, planType: 'PERSONAL' | 'BUSINESS' } | null
    } | null>(null)

    useEffect(() => {
        // Show only on Sundays (Day 0) and only once per day
        const today = new Date()
        const isSunday = today.getDay() === 0

        if (isSunday) {
            const todayDateString = today.toDateString()
            const lastShownDate = localStorage.getItem('welcome_popup_last_shown')

            if (lastShownDate !== todayDateString) {
                getUserSubscriptionStatus().then(status => {
                    if (status) {
                        setSubscriptionStatus(status)
                        setShowWelcome(true)
                        localStorage.setItem('welcome_popup_last_shown', todayDateString)
                    }
                })
            }
        }

        // Check for first-time onboarding
        getOnboardingStatus().then(hasSeen => {
            if (!hasSeen) {
                setShowOnboarding(true)
            }
        })
    }, [])

    const searchParams = useSearchParams()
    const { budgetType } = useBudget()
    const { mutate: globalMutate } = useSWRConfig()

    const pathname = usePathname()

    // Get tab from URL or default to 'overview'
    const urlTab = searchParams.get('tab') || 'overview'
    const [activeTab, setActiveTab] = useState(urlTab)

    // Sync active tab with URL (handles refresh, back/forward) & Deep Links
    useEffect(() => {
        const isDeepLink = searchParams.get('autoOpen') === 'true' || searchParams.has('amount')
        if (isDeepLink) {
            setActiveTab('expenses')
        } else {
            setActiveTab(urlTab)
        }
    }, [urlTab, searchParams])

    // Reset to overview ONLY when budget type changes (and it's not the initial load)
    const [prevBudgetType, setPrevBudgetType] = useState(budgetType)

    useEffect(() => {
        if (budgetType !== prevBudgetType) {
            setActiveTab('overview')
            router.push(`${pathname}?tab=overview`, { scroll: false })
            setPrevBudgetType(budgetType)
        }
    }, [budgetType, prevBudgetType, router, pathname])

    const personalTabs = [
        { value: 'overview', label: 'סקירה כללית', icon: PieChart, activeClass: 'data-[state=active]:bg-black' },
        { value: 'budget_limits', label: 'תקציבים', icon: Shield, activeClass: 'data-[state=active]:bg-yellow-500 data-[state=active]:text-black' },
        { value: 'income', label: 'הכנסות', icon: TrendingDown, rotate: true, activeClass: 'data-[state=active]:bg-green-600' },
        { value: 'expenses', label: 'הוצאות', icon: TrendingDown, activeClass: 'data-[state=active]:bg-red-600' },
        { value: 'bills', label: 'חשבונות קבועים', icon: CreditCard, activeClass: 'data-[state=active]:bg-orange-500' },
        { value: 'debts', label: 'הלוואות', icon: Wallet, activeClass: 'data-[state=active]:bg-purple-600' },
        { value: 'savings', label: 'חסכונות', icon: PiggyBank, activeClass: 'data-[state=active]:bg-blue-600' },
        { value: 'calendar', label: 'לוח שנה', icon: Calendar, activeClass: 'data-[state=active]:bg-black' },
    ]

    const businessTabs = [
        { value: 'overview', label: 'סקירה כללית', icon: PieChart, activeClass: 'data-[state=active]:bg-black' },
        { value: 'clients', label: 'לקוחות', icon: Users, activeClass: 'data-[state=active]:bg-green-600' },
        { value: 'suppliers', label: 'ספקים', icon: Building2, activeClass: 'data-[state=active]:bg-blue-600' },
        { value: 'income', label: 'מכירות', icon: TrendingDown, rotate: true, activeClass: 'data-[state=active]:bg-green-600' },
        { value: 'expenses', label: 'עלויות', icon: TrendingDown, activeClass: 'data-[state=active]:bg-red-600' },
        { value: 'quotes', label: 'הצעות מחיר', icon: FileText, activeClass: 'data-[state=active]:bg-yellow-500 data-[state=active]:text-black' },
        { value: 'invoices', label: 'חשבוניות', icon: FileText, activeClass: 'data-[state=active]:bg-purple-600' },
        { value: 'credit-notes', label: 'זיכויים', icon: FileText, activeClass: 'data-[state=active]:bg-orange-600' },
        { value: 'profit_loss', label: 'דוח רווח והפסד', icon: Calculator, activeClass: 'data-[state=active]:bg-emerald-600' },
        { value: 'calendar', label: 'לוח שנה', icon: Calendar, activeClass: 'data-[state=active]:bg-black' },
    ]

    const tabs = budgetType === 'BUSINESS' ? businessTabs : personalTabs

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        setMobileMenuOpen(false)

        // Update URL without page reload
        router.push(`${pathname}?tab=${value}`, { scroll: false })

        // Refresh SWR data for the new tab
        globalMutate(key => typeof key === 'string' && key.includes(value))
    }

    return (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex min-h-screen bg-transparent gap-4" dir="rtl">

            <WelcomePopup
                isOpen={showWelcome}
                onClose={() => setShowWelcome(false)}
                trialEndsAt={subscriptionStatus?.trialEndsAt}
                activeSubscription={subscriptionStatus?.activeSubscription}
                activeSubscription={subscriptionStatus?.activeSubscription}
            />

            <OnboardingPopup
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
            />

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-all" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar Navigation - Floating Dock */}
            <aside className={`
                fixed md:sticky 
                top-0 md:top-[100px] 
                h-[100dvh] md:h-fit md:max-h-[calc(100vh-120px)]
                overflow-y-auto
                pb-[env(safe-area-inset-bottom)]
                z-[100] md:z-50
                transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                flex flex-col
                ${mobileMenuOpen ? 'translate-x-0 w-64' : 'translate-x-[200%] md:translate-x-0'}
                md:w-20 md:hover:w-64 group
                m-0 md:m-4 md:rounded-3xl
                bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl md:bg-white/40 dark:md:bg-slate-900/40 md:backdrop-blur-md border-l md:border border-white/50 dark:border-slate-800/50 shadow-2xl
            `}>
                <div className="p-4 md:hidden flex justify-between items-center border-b border-white/10 dark:border-white/5">
                    <span className="font-bold text-lg text-[#323338] dark:text-gray-100">תפריט</span>
                    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-[#323338] dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-3 overflow-y-auto flex-1 scrollbar-hide">
                    <TabsList className="flex flex-col h-auto bg-transparent gap-2 p-0 w-full text-right">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            return (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className={`w-full relative group/item justify-start gap-4 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300
                                             ${tab.activeClass} data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20
                                             hover:bg-white/40 dark:hover:bg-white/10
                                             text-gray-700 dark:text-gray-300 outline-none ring-0 focus:ring-0 overflow-hidden whitespace-nowrap`}
                                >
                                    <div className="relative z-10 flex items-center gap-4 shrink-0 transition-all duration-300 group-hover/item:scale-110">
                                        <Icon className={`h-5 w-5 ${tab.rotate ? 'rotate-180' : ''}`} />
                                        <span className="opacity-100 md:opacity-0 md:group-hover:opacity-100 md:w-0 md:group-hover:w-auto transition-all duration-500 delay-75 origin-right">
                                            {tab.label}
                                        </span>
                                    </div>

                                    {/* Active Indicator Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/item:animate-[shimmer_1.5s_infinite] z-0" />
                                </TabsTrigger>
                            )
                        })}
                    </TabsList>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 w-full md:max-w-[calc(100%-18rem)] overflow-y-auto bg-white dark:bg-transparent min-h-[calc(100vh-65px)]">
                <div className="p-2 md:p-8 max-w-6xl mx-auto space-y-6">
                    {/* Content Wrappers - Added strict widths to prevent overflow */}
                    <TabsContent value="overview" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <OverviewTab onNavigateToTab={handleTabChange} />
                    </TabsContent>
                    <TabsContent value="budget_limits" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <BudgetLimitsTab />
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
                    <TabsContent value="profit_loss" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <ProfitLossTab />
                    </TabsContent>
                    <TabsContent value="invoices" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <InvoicesTab />
                    </TabsContent>
                    <TabsContent value="quotes" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <QuotesTab />
                    </TabsContent>
                    <TabsContent value="credit-notes" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <CreditNotesTab />
                    </TabsContent>
                </div>
            </div>
        </Tabs >
    )
}
