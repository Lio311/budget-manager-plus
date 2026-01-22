'use client'

import { useState, useEffect } from 'react'
import { WelcomePopup } from './WelcomePopup'
import { OnboardingPopup } from './OnboardingPopup'
import { getUserSubscriptionStatus, getOnboardingStatus } from '@/lib/actions/user'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, Calendar, DollarSign, Menu, PieChart, TrendingDown, Wallet, X, PiggyBank, Users, Building2, FileText, Shield, TrendingUp, Calculator, Target, FolderOpen, Mail, CreditCard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { OverviewTab } from './tabs/OverviewTab'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { IncomeTab } from './tabs/IncomeTab'
import { ExpensesTab } from './tabs/ExpensesTab'
import { BillsTab } from './tabs/BillsTab'
import { DebtsTab } from './tabs/DebtsTab'
import { CalendarTab } from './tabs/CalendarTab'
import { SavingsTab } from './tabs/SavingsTab'
import { SavingsGoalsTab } from './tabs/SavingsGoalsTab'
import { ClientsTab } from './tabs/ClientsTab'
import { SuppliersTab } from './tabs/SuppliersTab'
import { DocumentsTab } from './tabs/DocumentsTab'
import { BudgetLimitsTab } from './tabs/BudgetLimitsTab'
import ProfitLossTab from './tabs/ProfitLossTab'
import { ProjectsTab } from './tabs/ProjectsTab'
import { useBudget } from '@/contexts/BudgetContext'
import { useSWRConfig } from 'swr'
import { UserButton } from '@clerk/nextjs'
import { ModeToggle } from '@/components/mode-toggle'
import { useDemo } from '@/contexts/DemoContext'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { LinkedEmails } from './UserProfile/LinkedEmails'
import { SubscriptionStatus } from './UserProfile/SubscriptionStatus'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface DashboardTabsProps {
    mobileMenuOpen: boolean
    setMobileMenuOpen: (open: boolean) => void
}

