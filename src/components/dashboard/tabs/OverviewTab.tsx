'use client'

import useSWR from 'swr'
import { useState, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown, ArrowUp, PiggyBank, TrendingUp, Wallet, Loader2, PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Label as RechartsLabel } from 'recharts'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getOverviewData } from '@/lib/actions/overview'
import { getHexFromClass, PRESET_COLORS } from '@/lib/constants'
import { NetWorthChart } from '@/components/dashboard/NetWorthChart'
import { Settings, Save } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getUserSettings, updateUserSettings } from '@/lib/actions/user'
import { CategoryManager } from '@/components/dashboard/CategoryManager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { swrConfig } from '@/lib/swr-config'
import { FeedbackButton } from '@/components/dashboard/FeedbackButton'
import { FinancialAdvisorButton } from '@/components/dashboard/FinancialAdvisorButton'

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
    const { month, year, currency } = useBudget()

    const [isSettingsOpen, setIsSettingsOpen] = useState(false)
    const [initialBalance, setInitialBalance] = useState('')
    const [initialSavings, setInitialSavings] = useState('')

    // Calculate previous date
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    // Optimized: Single data fetch instead of 11+ separate calls!
    const fetchOverviewData = useCallback(async () => {
        const result = await getOverviewData(month, year)
        if (result.success && result.data) {
            return result.data
        }
        throw new Error(result.error || 'Failed to fetch overview data')
    }, [month, year])

    const { data: overviewData, isLoading: loading, mutate: mutateOverview } = useSWR(
        ['overview', month, year],
        fetchOverviewData,
        swrConfig
    )

    // Default empty data if loading
    const defaultData = {
        current: { incomes: [], expenses: [], bills: [], debts: [], savings: [] },
        previous: { incomes: [], expenses: [], bills: [], debts: [], savings: [] },
        categories: [],
        netWorthHistory: []
    }

    const data = overviewData || defaultData

    // Extract data from optimized response
    const incomes = data.current.incomes
    const expenses = data.current.expenses
    const bills = data.current.bills
    const debts = data.current.debts
    const savingsItems = data.current.savings

    const prevIncomes = data.previous.incomes
    const prevExpenses = data.previous.expenses
    const prevBills = data.previous.bills
    const prevDebts = data.previous.debts
    const prevSavingsItems = data.previous.savings

    const categories = data.categories
    const netWorthHistory = data.netWorthHistory

    // Calculations
    const totalIncome = incomes.reduce((sum: number, i: any) => sum + i.amount, 0)
    const standardExpenses = expenses.reduce((sum: number, e: any) => sum + e.amount, 0)

    // Bills splitting
    const totalPaidBills = bills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + b.amount, 0)
    const totalRemainingBills = bills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + b.amount, 0)
    const combinedTotalBills = totalPaidBills + totalRemainingBills
    const currentBillsDisplay = totalRemainingBills // We will show remaining bills in the "Bills" card

    const totalPaidDebts = debts.filter((d: any) => d.isPaid).reduce((sum: number, d: any) => sum + d.monthlyPayment, 0)
    const totalDebtsPlanned = debts.reduce((sum: number, d: any) => sum + d.monthlyPayment, 0)
    const totalSavingsDeposits = savingsItems.reduce((sum: number, s: any) => sum + s.monthlyDeposit, 0)

    // Combined Outflows (everything that leaves the account)
    const totalExpenses = standardExpenses + totalPaidDebts + totalSavingsDeposits + totalPaidBills

    const prevTotalIncome = prevIncomes.reduce((sum: number, i: any) => sum + i.amount, 0)
    const prevStandardExpenses = prevExpenses.reduce((sum: number, e: any) => sum + e.amount, 0)

    const prevPaidBills = prevBills.filter((b: any) => b.isPaid).reduce((sum: number, b: any) => sum + b.amount, 0)
    const prevRemainingBills = prevBills.filter((b: any) => !b.isPaid).reduce((sum: number, b: any) => sum + b.amount, 0)
    const prevCombinedBills = prevPaidBills + prevRemainingBills

    const prevTotalPaidDebts = prevDebts.filter((d: any) => d.isPaid).reduce((sum: number, d: any) => sum + d.monthlyPayment, 0)
    const prevTotalSavingsDeposits = prevSavingsItems.reduce((sum: number, s: any) => sum + s.monthlyDeposit, 0)

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
    const incomeVsExpenses = [
        { name: 'הכנסות', value: totalIncome, color: COLORS.income }, // Added Income
        { name: 'הוצאות', value: totalExpenses, color: COLORS.expenses },
        { name: 'יתרה / חיסכון', value: Math.max(0, savingsRemainder), color: '#3B82F6' }, // Blue for Savings/Balance
        { name: 'חשבונות', value: totalRemainingBills, color: COLORS.bills },
        { name: 'חובות', value: totalDebtsPlanned, color: '#8B5CF6' } // Purple for Debts
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
            const category = categories.find(c => c.name === name)
            // Ensure we use the bold version of the color
            const colorClass = getBoldColor(category?.color || null)
            // For hex, we might need to map the bold class back to hex or just use a lookup if available
            // A simple hack: find the preset that matches the bold class name part (e.g. 'green')
            let colorHex = '#64748B' // slate-500
            const match = colorClass.match(/bg-(\w+)-500/)
            if (match && match[1]) {
                const preset = PRESET_COLORS.find(p => p.name.toLowerCase() === match[1])
                if (preset) colorHex = preset.hex
            } else {
                colorHex = getHexFromClass(category?.color || null)
            }

            return { name, value, colorHex, colorClass }
        })

    return (
        <div className="space-y-4 p-1" dir="rtl"> {/* Reduced padding and gap */}
            <div className="flex justify-between items-center mb-2"> {/* Reduced margin */}
                <div className="flex items-center gap-2">
                    <PieChartIcon className="h-6 w-6 text-black" />
                    <h2 className="text-xl font-bold tracking-tight">סקירה כללית</h2> {/* Smaller title */}
                </div>
                <div className="flex items-center gap-2">
                    <FeedbackButton />
                    <FinancialAdvisorButton
                        financialData={{
                            month,
                            year,
                            currency,
                            totalIncome,
                            totalExpenses,
                            savingsRemainder,
                            incomes,
                            expenses,
                            bills,
                            debts,
                            savings: savingsItems
                        }}
                    />
                    <Dialog open={isSettingsOpen} onOpenChange={(open) => {
                        setIsSettingsOpen(open)
                        if (open) loadSettings()
                    }}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                            <DialogHeader>
                                <DialogTitle className="text-right">הון עצמי</DialogTitle>
                                <DialogDescription className="text-right">
                                    הגדר את היתרה ההתחלתית עבור חישוב השווי הנקי
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="initialBalance" className="text-right">יתרת עו"ש התחלתית</Label>
                                    <Input
                                        id="initialBalance"
                                        value={initialBalance}
                                        onChange={(e) => setInitialBalance(e.target.value)}
                                        className="col-span-3 text-right"
                                        type="number"
                                        dir="ltr"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="initialSavings" className="text-right">חיסכון התחלתי</Label>
                                    <Input
                                        id="initialSavings"
                                        value={initialSavings}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val) && val < 0) return; // Prevent negative
                                            setInitialSavings(e.target.value)
                                        }}
                                        className="col-span-3 text-right"
                                        type="number"
                                        min={0}
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleSaveSettings}>
                                    שמור שינויים
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Summary Cards - Grid Gap 3 instead of 4, height auto */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="סך הכנסות"
                    value={formatCurrency(totalIncome, currency)}
                    icon={<TrendingUp className="h-4 w-4" />}
                    color="text-green-600"
                    bgColor="bg-green-50"
                    change={incomeChange}
                    changeType="income"
                    loading={loading}
                    onClick={() => onNavigateToTab?.('income')}
                />
                <StatCard
                    title="סך הוצאות"
                    value={formatCurrency(totalExpenses, currency)}
                    icon={<ArrowDown className="h-4 w-4" />}
                    color="text-red-600"
                    bgColor="bg-red-50"
                    change={expensesChange}
                    changeType="expense"
                    loading={loading}
                    onClick={() => onNavigateToTab?.('expenses')}
                />
                <StatCard
                    title="חיסכון חודשי"
                    value={formatCurrency(savingsRemainder, currency)}
                    icon={<PiggyBank className="h-4 w-4" />}
                    color="text-blue-600"
                    bgColor="bg-blue-50"
                    change={savingsChange}
                    changeType="income"
                    loading={loading}
                />
                <StatCard
                    title="יתרת חשבונות"
                    value={formatCurrency(currentBillsDisplay, currency)}
                    icon={<Wallet className="h-4 w-4" />}
                    color="text-orange-600"
                    bgColor="bg-orange-50"
                    change={billsChange}
                    changeType="expense"
                    loading={loading}
                    onClick={() => onNavigateToTab?.('bills')}
                />
            </div>

            {/* Charts Section - Gap 3 */}
            <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                    {/* Pie Chart - Reduced padding, height 350px */}
                    <div className="glass-panel p-4">
                        <div className="mb-2">
                            <h3 className="text-base font-bold text-[#323338]">התפלגות תקציב</h3>
                        </div>
                        <div className="h-[300px] w-full" dir="ltr">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (() => {
                                const realRemaining = totalIncome - (standardExpenses + combinedTotalBills + totalDebtsPlanned + totalSavingsDeposits);

                                const pieData = [
                                    { name: 'הכנסות', value: totalIncome, color: '#10B981' },
                                    { name: 'הוצאות', value: standardExpenses, color: COLORS.expenses },
                                    { name: 'חשבונות', value: combinedTotalBills, color: COLORS.bills },
                                    { name: 'חובות', value: totalDebtsPlanned, color: '#8B5CF6' },
                                    { name: 'חסכונות', value: totalSavingsDeposits, color: '#3B82F6' },
                                    { name: 'יתרה', value: Math.max(0, realRemaining), color: '#34D399' }
                                ].filter(item => item.value > 0);

                                if (pieData.length === 0) {
                                    return (
                                        <div className="h-full flex flex-col items-center justify-center text-center px-4" dir="rtl">
                                            <PieChartIcon className="h-12 w-12 text-gray-300 mb-3" />
                                            <p className="text-gray-500 font-medium mb-1">אין נתונים להצגה</p>
                                            <p className="text-sm text-gray-400">
                                                ניתן ללחוץ על כרטיסיות "הכנסות" ו"הוצאות" למילוי נתונים
                                            </p>
                                        </div>
                                    );
                                }

                                return (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip currency={currency} />} />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                content={(props) => {
                                                    const { payload } = props;
                                                    return (
                                                        <ul className="flex flex-nowrap justify-center gap-2 md:gap-4 text-[10px] md:text-xs text-gray-600 overflow-x-auto" dir="rtl">
                                                            {payload?.map((entry: any, index: number) => (
                                                                <li key={`item-${index}`} className="flex items-center gap-1 flex-shrink-0">
                                                                    <div
                                                                        className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full shrink-0"
                                                                        style={{ backgroundColor: entry.payload.color }}
                                                                    />
                                                                    <span className="font-medium text-[#323338] whitespace-nowrap">{entry.value}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    );
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Expenses Breakdown - Bar Chart */}
                    <div className="glass-panel p-4 flex flex-col">
                        <div className="mb-2">
                            <h3 className="text-base font-bold text-[#323338]">הוצאות לפי קטגוריה</h3>
                        </div>
                        <div className="h-[300px] w-full" dir="ltr">
                            {loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : expensesByCategory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-4" dir="rtl">
                                    <PieChartIcon className="h-12 w-12 text-gray-300 mb-3" />
                                    <p className="text-gray-500 font-medium mb-1">אין נתונים להצגה</p>
                                    <p className="text-sm text-gray-400">
                                        ניתן ללחוץ על כרטיסיית "הוצאות" למילוי נתונים
                                    </p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={expensesByCategory}
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fill: '#374151', fontSize: 12 }}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            height={60}
                                        />
                                        <YAxis
                                            tick={{ fill: '#374151', fontSize: 12 }}
                                            width={60}
                                        />
                                        <Tooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white p-2 border rounded shadow-md text-right" dir="rtl">
                                                            <p className="font-bold text-gray-900">{label}</p>
                                                            <p className="text-sm text-gray-500 font-medium" dir="ltr">
                                                                {currency === 'ILS' || currency === '₪' ? '₪' : currency} {Number(payload[0].value).toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={20}>
                                            {expensesByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.colorHex || '#EF4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className={`grid gap-3 ${netWorthHistory.length > 0 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
                    {/* ... NetWorth and BudgetProgress ... same logic but reduced padding/gaps */}
                    {/* I will assume NetWorthChart component handles its own internal sizing or I verify it */}
                    {netWorthHistory.length > 0 && (
                        <div className="grid gap-3">
                            <NetWorthChart data={netWorthHistory} />
                        </div>
                    )}

                    <Card className="h-full border-0 shadow-sm glass-panel bg-white/60">
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">מצב תקציב חודשי</CardTitle>
                        </CardHeader>
                        {loading ? (
                            <CardContent className="p-4 pt-0 flex items-center justify-center h-40">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </CardContent>
                        ) : totalIncome === 0 && standardExpenses === 0 && combinedTotalBills === 0 ? (
                            <CardContent className="p-4 pt-0 flex flex-col items-center justify-center h-40 text-center" dir="rtl">
                                <Wallet className="h-12 w-12 text-gray-300 mb-3" />
                                <p className="text-gray-500 font-medium mb-1">אין נתונים להצגה</p>
                                <p className="text-sm text-gray-400">
                                    ניתן ללחוץ על כרטיסיות "הכנסות" ו"הוצאות" למילוי נתונים
                                </p>
                            </CardContent>
                        ) : (
                            <CardContent className="p-4 pt-2">
                                {/* ... existing BudgetProgress content spaces ... */}
                                <div className="space-y-4">
                                    <BudgetProgress
                                        label="הוצאות שוטפות"
                                        current={standardExpenses}
                                        currency={currency}
                                        color="bg-red-500"
                                    />
                                    {/* ... others ... */}
                                    <BudgetProgress
                                        label="חשבונות (שולם)"
                                        current={totalPaidBills}
                                        total={combinedTotalBills}
                                        currency={currency}
                                        color="bg-orange-500"
                                    />
                                    <BudgetProgress
                                        label="חובות ששולמו"
                                        current={totalPaidDebts}
                                        total={totalDebtsPlanned}
                                        currency={currency}
                                        color="bg-purple-500"
                                    />
                                    <BudgetProgress
                                        label="חיסכון והפקדות"
                                        current={totalSavingsDeposits}
                                        total={totalIncome}
                                        currency={currency}
                                        color="bg-blue-500"
                                    />
                                    <div className="pt-3 border-t">
                                        {/* ... */}
                                        {/* Reuse existing logic */}
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-semibold">ניצול תקציב כולל</span>
                                            <span className="text-xs font-bold">
                                                {totalIncome > 0 ? (((totalExpenses) / totalIncome) * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div
                                                className="bg-green-600 h-2.5 rounded-full transition-all"
                                                style={{ width: `${Math.min(totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    )
}

function StatCard({
    title, value, icon, color, bgColor, change, changeType = 'income', loading = false, onClick
}: {
    title: string
    value: string
    icon: React.ReactNode
    color: string
    bgColor: string
    change?: number
    changeType?: 'income' | 'expense'
    loading?: boolean
    onClick?: () => void
}) {
    const isPositiveChange = change !== undefined ? change > 0 : false
    const ChangeIcon = isPositiveChange ? TrendingUp : ArrowDown

    // For income: positive change is good (green), negative is bad (red)
    // For expense: positive change is bad (red), negative is good (green)
    let changeColor = ''
    if (changeType === 'income') {
        changeColor = isPositiveChange ? 'text-green-600' : 'text-red-600'
    } else {
        changeColor = isPositiveChange ? 'text-red-600' : 'text-green-600'
    }

    // Border color matches the icon color, but lighter
    // const borderColorClass = color.replace('text-', 'border-').replace('600', '200') // Not used in current style? using border-l-4

    // Reduced padding p-5 -> p-4, height 140 -> 110 or auto
    return (
        <div
            onClick={onClick}
            className={`monday-card p-4 relative overflow-hidden flex flex-col justify-between min-h-[110px] border-l-4 ${color.replace('text-', 'border-l-')} ${onClick ? 'md:cursor-default cursor-pointer active:scale-95 transition-transform' : ''}`}
        >
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xs font-medium text-gray-500 mb-0.5">{title}</h3>
                    <div className={`text-xl font-bold text-[#323338] tracking-tight ${loading ? 'animate-pulse' : ''}`}>
                        {loading ? <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> : value}
                    </div>
                </div>
                <div className={`${bgColor} ${color} p-2 rounded-lg shadow-sm opacity-100`}> {/* Opacity 100 forced */}
                    {icon}
                </div>
            </div>

            {change !== undefined && change !== 0 && !isNaN(change) && (
                <div className={`flex items-center gap-1.5 text-[11px] font-medium ${changeColor} mt-2`}>
                    <div className={`flex items-center justify-center w-4 h-4 rounded-full ${isPositiveChange ? 'bg-green-100' : 'bg-red-100'} ${changeType === 'expense' && isPositiveChange ? 'bg-red-100' : 'bg-green-100'}`}>
                        {/* Logic for bg color is slightly doubled up but safe */}
                        <ChangeIcon className="h-2.5 w-2.5" />
                    </div>
                    <span>{Math.abs(change).toFixed(1)}%</span>
                    <span className="text-gray-400 font-normal">חודש שעבר</span>
                </div>
            )}
        </div>
    )
}

function BudgetProgress({
    label,
    current,
    total,
    currency,
    color,
}: {
    label: string
    current: number
    total: number
    currency: string
    color: string
}) {
    const percentage = total > 0 ? (current / total) * 100 : 0

    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-xs font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                    {formatCurrency(total, currency)} / {formatCurrency(current, currency)}
                </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                    className={`${color} h-2 rounded-full transition-all`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5 text-left">
                <span dir="ltr">{percentage.toFixed(1)}%</span>
            </p>
        </div>
    )
}

