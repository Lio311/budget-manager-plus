'use client'

import useSWR from 'swr'
import { useState, useCallback, useMemo, useEffect } from 'react' // React imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, TrendingUp, Wallet, Loader2, PieChart as PieChartIcon, TrendingDown, CreditCard, Settings, Save, AlertCircle } from 'lucide-react'
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
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { CustomTooltip } from '../charts/CustomTooltip'


interface Category {
    id: string
    name: string
    color: string | null
}

const COLORS = {
    income: '#22C55E', // Green
    expenses: '#EF4444', // Red
    bills: '#F59E0B', // Amber
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

    // Update settings state when data loads
    useEffect(() => {
        if (overviewData?.user) {
            setInitialBalance(overviewData.user.initialBalance?.toString() || '')
            setInitialSavings(overviewData.user.initialSavings?.toString() || '')
        }
    }, [overviewData])

    const isBusiness = budgetType === 'BUSINESS'
    const current = overviewData?.current || { incomes: [], expenses: [], bills: [], debts: [], savings: [] }
    const previous = overviewData?.previous || { incomes: [], expenses: [], bills: [], debts: [], savings: [] }
    const categories = overviewData?.categories || []
    const netWorthHistory = overviewData?.netWorthHistory || []

    // Calculations
    const totalIncome = current.incomes.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const totalExpenses = current.expenses.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const totalBills = current.bills.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const totalDebts = current.debts.reduce((sum: number, item: any) => sum + (item.monthlyPaymentILS || 0), 0)
    // Savings: for business this is net profit (income - expenses), for personal it's deposit
    const totalSavingsObserved = current.savings.reduce((sum: number, item: any) => sum + (item.monthlyDepositILS || 0), 0)

    // Logic for "Balance" / "Net Profit"
    // Personal: Initial Balance + Income - Expenses - Bills - Debts + (Maybe treat savings as transfer?)
    // Let's keep it simple: Income - (Expenses + Bills + Debts) + Initial (if first month?)
    // Actually, "Current Balance" usually means: Initial + Sum(Income) - Sum(Outflow) over ALL time?
    // Or just for this month?
    // The previous implementation likely used a calculated "Remainder".
    const totalOutflow = totalExpenses + totalBills + totalDebts
    const monthlyRemainder = totalIncome - totalOutflow
    const savingsRemainder = isBusiness ? monthlyRemainder : (monthlyRemainder - totalSavingsObserved) // Personal subtracts savings deposits from operational cash? Or treats them as asset?
    // Let's stick to "Available Balance" concept.

    // Current Balance Display (Simplified for UI):
    // Use the logic from previous session or similar.
    // Ideally: User Initial Balance + All History Net Changes. 
    // Here we might just show "Monthly Net Flow" if we don't have full history handy, BUT we DO have netWorthHistory!
    // The last entry of netWorthHistory is the current accumulated net worth.
    const currentNetWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].accumulatedNetWorth : 0
    // Or just use the calculated remainder for the *month* if user wants "Monthly Status".
    // The "Large Card" usually showed Balance. Let's show Net Worth or Monthly Balance.

    const prevTotalIncome = previous.incomes.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)
    const prevTotalExpenses = previous.expenses.reduce((sum: number, item: any) => sum + (item.amountILS || 0), 0)

    // Percentage Changes
    const incomeChange = prevTotalIncome > 0 ? ((totalIncome - prevTotalIncome) / prevTotalIncome) * 100 : 0
    const expensesChange = prevTotalExpenses > 0 ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 : 0

    // Income vs Expenses Data
    const incomeVsExpenses = [
        { name: isBusiness ? 'מכירות' : 'הכנסות', value: totalIncome, color: COLORS.income },
        { name: isBusiness ? 'הוצאות' : 'הוצאות', value: totalOutflow, color: COLORS.expenses },
        { name: isBusiness ? 'רווח נקי' : 'יתרה / חיסכון', value: Math.max(0, monthlyRemainder), color: COLORS.bills },
    ].filter(item => item.value > 0)

    const handleSaveSettings = async () => {
        const result = await updateUserSettings({
            initialBalance: parseFloat(initialBalance) || 0,
            initialSavings: parseFloat(initialSavings) || 0
        })

        if (result.success) {
            toast.success('הגדרות עודכנו בהצלחה')
            setIsSettingsOpen(false)
            mutateOverview()
        } else {
            toast.error('שגיאה בעדכון הגדרות')
        }
    }

    // Group expenses by category
    const categoryMap = new Map<string, number>()
    current.expenses.forEach((expense: any) => {
        const currentVal = categoryMap.get(expense.category) || 0
        categoryMap.set(expense.category, currentVal + (expense.amountILS || 0))
    })

    const expensesByCategory = Array.from(categoryMap.entries())
        .map(([name, value]) => {
            const category = Array.isArray(categories) ? categories.find(c => c.name === name) : null
            const colorClass = getBoldColor(category?.color || null)
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

    const currentBillsDisplay = current.bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + (b.amountILS || 0), 0)

    return (
        <div className="space-y-6 pb-20 animate-in fade-in-50 duration-500">

            {/* Top Row: Key Metrics (Standard Grid) */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Balance / Net Worth Card */}
                <Card className="glass-panel border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'שווי נקי' : 'יתרה כוללת'}</CardTitle>
                        <Wallet className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-[#323338]">
                            {loading ? '...' : <AnimatedNumber value={currentNetWorth} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            כולל עו"ש וחסכונות
                        </p>
                    </CardContent>
                </Card>

                {/* Income Card */}
                <Card className="glass-panel border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'מכירות החודש' : 'הכנסות החודש'}</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">
                            {loading ? '...' : <AnimatedNumber value={totalIncome} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}% מול חודש קודם
                        </p>
                    </CardContent>
                </Card>

                {/* Expenses Card */}
                <Card className="glass-panel border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{isBusiness ? 'הוצאות תפעול' : 'הוצאות החודש'}</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                            {loading ? '...' : <AnimatedNumber value={totalExpenses} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {expensesChange > 0 ? '+' : ''}{expensesChange.toFixed(1)}% מול חודש קודם
                        </p>
                    </CardContent>
                </Card>

                {/* Bills / Unpaid Card */}
                <Card className="glass-panel border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => onNavigateToTab?.('bills')}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">חשבונות פתוחים</CardTitle>
                        <CreditCard className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {loading ? '...' : <AnimatedNumber value={currentBillsDisplay} currency="₪" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            לחץ למעבר לתשלום
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Main Overview Chart */}
                <Card className="glass-panel col-span-1 md:col-span-4 shadow-sm">
                    <CardHeader>
                        <CardTitle>{isBusiness ? 'תזרים עסקי' : 'תזרים הכנסות והוצאות'}</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{ name: 'נוכחי', income: totalIncome, expenses: totalExpenses }, { name: 'קודם', income: prevTotalIncome, expenses: prevTotalExpenses }]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₪${val / 1000}k`} tick={{ fill: '#6b7280' }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip currency="₪" />} />
                                    <Bar dataKey="income" name={isBusiness ? 'הכנסות' : 'הכנסות'} fill={COLORS.income} radius={[4, 4, 0, 0]} barSize={40} />
                                    <Bar dataKey="expenses" name={isBusiness ? 'הוצאות' : 'הוצאות'} fill={COLORS.expenses} radius={[4, 4, 0, 0]} barSize={40} />
                                    <Legend />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart / Distribution */}
                <Card className="glass-panel col-span-1 md:col-span-3 shadow-sm">
                    <CardHeader>
                        <CardTitle>{isBusiness ? 'התפלגות רווחים' : 'לאן הולך הכסף?'}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full relative">
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
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <span className="text-xs text-gray-400 block">סה"כ הוצאות</span>
                                    <span className="font-bold text-gray-800"><AnimatedNumber value={totalExpenses} currency="₪" /></span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Net Worth Chart - Full Width or separate row */}
            <div className="grid gap-6 grid-cols-1">
                <NetWorthChart data={netWorthHistory} loading={loading} />
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

            {/* Floating Settings Button */}
            <div className="fixed bottom-6 left-6 z-50">
                <Button
                    size="icon"
                    className="rounded-full shadow-xl bg-slate-900 hover:bg-slate-800 text-white w-12 h-12"
                    onClick={() => setIsSettingsOpen(true)}
                >
                    <Settings className="w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}
