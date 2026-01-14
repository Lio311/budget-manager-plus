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
    Umbrella, Dumbbell, Shield
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
    const [selectedYear, setSelectedYear] = useState<number | null>(null)
    const [reportData, setReportData] = useState<ProfitLossReport | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const currentYear = new Date().getFullYear()
    const availableYears = [2025, 2026]

    const { isDemo, data: demoData, interceptAction } = useDemo()

    useEffect(() => {
        if (selectedYear) {
            fetchReport(selectedYear)
        }
    }, [selectedYear])

    const fetchReport = async (year: number) => {
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
            const result = await getProfitLossData(year)
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

    const handleYearSelect = (year: number) => {
        setSelectedYear(year)
        setIsDetailOpen(true)
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
                <h1 className="text-3xl font-bold">דוחות רווח והפסד</h1>
                <p className="text-gray-500">צפייה והורדת דוחות שנתיים עבור העסק</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availableYears.map(year => (
                    <Card key={year} className="p-6 hover:shadow-lg transition-shadow cursor-pointer relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-2 h-full bg-emerald-500" />
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-bold">{year}</h3>
                                <p className="text-sm text-gray-500">
                                    {isYearCompleted(year) ? 'דוח סגור וזמין' : 'שנה נוכחית'}
                                </p>
                            </div>
                            <FileText className="text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity" size={48} />
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100">
                            {isYearCompleted(year) ? (
                                <Button
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                    onClick={() => handleYearSelect(year)}
                                >
                                    צפה בדוח שנתי
                                </Button>
                            ) : (
                                <div className="text-center py-2 text-sm text-gray-400 bg-gray-50 rounded-md">
                                    הדו"ח יהיה זמין בסוף השנה
                                </div>
                            )}
                        </div>

                        {/* Footer with Logo */}
                        {isYearCompleted(year) && (
                            <div className="mt-6 pt-4 border-t flex justify-between items-center opacity-60 text-xs">
                                <span>הופק ע"י Kesefly בתאריך {new Date().toLocaleDateString('he-IL')}</span>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {/* Report Dialog */}
            <Dialog open={!!selectedYear && isDetailOpen && isYearCompleted(selectedYear!)} onOpenChange={(open) => !open && setIsDetailOpen(false)}>
                <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-4 md:p-6">
                    <DialogHeader className="flex flex-col gap-4">
                        <DialogTitle className="text-2xl font-bold text-center">
                            דוח רווח והפסד - {selectedYear}
                        </DialogTitle>

                        {/* Centered Action Buttons */}
                        <div className="flex flex-col md:flex-row justify-center gap-4 w-full">
                            <Button variant="outline" onClick={() => fetchReport(selectedYear!)} disabled={isLoading} className="gap-2 min-w-[200px]">
                                רענן נתונים
                                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button variant="outline" onClick={() => handleDownloadPDF(selectedYear!)} className="gap-2 min-w-[200px]">
                                הורד PDF
                                <Download size={16} />
                            </Button>
                        </div>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="py-20 text-center">טוען נתונים...</div>
                    ) : reportData ? (
                        <div className="mt-6 space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 direction-rtl">
                                <Card className="p-6 bg-emerald-50 border-emerald-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-emerald-700 font-medium">סה"כ הכנסות (חייבות)</p>
                                            <h3 className="text-2xl font-bold text-emerald-900">{formatMoney(reportData.revenue.taxable)}</h3>
                                            <p className="text-xs text-emerald-600 mt-1">מע"מ: {formatMoney(reportData.revenue.vat)}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-red-50 border-red-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-100 rounded-full text-red-600">
                                            <TrendingDown size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-red-700 font-medium">סה"כ הוצאות (מוכרות)</p>
                                            <h3 className="text-2xl font-bold text-red-900">{formatMoney(reportData.expenses.recognized)}</h3>
                                            <p className="text-xs text-red-600 mt-1">מע"מ: {formatMoney(reportData.expenses.vatRecognized)}</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6 bg-blue-50 border-blue-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                            <DollarSign size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-blue-700 font-medium">רווח נקי</p>
                                            <h3 className="text-2xl font-bold text-blue-900">{formatMoney(reportData.netProfit)}</h3>
                                            <p className="text-xs text-blue-600 mt-1">לפני מס הכנסה</p>
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
                        <div className="flex flex-row-reverse items-center justify-between gap-3">
                            {/* Left Side: Icon & Info */}
                            <div className="flex flex-row-reverse items-center gap-3 flex-1 min-w-0 text-right">
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

                            {/* Right Side: Amount */}
                            <div className="flex flex-col items-start shrink-0 pl-1">
                                <div className={`text-base font-bold ${t.type === 'INVOICE' || t.type === 'CREDIT_NOTE' ? 'text-emerald-600' : 'text-red-600'}`}>
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
