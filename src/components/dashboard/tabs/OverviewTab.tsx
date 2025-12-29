'use client'

import useSWR from 'swr'
import { useState, useCallback, useMemo, useEffect } from 'react' // React imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, TrendingUp, Wallet, Loader2, PieChart as PieChartIcon, TrendingDown, CreditCard, Settings, Save } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getOverviewData } from '@/lib/actions/overview'
import { getHexFromClass, PRESET_COLORS } from '@/lib/constants'
import { NetWorthChart } from '../charts/NetWorthChart' // Update import path
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getUserSettings, updateUserSettings } from '@/lib/actions/user'
import { CategoryManager } from '@/components/dashboard/CategoryManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { swrConfig } from '@/lib/swr-config'
import { FinancialAdvisorButton } from '@/components/dashboard/FinancialAdvisorButton'
import { BusinessSettings } from '@/components/settings/BusinessSettings'

interface Category {
    id: string
    name: string
    color: string | null
}

const COLORS = {
    income: '#22C55E',
    expenses: '#EF4444',
    bills: '#F59E0B',
}

// Helper to upgrade colors
function getBoldColor(colorClass: string | null) {
    let c = colorClass || 'bg-gray-500 text-white'
    if (c.includes('bg-') && c.includes('-100')) {
        c = c.replace(/bg-(\w+)-100/g, 'bg-$1-500')
            .replace(/text-(\w+)-700/g, 'text-white')
            .replace(/border-(\w+)-200/g, 'border-$1-600')
    }
    return c
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
    if (active && payload && payload.length) {
        const title = label || (payload[0].payload && payload[0].payload.name) || payload[0].name;
        return (
            <div className="bg-white p-2 border rounded shadow-md text-right" dir="rtl">
                <span className="font-bold text-gray-900 block mb-1">{title}</span>
                <span className="text-sm text-gray-500 font-medium block" dir="ltr">
                    {currency === 'ILS' || currency === '₪' ? '₪' : currency} {Number(payload[0].value).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
        )
    }
    return null
}

export function OverviewTab({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
    const { month, year, currency, budgetType } = useBudget()

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [initialBalance, setInitialBalance] = useState('')
    const [initialSavings, setInitialSavings] = useState('')

    // Calculate previous date
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Optimized: Single data fetch instead of 11+ separate calls!
    const fetchOverviewData = useCallback(async () => {
        const result = await getOverviewData(month, year, budgetType)
        if (result.success && result.data) {
            return result.data
        }
        throw new Error(result.error || 'Failed to fetch overview data')
    }, [month, year, budgetType])

    const { data: overviewData, isLoading: loading, mutate: mutateOverview } = useSWR(
        ['overview', month, year, budgetType],
        fetchOverviewData,
        swrConfig
    )

    // Force refresh when entering the tab
    useEffect(() => {
        mutateOverview()
    }, [mutateOverview])

    // Default empty data if loading
    const defaultData = {
        current: { incomes: [], expenses: [], bills: [], debts: [], savings: [] },
        previous: { incomes: [], expenses: [], bills: [], debts: [], savings: [] },
        categories: [],
        netWorthHistory: []
    }

    const data = overviewData || defaultData

    // Extract data from optimized response
    // Extract data from optimized response with defensive defaults
    const incomes = Array.isArray(data.current?.incomes) ? data.current.incomes : []
    const expenses = Array.isArray(data.current?.expenses) ? data.current.expenses : []
    const bills = Array.isArray(data.current?.bills) ? data.current.bills : []
    const debts = Array.isArray(data.current?.debts) ? data.current.debts : []
    const savingsItems = Array.isArray(data.current?.savings) ? data.current.savings : []

    const prevIncomes = Array.isArray(data.previous?.incomes) ? data.previous.incomes : []
    const prevExpenses = Array.isArray(data.previous?.expenses) ? data.previous.expenses : []
    const prevBills = Array.isArray(data.previous?.bills) ? data.previous.bills : []
    const prevDebts = Array.isArray(data.previous?.debts) ? data.previous.debts : []
    const prevSavingsItems = Array.isArray(data.previous?.savings) ? data.previous.savings : []

    const categories = Array.isArray(data.categories) ? data.categories : []
    const netWorthHistory = Array.isArray(data.netWorthHistory) ? data.netWorthHistory : []

    // Calculations - using pre-converted ILS amounts from server (ensures consistency with individual tabs)
    const totalIncome = incomes.reduce((sum: number, i: any) => sum + (i.amountILS || i.amount), 0)
    const standardExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amountILS || e.amount), 0)

    // Bills splitting
    const totalPaidBills = bills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || b.amount), 0)
    const totalRemainingBills = bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || b.amount), 0)
    const combinedTotalBills = totalPaidBills + totalRemainingBills
    const currentBillsDisplay = totalRemainingBills // We will show remaining bills in the "Bills" card

    const totalPaidDebts = debts.filter((d: any) => d.isPaid).reduce((sum: number, d: any) => sum + (d.monthlyPaymentILS || d.monthlyPayment), 0)
    const totalDebtsPlanned = debts.reduce((sum: number, d: any) => sum + (d.monthlyPaymentILS || d.monthlyPayment), 0)
    const totalSavingsDeposits = savingsItems.reduce((sum: number, s: any) => sum + (s.monthlyDepositILS || s.monthlyDeposit), 0)

    // Combined Outflows (everything that leaves the account)
    const totalExpenses = standardExpenses + totalPaidDebts + totalSavingsDeposits + totalPaidBills

    const prevTotalIncome = prevIncomes.reduce((sum: number, i: any) => sum + (i.amountILS || i.amount), 0)
    const prevStandardExpenses = prevExpenses.reduce((sum: number, e: any) => sum + (e.amountILS || e.amount), 0)

    const prevPaidBills = prevBills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || b.amount), 0)
    const prevRemainingBills = prevBills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || b.amount), 0)
    const prevCombinedBills = prevPaidBills + prevRemainingBills

    const prevTotalPaidDebts = prevDebts.filter((d: any) => d.isPaid).reduce((sum: number, d: any) => sum + (d.monthlyPaymentILS || d.monthlyPayment), 0)
    const prevTotalSavingsDeposits = prevSavingsItems.reduce((sum: number, s: any) => sum + (s.monthlyDepositILS || s.monthlyDeposit), 0)

    const prevTotalExpenses = prevStandardExpenses + prevTotalPaidDebts + prevTotalSavingsDeposits + prevPaidBills

    const savingsRemainder = totalIncome - totalExpenses - totalRemainingBills
    const prevSavingsRemainder = prevTotalIncome - prevTotalExpenses - prevRemainingBills

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
    }

    const incomeChange = calculateChange(totalIncome, prevTotalIncome)
    const expensesChange = calculateChange(totalExpenses, prevTotalExpenses)
    const savingsChange = calculateChange(savingsRemainder, prevSavingsRemainder)
    const billsChange = calculateChange(currentBillsDisplay, prevRemainingBills)

    // Pie Chart Data
    const isBusiness = budgetType === 'BUSINESS'
    const incomeVsExpenses = [
        { name: isBusiness ? 'מכירות' : 'הכנסות', value: totalIncome, color: COLORS.income },
        { name: isBusiness ? 'עלויות' : 'הוצאות', value: totalExpenses, color: COLORS.expenses },
        { name: isBusiness ? 'רווח נקי' : 'יתרה / חיסכון', value: Math.max(0, savingsRemainder), color: '#3B82F6' },
        { name: 'חשבונות', value: totalRemainingBills, color: COLORS.bills },
        { name: 'חובות', value: totalDebtsPlanned, color: '#8B5CF6' }
    ].filter(item => item.value > 0)

    const totalForPie = incomeVsExpenses.reduce((sum, item) => sum + item.value, 0)

    // Net Worth Calculations
    const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].accumulatedNetWorth : 0
    const prevNetWorth = netWorthHistory.length > 1 ? netWorthHistory[netWorthHistory.length - 2].accumulatedNetWorth : 0
    const netWorthChange = calculateChange(currentNetWorth, prevNetWorth)

    // Fetch user settings when dialog opens
    const loadSettings = async () => {
        const result = await getUserSettings()
        if (result.success && result.data) {
            setInitialBalance((result.data as any).initialBalance?.toString() || '0')
            setInitialSavings((result.data as any).initialSavings?.toString() || '0')
        }
    }

    const handleSaveSettings = async () => {
        const result = await updateUserSettings({
            initialBalance: parseFloat(initialBalance) || 0,
            initialSavings: parseFloat(initialSavings) || 0
        })

        if (result.success) {
            toast.success('הגדרות עודכנו בהצלחה')
            setIsSettingsOpen(false)
            // Re-fetch overview data to update net worth with new initial values
            mutateOverview()
        } else {
            toast.error('שגיאה בעדכון הגדרות')
        }
    }

    // Group expenses by category
    const categoryMap = new Map<string, number>()
    expenses.forEach((expense: any) => {
        const current = categoryMap.get(expense.category) || 0
        categoryMap.set(expense.category, current + expense.amount)
    })

    const expensesByCategory = Array.from(categoryMap.entries())
        .map(([name, value]) => {
            const category = Array.isArray(categories) ? categories.find(c => c.name === name) : null
            // Ensure we use the bold version of the color
            const colorClass = getBoldColor(category?.color || null)
            // For hex, we might need to map the bold class back to hex or just use a lookup if available
            // A simple hack: find the preset that matches the bold class name part (e.g. 'green')
            let colorHex = '#64748B' // slate-500
            const match = colorClass.match(/bg-(\w+)-500/)
            if (match && match[1]) {
                const preset = Array.isArray(PRESET_COLORS) ? PRESET_COLORS.find(p => p.name.toLowerCase() === match[1]) : null
                if (preset) colorHex = preset.hex
            } else {
                colorHex = getHexFromClass(category?.color || null)
            }

            return { name, value, colorHex, colorClass }
        })

    return (
        <div className="space-y-6 pb-20 animate-in fade-in-50 duration-500">
            {/* Bento Grid Layout - Main */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6">

                {/* 1. Large Balance Card (Col-Span-2) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 row-span-1 h-full">
                    <div className={`glass-panel p-6 h-full flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300 ${isBusiness ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-emerald-500'}`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Wallet className="w-32 h-32" />
                        </div>

                        <div>
                            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">יתרה נוכחית</h2>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl md:text-5xl font-extrabold text-[#323338] tracking-tight">
                                    {loading ? '...' : <AnimatedNumber value={savingsRemainder} currency="₪" />}
                                </span>
                                {savingsChange !== 0 && (
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${savingsChange > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {savingsChange > 0 ? '+' : ''}{savingsChange.toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-xs text-gray-400 block mb-1">הכנסות החודש</span>
                                <span className="text-lg font-bold text-emerald-600">
                                    <AnimatedNumber value={totalIncome} currency="₪" />
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-400 block mb-1">הוצאות החודש</span>
                                <span className="text-lg font-bold text-red-500">
                                    <AnimatedNumber value={totalExpenses} currency="₪" />
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Quick Actions & Stats (Col-Span-2) */}
                <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
                    <div className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/80 transition-colors cursor-pointer group" onClick={() => onNavigateToTab?.('income')}>
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-sm">הוסף הכנסה</span>
                    </div>
                    <div className="glass-panel p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/80 transition-colors cursor-pointer group" onClick={() => onNavigateToTab?.('expenses')}>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-sm">הוסף הוצאה</span>
                    </div>

                    {/* Small Stat Cards */}
                    <div className="col-span-2 glass-panel p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div>
                                <span className="text-xs text-gray-500 block">חשבונות פתוחים</span>
                                <span className="font-bold text-gray-800"><AnimatedNumber value={currentBillsDisplay} currency="₪" /></span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onNavigateToTab?.('bills')} className="text-xs">לשלם &larr;</Button>
                    </div>
                </div>

                {/* 3. Net Worth Chart (Col-Span-2 / Col-Span-4) */}
                <div className="col-span-1 md:col-span-4 lg:col-span-2 h-full min-h-[250px]">
                    <NetWorthChart data={netWorthHistory} />
                </div>
            </div>

            {/* Second Row - Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 glass-panel p-6 min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg">ניתוח תזרים מזומנים</h3>
                        <div className="flex gap-2">
                            {/* Legend placeholders or interactive toggles could go here */}
                            <span className="text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> הכנסות</span>
                            <span className="text-xs flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> הוצאות</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'נוכחי', income: totalIncome, expenses: totalExpenses }, { name: 'קודם', income: prevTotalIncome, expenses: prevTotalExpenses }]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₪${val / 1000}k`} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip currency="₪" />} />
                                <Bar dataKey="income" fill={COLORS.income} radius={[4, 4, 0, 0]} barSize={40} />
                                <Bar dataKey="expenses" fill={COLORS.expenses} radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Categories / Donut */}
                <div className="glass-panel p-6 flex flex-col">
                    <h3 className="font-bold text-lg mb-4">התפלגות {isBusiness ? 'עלויות' : 'הוצאות'}</h3>
                    <div className="flex-1 min-h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={incomeVsExpenses.filter(i => i.name !== (isBusiness ? 'מכירות' : 'הכנסות') && i.name !== (isBusiness ? 'רווח נקי' : 'יתרה / חיסכון'))}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {incomeVsExpenses.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip currency="₪" />} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="text-xs text-gray-400 block">סה"כ</span>
                                <span className="font-bold text-gray-800"><AnimatedNumber value={totalExpenses} currency="₪" /></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>הגדרות תצוגה</DialogTitle>
                    </DialogHeader>
                    {/* Settings Form Content */}
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>יתרה התחלתית בעו"ש</Label>
                            <Input value={initialBalance} onChange={(e) => setInitialBalance(e.target.value)} type="number" />
                        </div>
                        <div className="space-y-2">
                            <Label>יתרה התחלתית בחסכונות</Label>
                            <Input value={initialSavings} onChange={(e) => setInitialSavings(e.target.value)} type="number" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveSettings}>שמור הגדרות</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

