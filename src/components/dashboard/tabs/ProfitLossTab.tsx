'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Download,
    FileText,
    AlertCircle,
    Save,
    Search,
    Check, Loader2, Pencil, Plus, Trash2, X,
    ShoppingCart, Utensils, Bus, Heart, GraduationCap, Popcorn,
    Fuel, Car, Phone, Smartphone, Briefcase, Zap, Home, Plane, RefreshCw,
    Umbrella, Dumbbell, Shield, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getProfitLossData, type ProfitLossReport, type TransactionItem } from '@/lib/actions/reports'
import { formatCurrency, formatNumberWithCommas } from '@/lib/utils'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { saveBkmvData } from '@/lib/actions/stored-reports'
import { useDemo } from '@/contexts/DemoContext'
import { ProfitLossTutorial } from '@/components/dashboard/tutorial/ProfitLossTutorial'

// ...

// Helper functions for icons and colors
const getCategoryIcon = (name: string) => {
    const trimmed = name?.trim() || '';

    // Fuzzy matching for common variations
    if (trimmed.includes('אפליקציות') || trimmed.includes('מינוי')) return <Smartphone className="h-4 w-4" />
    if (trimmed.includes('ביטוח')) return <Shield className="h-4 w-4" />
    if (trimmed.includes('ביגוד') || trimmed.includes('בגדים')) return <ShoppingCart className="h-4 w-4" />
    if (trimmed.includes('אוכל') || trimmed.includes('מזון') || trimmed.includes('מסעדה')) return <Utensils className="h-4 w-4" />
    if (trimmed.includes('מסיבה') || trimmed.includes('בילוי')) return <Popcorn className="h-4 w-4" />
    if (trimmed.includes('קבוע')) return <RefreshCw className="h-4 w-4" />

    switch (trimmed) {
        case 'תחבורה': return <Bus className="h-4 w-4" />
        case 'קניות': return <ShoppingCart className="h-4 w-4" />
        case 'בריאות': return <Heart className="h-4 w-4" />
        case 'חינוך': return <GraduationCap className="h-4 w-4" />
        case 'דלק': return <Fuel className="h-4 w-4" />
        case 'חנייה': return <Car className="h-4 w-4" />
        case 'תקשורת': return <Phone className="h-4 w-4" />
        case 'משכורת': return <Briefcase className="h-4 w-4" />
        case 'חשמל': return <Zap className="h-4 w-4" />
        case 'שכירות': return <Home className="h-4 w-4" />
        case 'חופשה': return <Plane className="h-4 w-4" />
        case 'ספורט': return <Dumbbell className="h-4 w-4" />
        default: return <span className="text-xs font-bold">{typeof name === 'string' ? name.charAt(0) : '?'}</span>
    }
}

const getCategoryColor = (catName: string) => {
    const trimmed = catName?.trim() || '';

    // Specific colors
    if (trimmed.includes('ספורט')) return 'bg-green-500 text-white border-green-600';
    if (trimmed.includes('ביטוח')) return 'bg-blue-500 text-white border-blue-600';
    if (trimmed.includes('אפליקציות') || trimmed.includes('מינוי')) return 'bg-purple-500 text-white border-purple-600';
    if (trimmed.includes('מזון') || trimmed.includes('אוכל')) return 'bg-red-500 text-white border-red-600';
    if (trimmed.includes('תחבורה')) return 'bg-cyan-500 text-white border-cyan-600';
    if (trimmed.includes('בילוי')) return 'bg-pink-500 text-white border-pink-600';

    // Default fallback
    return 'bg-gray-500 text-white border-gray-600';
}