function QuickActionButton({ budgetType, router }: { budgetType: 'PERSONAL' | 'BUSINESS', router: any }) {
    const [open, setOpen] = useState(false)

    type ActionItem = {
        label: string
        icon: any
        tab: string
        action?: string
        type?: string
    }

    const businessActions: ActionItem[] = [
        { label: 'יצירת לקוח', icon: Users, tab: 'clients', action: 'new' }, // You might need a way to trigger 'new' specifically
        { label: 'יצירת ספק', icon: Building2, tab: 'suppliers', action: 'new' },
        { label: 'הוספת הוצאה', icon: TrendingDown, tab: 'expenses', action: 'new' },
        { label: 'הוספת הכנסה', icon: TrendingUp, tab: 'income', action: 'new' },
        { label: 'יצירת חשבונית', icon: FileText, tab: 'documents', type: 'invoice' },
        { label: 'יצירת הצעת מחיר', icon: FileText, tab: 'documents', type: 'quote' },
    ]

    const personalActions: ActionItem[] = [
        { label: 'הוספת הוצאה', icon: TrendingDown, tab: 'expenses', action: 'new' },
        { label: 'הוספת הכנסה', icon: TrendingUp, tab: 'income', action: 'new' },
        { label: 'הוספת חסכון', icon: PiggyBank, tab: 'savings', action: 'new' },
        { label: 'הוספת הלוואה', icon: Wallet, tab: 'debts', action: 'new' },
        { label: 'הוספת חשבון קבוע', icon: CreditCard, tab: 'bills', action: 'new' },
    ]

    const actions = budgetType === 'BUSINESS' ? businessActions : personalActions

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    size="icon"
                    className="h-10 w-10 md:w-12 md:h-12 rounded-2xl bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105"
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </PopoverTrigger>
            <PopoverContent side="left" align="end" className="w-56 p-1 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-xl rounded-xl ml-2">
                <div className="flex flex-col gap-1">
                    {actions.map((action, index) => {
                        const Icon = action.icon
                        return (
                            <button
                                key={index}
                                onClick={() => {
                                    setOpen(false)
                                    // Construct URL with query params to auto-trigger modals if needed
                                    // For now, simpler navigation. 
                                    // TODO: Add support for 'autoOpen=true' or similar in target tabs if not present.
                                    let url = `?tab=${action.tab}`
                                    if (action.action === 'new') url += '&new=true' // Conceptual
                                    if (action.type) url += `&type=${action.type}` // Conceptual

                                    // The user request said "lead to the page". 
                                    // For specific "Create X" actions, we might want to pass a param that opens the dialog.
                                    // Assuming the tabs check for query params or we just navigate for now.
                                    // Let's just navigate to the tab for now as a baseline, 
                                    // knowing that some tabs might not auto-open the dialog yet without further changes.
                                    router.push(url)
                                }}
                                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors w-full text-right"
                            >
                                <Icon className="h-4 w-4 text-gray-500" />
                                <span>{action.label}</span>
                            </button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function DashboardTabs({ mobileMenuOpen, setMobileMenuOpen }: DashboardTabsProps) {
    const router = useRouter()

    // Popup State
    const [showWelcome, setShowWelcome] = useState(false)
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false)
    const { isDemo } = useDemo()
    const { openModal } = useAuthModal()

    const subscriptionDialog = (
        <Dialog open={isSubscriptionOpen} onOpenChange={setIsSubscriptionOpen}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-xl rounded-3xl" dir="rtl">
                <div className="p-6">
                    <SubscriptionStatus />
                    <div className="mt-6 flex justify-center">
                        <Button variant="outline" onClick={() => setIsSubscriptionOpen(false)} className="w-full sm:w-auto">
                            סגור
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )

    // User Profile Props (Copied from Header for consistency)
    const userProfileProps = {
        appearance: {
            elements: {
                profileSection__emailAddresses: "hidden",
                profileSection__connectedAccounts: "hidden",
                cardBox: "w-full h-full md:w-fit md:h-auto md:min-w-[700px] md:max-w-[90vw]",
                scrollBox: "h-full md:h-auto",
                pageScrollBox: "h-full md:h-auto",
                "profileSectionPrimaryButton:hover": {
                    border: "none",
                    boxShadow: "none",
                    outline: "none"
                }
            }
        }
    }

    const userButtonAppearance = {
        elements: {
            userButtonPopoverActionButton__manageAccount: "hidden md:flex",
            userButtonTrigger: "w-14 h-14",
            avatarBox: "w-14 h-14"
        }
    }

    const [subscriptionStatus, setSubscriptionStatus] = useState<{
        trialEndsAt?: Date | null
        activeSubscription?: { endDate: Date | null, planType: 'PERSONAL' | 'BUSINESS' } | null
    } | null>(null)

    useEffect(() => {
        // Show only on Sundays (Day 0) and only once per day
        const today = new Date()
        const isSunday = today.getDay() === 0

        if (isSunday && !isDemo) {
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
        { value: 'overview', label: 'סקירה כללית', icon: PieChart, activeColor: '#000000', activeTextColor: '#ffffff' },
        { value: 'budget_limits', label: 'תקציבים', icon: Shield, activeColor: '#eab308', activeTextColor: '#000000' },
        { value: 'savings_goals', label: 'יעדי חיסכון', icon: Target, activeColor: '#06b6d4', activeTextColor: '#ffffff' },
        { value: 'projects', label: 'פרויקטים', icon: FolderOpen, activeColor: '#ec4899', activeTextColor: '#ffffff' },
        { value: 'income', label: 'הכנסות', icon: TrendingUp, activeColor: '#16a34a', activeTextColor: '#ffffff' },
        { value: 'expenses', label: 'הוצאות', icon: TrendingDown, activeColor: '#dc2626', activeTextColor: '#ffffff' },
        { value: 'bills', label: 'חשבונות קבועים', icon: CreditCard, activeColor: '#f97316', activeTextColor: '#ffffff' },
        { value: 'debts', label: 'הלוואות', icon: Wallet, activeColor: '#9333ea', activeTextColor: '#ffffff' },
        { value: 'savings', label: 'חסכונות', icon: PiggyBank, activeColor: '#2563eb', activeTextColor: '#ffffff' },
        { value: 'calendar', label: 'לוח שנה', icon: Calendar, activeColor: '#000000', activeTextColor: '#ffffff' },
    ]

    const businessTabs = [
        { value: 'overview', label: 'סקירה כללית', icon: PieChart, activeColor: '#000000', activeTextColor: '#ffffff' },
        { value: 'clients', label: 'לקוחות', icon: Users, activeColor: '#16a34a', activeTextColor: '#ffffff' },
        { value: 'suppliers', label: 'ספקים', icon: Building2, activeColor: '#2563eb', activeTextColor: '#ffffff' },
        { value: 'income', label: 'הכנסות', icon: TrendingUp, activeColor: '#16a34a', activeTextColor: '#ffffff' },
        { value: 'expenses', label: 'הוצאות', icon: TrendingDown, activeColor: '#dc2626', activeTextColor: '#ffffff' },
        { value: 'documents', label: 'הפקת מסמכים', icon: FileText, activeColor: '#3b82f6', activeTextColor: '#ffffff' },
        { value: 'profit_loss', label: 'דוח רווח והפסד', icon: Calculator, activeColor: '#059669', activeTextColor: '#ffffff' },
        { value: 'calendar', label: 'לוח שנה', icon: Calendar, activeColor: '#000000', activeTextColor: '#ffffff' },
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
            />

            <OnboardingPopup
                isOpen={showOnboarding}
                onClose={() => setShowOnboarding(false)}
            />

            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 bg-black/60 z-[55] md:hidden backdrop-blur-sm transition-all" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar Navigation - Floating Dock */}
            <aside className={`
                fixed md:sticky 
                top-0 md:top-[90px]
                h-[100dvh] md:h-[calc(100vh-100px)]
                overflow-y-auto
                pb-[env(safe-area-inset-bottom)]
                z-[60] md:z-40
                transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
                flex flex-col justify-between
                ${mobileMenuOpen ? 'translate-x-0 w-64' : 'translate-x-[200%] md:translate-x-0'}
                md:w-fit md:min-w-[80px] group
                m-0 
                bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl md:bg-white dark:md:bg-slate-900 border-l md:border-l border-white/50 dark:border-slate-800/50 shadow-xl md:rounded-2xl
            `}>
                <div className="flex-1 w-full">
                    <div className="p-4 md:hidden flex justify-between items-center border-b border-white/10 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)} className="text-[#323338] dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10">
                                <X className="h-5 w-5" />
                            </Button>
                            <span className="font-bold text-lg text-[#323338] dark:text-gray-100">תפריט</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <ModeToggle />
                            {isDemo ? (
                                <Button
                                    onClick={() => openModal()}
                                    variant="outline"
                                    size="sm"
                                    className="bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600 h-8"
                                >
                                    התחבר
                                </Button>
                            ) : (
                                <UserButton
                                    userProfileProps={userProfileProps}
                                    appearance={userButtonAppearance}
                                >
                                    <UserButton.UserProfilePage
                                        label="מיילים מקושרים"
                                        labelIcon={<Mail className="w-4 h-4" />}
                                        url="linked-emails"
                                    >
                                        <LinkedEmails />
                                    </UserButton.UserProfilePage>
                                    <UserButton.MenuItems>
                                        <UserButton.Action
                                            label="מנוי"
                                            labelIcon={<CreditCard className="w-4 h-4" />}
                                            onClick={() => setIsSubscriptionOpen(true)}
                                        />
                                    </UserButton.MenuItems>
                                </UserButton>
                            )}
                        </div>
                    </div>

                    <div className="p-2 overflow-y-auto flex-1 scrollbar-hide">
                        <TabsList className="h-auto bg-transparent p-0 w-full flex flex-col gap-1 md:grid md:grid-cols-2 md:gap-2">
                            {tabs.map((tab) => {
                                const Icon = tab.icon
                                const isActive = activeTab === tab.value
                                return (
                                    <TooltipProvider key={tab.value} delayDuration={300}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <TabsTrigger
                                                    value={tab.value}
                                                    style={{
                                                        backgroundColor: isActive ? tab.activeColor : undefined,
                                                        color: isActive ? tab.activeTextColor : undefined
                                                    }}
                                                    className={`relative group/item justify-start md:justify-center px-4 py-3 md:p-3 rounded-xl transition-all duration-300 w-full md:aspect-square
                                                         data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20
                                                         hover:bg-white/40 dark:hover:bg-white/10
                                                         text-gray-700 dark:text-gray-300 outline-none ring-0 focus:ring-0 overflow-hidden`}
                                                >
                                                    <div className="relative z-10 flex items-center w-full md:justify-center transition-all duration-300 group-hover/item:scale-110">
                                                        <Icon className="h-5 w-5 md:h-6 md:w-6 shrink-0" />
                                                        <span className="md:hidden mr-3 font-medium whitespace-nowrap">
                                                            {tab.label}
                                                        </span>
                                                    </div>

                                                    {/* Active Indicator Glow */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover/item:animate-[shimmer_1.5s_infinite] z-0" />
                                                </TabsTrigger>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="hidden md:block">
                                                <p>{tab.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )
                            })}
                        </TabsList>
                    </div>
                </div>

                {/* Footer Section: Actions & User Profile */}
                <div className="p-3 hidden md:flex flex-col gap-4 items-center mb-6">
                    {/* Quick Action Button */}
                    <div className="w-full flex justify-center">
                        <QuickActionButton budgetType={budgetType} router={router} />
                    </div>

                    {/* Desktop User Profile */}
                    <div className="flex items-center justify-center w-full mt-2">
                        {isDemo ? (
                            <Button
                                onClick={() => openModal()}
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600"
                            >
                                <Shield className="h-6 w-6" />
                            </Button>
                        ) : (
                            <UserButton
                                afterSignOutUrl="/sign-in"
                                userProfileProps={userProfileProps}
                                appearance={userButtonAppearance}
                            >
                                <UserButton.UserProfilePage
                                    label="מיילים מקושרים"
                                    labelIcon={<Mail className="w-4 h-4" />}
                                    url="linked-emails"
                                >
                                    <LinkedEmails />
                                </UserButton.UserProfilePage>
                                <UserButton.MenuItems>
                                    <UserButton.Action
                                        label="מנוי"
                                        labelIcon={<CreditCard className="w-4 h-4" />}
                                        onClick={() => setIsSubscriptionOpen(true)}
                                    />
                                </UserButton.MenuItems>
                            </UserButton>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 w-full md:max-w-[calc(100%-18rem)] overflow-y-auto bg-transparent min-h-[calc(100vh-65px)]">
                <div className="p-2 md:p-8 max-w-6xl mx-auto space-y-6">
                    {/* Content Wrappers - Added strict widths to prevent overflow */}
                    <TabsContent value="overview" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <OverviewTab onNavigateToTab={handleTabChange} />
                    </TabsContent>
                    <TabsContent value="budget_limits" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <BudgetLimitsTab />
                    </TabsContent>
                    <TabsContent value="savings_goals" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <SavingsGoalsTab />
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
                    <TabsContent value="documents" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <DocumentsTab />
                    </TabsContent>
                    <TabsContent value="projects" className="mt-0 outline-none animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <ProjectsTab />
                    </TabsContent>
                </div>
            </div>
            {subscriptionDialog}
        </Tabs >
    )
}