export default function ProfitLossTab() {
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
    const [viewType, setViewType] = useState<'ANNUAL' | 'BI_MONTHLY' | 'MONTHLY'>('ANNUAL')
    const [selectedPeriod, setSelectedPeriod] = useState<{ label: string, from: Date, to: Date } | null>(null)
    const [reportData, setReportData] = useState<ProfitLossReport | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showTutorial, setShowTutorial] = useState(false)

    const currentYear = new Date().getFullYear()


    const [registrationDate, setRegistrationDate] = useState<Date | null>(null)
    const [years, setYears] = useState<number[]>([new Date().getFullYear()])

    const { isDemo, data: demoData, interceptAction } = useDemo()

    useEffect(() => {
        import('@/lib/actions/user').then(({ getUserRegistrationDate }) => {
            getUserRegistrationDate().then(date => {
                if (date) {
                    const regDate = new Date(date)
                    setRegistrationDate(regDate)

                    // Generate years from registration to current + 1
                    const startYear = regDate.getFullYear()
                    const endYear = new Date().getFullYear() + 1
                    const yearList = []
                    for (let y = startYear; y <= endYear; y++) {
                        yearList.push(y)
                    }
                    setYears(yearList)
                    // Ensure selected year is valid
                    if (selectedYear < startYear) setSelectedYear(endYear - 1)
                }
            })
        })
    }, [])

    useEffect(() => {
        if (selectedPeriod && isDetailOpen) {
            fetchReport(selectedPeriod)
        }
    }, [selectedPeriod, isDetailOpen])

    const fetchReport = async (period: { from: Date, to: Date }) => {
        setIsLoading(true)
        if (isDemo) {
            // Simulate network delay
            setTimeout(() => {
                setReportData(demoData.profitLoss as any)
                setIsLoading(false)
            }, 600)
            return
        }

        try {
            // Use the updated action that accepts dateRange
            const result = await getProfitLossData(selectedYear, { from: period.from, to: period.to })
            if (result.success && result.data) {
                setReportData(result.data)
            } else {
                toast.error(result.error || 'שגיאה בטעינת הדוח')
            }
        } catch (err) {
            toast.error('שגיאה בתקשורת')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownloadPDF = async (year: number) => {
        if (isDemo) { interceptAction(); return; }
        try {
            const response = await fetch(`/api/reports/profit-loss/${year}/pdf`)
            if (!response.ok) throw new Error('Download failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `profit-loss-${year}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (e) {
            toast.error('שגיאה בהורדת הדו"ח')
        }
    }

    const handleSaveReport = async (year: number) => {
        if (isDemo) { interceptAction(); return; }
        toast.info('שומר דוח במערכת...')
        const result = await saveBkmvData(year)
        if (result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.error || 'שגיאה בשמירת הדוח')
        }
    }

    const handlePeriodSelect = (period: { label: string, from: Date, to: Date }) => {
        setSelectedPeriod(period)
        setIsDetailOpen(true)
    }

    // Helper to generate periods based on view type
    const getPeriods = () => {
        const periods: { label: string, status: 'OPEN' | 'CLOSED' | 'FUTURE', from: Date, to: Date }[] = []
        const now = new Date()

        // Registration date check (default to beginning of time if not loaded)
        // We only care about start date filtering
        const startDateLimit = registrationDate || new Date(0)
        // Reset time to start of day
        startDateLimit.setHours(0, 0, 0, 0)

        if (viewType === 'ANNUAL') {
            const start = new Date(selectedYear, 0, 1)
            const end = new Date(selectedYear, 11, 31)

            // Filter: If period ends before registration, skip it
            if (end < startDateLimit) return []

            let status: 'OPEN' | 'CLOSED' | 'FUTURE' = 'CLOSED'
            if (selectedYear === currentYear) status = 'OPEN'
            if (selectedYear > currentYear) status = 'FUTURE'

            periods.push({ label: `דוח שנתי ${selectedYear}`, status, from: start, to: end })
        } else if (viewType === 'BI_MONTHLY') {
            const monthPairs = [
                { names: 'ינואר - פברואר', start: 0, end: 1 },
                { names: 'מרץ - אפריל', start: 2, end: 3 },
                { names: 'מאי - יוני', start: 4, end: 5 },
                { names: 'יולי - אוגוסט', start: 6, end: 7 },
                { names: 'ספטמבר - אוקטובר', start: 8, end: 9 },
                { names: 'נובמבר - דצמבר', start: 10, end: 11 },
            ]

            monthPairs.forEach(pair => {
                const start = new Date(selectedYear, pair.start, 1)
                const end = new Date(selectedYear, pair.end + 1, 0)

                // Filter: Skip if period ends before registration
                if (end < startDateLimit) return

                let status: 'OPEN' | 'CLOSED' | 'FUTURE' = 'FUTURE'

                if (end < now) status = 'CLOSED'
                else if (start <= now && end >= now) status = 'OPEN'

                periods.push({ label: pair.names, status, from: start, to: end })
            })
        } else if (viewType === 'MONTHLY') {
            const months = [
                'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
                'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
            ]

            months.forEach((name, index) => {
                const start = new Date(selectedYear, index, 1)
                const end = new Date(selectedYear, index + 1, 0)

                // Filter: Skip if period ends before registration
                if (end < startDateLimit) return

                let status: 'OPEN' | 'CLOSED' | 'FUTURE' = 'FUTURE'

                if (end < now) status = 'CLOSED'
                else if (start <= now && end >= now) status = 'OPEN'

                periods.push({ label: name, status, from: start, to: end })
            })
        }

        return periods
    }

    const isYearCompleted = (year: number) => year < currentYear

    const formatMoney = (amount: number) => {
        return (
            <span className="inline-block whitespace-nowrap" dir="rtl">
                {formatNumberWithCommas(Number(amount || 0))} ₪
            </span>
        )
    }

    return (
        <div className="space-y-6 md:space-y-8 p-2 md:p-6" dir="rtl">
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">דוחות רווח והפסד</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowTutorial(true)}
                        className="h-8 w-8"
                        title="הדרכה"
                    >
                        <Info className="h-4 w-4" />
                    </Button>
                </div>
                <p className="text-gray-500">צפייה והורדת דוחות שנתיים עבור העסק</p>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between glass-panel p-4 rounded-xl">
                <div id="pl-view-toggle" className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewType('ANNUAL')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewType === 'ANNUAL' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        שנתי
                    </button>
                    <button
                        onClick={() => setViewType('BI_MONTHLY')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewType === 'BI_MONTHLY' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        דו-חודשי
                    </button>
                    <button
                        onClick={() => setViewType('MONTHLY')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${viewType === 'MONTHLY' ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        חודשי
                    </button>
                </div>

                <div id="pl-year-selector" className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">שנה:</span>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="h-9 px-3 py-1 rounded-md border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div id="pl-periods-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {getPeriods().map((period, idx) => (
                    <Card key={idx} className="p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group border-t-4 border-t-transparent hover:border-t-emerald-500">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">{period.label}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`inline-block w-2 h-2 rounded-full 
                                        ${period.status === 'CLOSED' ? 'bg-gray-400' :
                                            period.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-300'}`}
                                    />
                                    <p className="text-xs font-medium text-gray-500">
                                        {period.status === 'CLOSED' ? 'סגור' :
                                            period.status === 'OPEN' ? 'פתוח' : 'עתידי'}
                                    </p>
                                </div>
                            </div>
                            <FileText className={`transition-all duration-300 
                                ${period.status === 'OPEN' ? 'text-emerald-500' : 'text-gray-300'} 
                                group-hover:scale-110`}
                                size={32}
                            />
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            {period.status !== 'FUTURE' ? (
                                <Button
                                    variant="outline"
                                    className="w-full group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:border-emerald-200"
                                    onClick={() => handlePeriodSelect(period)}
                                >
                                    צפה בדוח
                                </Button>
                            ) : (
                                <div className="text-center py-2 text-sm text-gray-400 bg-gray-50 rounded-md select-none">
                                    טרם הגיע מועד הדוח
                                </div>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {/* Report Dialog */}
            <Dialog open={isDetailOpen} onOpenChange={(open) => !open && setIsDetailOpen(false)}>
                <DialogContent className="w-full sm:max-w-[95vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-3 md:p-6" dir="rtl">
                    <DialogHeader className="flex flex-col gap-3 md:gap-4 mt-8 md:mt-0">
                        <DialogTitle className="text-xl md:text-2xl font-bold text-center">
                            דוח רווח והפסד - {selectedPeriod?.label.includes(selectedYear.toString()) ? selectedPeriod?.label : `${selectedPeriod?.label} ${selectedYear}`}
                        </DialogTitle>

                        {/* Centered Action Buttons */}
                        <div className="grid grid-cols-2 md:flex md:flex-row justify-center gap-3 md:gap-4 w-full">
                            <Button variant="outline" onClick={() => selectedPeriod && fetchReport(selectedPeriod)} disabled={isLoading} className="gap-2 w-full md:min-w-[200px]">
                                <span className="hidden sm:inline">רענן נתונים</span>
                                <span className="sm:hidden">רענן</span>
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button variant="outline" onClick={() => handleDownloadPDF(selectedYear!)} className="gap-2 w-full md:min-w-[200px]">
                                <span className="hidden sm:inline">הורד PDF</span>
                                <span className="sm:hidden">PDF</span>
                                <Download size={16} />
                            </Button>
                        </div>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="py-20 text-center">טוען נתונים...</div>
                    ) : reportData ? (
                        <div className="mt-6 space-y-8">
                            {/* Summary Cards */}
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 direction-rtl">
                                <Card className="p-4 md:p-6 bg-emerald-50 border-emerald-100">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="p-2 md:p-3 bg-emerald-100 rounded-full text-emerald-600">
                                            <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-emerald-700 font-medium">סה"כ הכנסות (חייבות)</p>
                                            <h3 className="text-lg md:text-2xl font-bold text-emerald-900">{formatMoney(reportData.revenue.taxable)}</h3>
                                            <p className="text-[10px] md:text-xs text-emerald-600 mt-1">מע"מ: {formatMoney(reportData.revenue.vat)}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4 md:p-6 bg-red-50 border-red-100">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="p-2 md:p-3 bg-red-100 rounded-full text-red-600">
                                            <TrendingDown className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-red-700 font-medium">סה"כ הוצאות (מוכרות)</p>
                                            <h3 className="text-lg md:text-2xl font-bold text-red-900">{formatMoney(reportData.expenses.recognized)}</h3>
                                            <p className="text-[10px] md:text-xs text-red-600 mt-1">מע"מ: {formatMoney(reportData.expenses.vatRecognized)}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-4 md:p-6 bg-blue-50 border-blue-100">
                                    <div className="flex items-center gap-3 md:gap-4">
                                        <div className="p-2 md:p-3 bg-blue-100 rounded-full text-blue-600">
                                            <DollarSign className="h-5 w-5 md:h-6 md:w-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs md:text-sm text-blue-700 font-medium">רווח נקי</p>
                                            <h3 className="text-lg md:text-2xl font-bold text-blue-900">{formatMoney(reportData.netProfit)}</h3>
                                            <p className="text-[10px] md:text-xs text-blue-600 mt-1">לפני מס הכנסה</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Detailed Tables */}
                            {/* Detailed Tables */}
                            <Tabs defaultValue="incomes" className="w-full">
                                <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-4 mb-4 border-b pb-0">
                                    <div className="relative w-full md:w-auto md:min-w-[300px] mb-4 md:mb-0">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <Input
                                            placeholder="חיפוש לפי שם, תיאור או מספר"
                                            className="pl-10"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <TabsList className="w-full md:w-auto justify-end border-b-0 rounded-none h-auto p-0 bg-transparent gap-4 sm:gap-6 overflow-x-auto hide-scrollbar">
                                        <TabsTrigger value="incomes" className="data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 border-b-2 border-transparent rounded-none pb-4 text-base sm:text-lg whitespace-nowrap">
                                            הכנסות ({reportData.transactions.filter(t => t.type === 'INVOICE' || t.type === 'CREDIT_NOTE' || t.type === 'INCOME').length})
                                        </TabsTrigger>
                                        <TabsTrigger value="expenses" className="data-[state=active]:border-red-500 data-[state=active]:text-red-600 border-b-2 border-transparent rounded-none pb-4 text-base sm:text-lg whitespace-nowrap">
                                            הוצאות ({reportData.transactions.filter(t => t.type === 'EXPENSE').length})
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TransactionsTable
                                    data={reportData.transactions.filter(t => t.type === 'INVOICE' || t.type === 'CREDIT_NOTE' || t.type === 'INCOME')}
                                    type="income"
                                    searchTerm={searchTerm}
                                />
                                <TransactionsTable
                                    data={reportData.transactions.filter(t => t.type === 'EXPENSE')}
                                    type="expense"
                                    searchTerm={searchTerm}
                                />
                            </Tabs>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            לא נמצאו נתונים להצגה
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t flex items-center justify-center text-gray-400 text-sm gap-1">
                        <span>הופק ע"י Kesefly</span>
                        <span>•</span>
                        <span>{new Date().toLocaleDateString('he-IL')}</span>
                    </div>
                </DialogContent>
            </Dialog>

            <ProfitLossTutorial
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />
        </div>
    )
}

function TransactionsTable({ data, type, searchTerm }: { data: TransactionItem[], type: 'income' | 'expense', searchTerm: string }) {
    const filteredTransactions = data.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.number?.includes(searchTerm)
    )

    // Sort by date descending
    const sortedData = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Group by month
    const groupedByMonth = sortedData.reduce((acc: any, t) => {
        const monthKey = new Date(t.date).toLocaleString('he-IL', { month: 'long', year: 'numeric' })
        if (!acc[monthKey]) acc[monthKey] = []
        acc[monthKey].push(t)
        return acc
    }, {})

    return (
        <TabsContent value={type === 'income' ? 'incomes' : 'expenses'} className="space-y-6 mt-6">
            {!filteredTransactions.length ? (
                <div className="py-8 text-center text-gray-500">
                    {searchTerm ? 'לא נמצאו נתונים עבור החיפוש' : 'אין נתונים להצגה'}
                </div>
            ) : (
                Object.entries(groupedByMonth).map(([month, transactions]) => (
                    <div key={month} className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-700 sticky top-0 bg-white py-2 z-10 border-b text-right">
                            {month}
                        </h4>
                        <TransactionList filtered={transactions as TransactionItem[]} type={type} />
                    </div>
                ))
            )}
        </TabsContent>
    )
}

function TransactionList({ filtered, type }: { filtered: TransactionItem[], type: 'income' | 'expense' }) {
    const formatMoney = (amount: number) => (
        <span className="inline-block whitespace-nowrap" dir="rtl">
            {formatNumberWithCommas(Number(amount || 0))} ₪
        </span>
    )

    return (
        <div>
            {/* Desktop View (Table) */}
            <div className="hidden md:block border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="text-center w-[120px]">נטו</TableHead>
                            <TableHead className="text-center w-[100px]">מע"מ</TableHead>
                            <TableHead className="text-center w-[120px]">סכום ברוטו</TableHead>
                            <TableHead className="text-center">תיאור</TableHead>
                            <TableHead className="text-center">{type === 'income' ? 'לקוח' : 'ספק'}</TableHead>
                            <TableHead className="text-center">אסמכתא</TableHead>
                            <TableHead className="text-center w-[120px]">תאריך</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                    לא נמצאו נתונים
                                </TableCell>
                            </TableRow>
                        ) : filtered.map((t) => (
                            <TableRow key={t.id} className="hover:bg-gray-50">
                                <TableCell className="text-center font-bold">{formatMoney(t.amountNet)}</TableCell>
                                <TableCell className="text-center text-gray-500">{formatMoney(t.vat)}</TableCell>
                                <TableCell className="text-center text-muted-foreground line-through decoration-red-500/30 decoration-1">{formatMoney(t.amount)}</TableCell>
                                <TableCell className="text-center max-w-[200px] truncate" title={t.description}>{t.description}</TableCell>
                                <TableCell className="text-center">{t.entityName || '-'}</TableCell>
                                <TableCell className="text-center font-medium">
                                    {t.type === 'CREDIT_NOTE' && <Badge variant="outline" className="text-red-600 border-red-200 ml-2">זיכוי</Badge>}
                                    {t.number || '-'}
                                </TableCell>
                                <TableCell className="text-center text-gray-500">{new Date(t.date).toLocaleDateString('he-IL')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-3">
                {filtered.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                        לא נמצאו נתונים
                    </div>
                ) : filtered.map((t) => (
                    <div key={t.id} className="glass-panel p-3 sm:p-4 rounded-xl border border-gray-100 shadow-sm bg-white hover:shadow-md transition-all">
                        <div className="flex flex-row items-center justify-between gap-3">
                            {/* Right Side: Icon & Info */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="shrink-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${t.category ? getCategoryColor(t.category) : 'bg-gray-100 text-gray-500'}`}>
                                        {t.category ? getCategoryIcon(t.category) : <FileText size={16} />}
                                    </div>
                                </div>
                                <div className="flex flex-col min-w-0 gap-0.5">
                                    <div className="font-bold text-gray-900 text-sm truncate">
                                        {t.description}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>{new Date(t.date).toLocaleDateString('he-IL')}</span>
                                        {t.category && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                <span className="truncate max-w-[100px]">{t.category}</span>
                                            </>
                                        )}
                                        {t.entityName && (
                                            <>
                                                <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                                <span className="truncate max-w-[100px]">{t.entityName}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Left Side: Amount */}
                            <div className="flex flex-col items-end shrink-0 pl-1">
                                <div className={`text-base font-bold ${t.type === 'INVOICE' || t.type === 'CREDIT_NOTE' || t.type === 'INCOME' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {formatMoney(t.amount)}
                                </div>
                                {(t.vat > 0 || t.amountNet !== t.amount) && (
                                    <div className="text-[10px] text-gray-400">
                                        נטו: {formatMoney(t.amountNet)}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
