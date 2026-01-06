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
    Search
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
import { formatCurrency } from '@/lib/utils'
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

// ...

export default function ProfitLossTab() {
    const [selectedYear, setSelectedYear] = useState<number | null>(null)
    const [reportData, setReportData] = useState<ProfitLossReport | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const currentYear = new Date().getFullYear()
    const availableYears = [2025, 2026]

    useEffect(() => {
        if (selectedYear) {
            fetchReport(selectedYear)
        }
    }, [selectedYear])

    const fetchReport = async (year: number) => {
        setIsLoading(true)
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

    const formatMoney = (amount: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount)

    return (
        <div className="space-y-8 p-6" dir="rtl">
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

                        {isYearCompleted(year) ? (
                            <div className="flex gap-2 mt-4">
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleYearSelect(year)}>
                                    צפייה בדוח
                                </Button>
                            </div>
                        ) : (
                            <div className="mt-4 bg-gray-100 text-gray-600 p-3 rounded-lg text-sm text-center font-medium">
                                הדו"ח יהיה זמין בסוף השנה
                            </div>
                        )}

                        {/* Footer with Logo */}
                        <div className="mt-6 pt-4 border-t flex justify-between items-center opacity-60 text-xs">
                            <span>הופק ע"י Keseflow בתאריך {new Date().toLocaleDateString('he-IL')}</span>
                        </div>
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
                            <Button variant="outline" onClick={() => handleDownloadPDF(selectedYear!)} className="gap-2 min-w-[200px]">
                                <Download size={16} />
                                הורד PDF
                            </Button>
                            <Button variant="default" onClick={() => handleSaveReport(selectedYear!)} className="gap-2 min-w-[200px]">
                                <Save size={16} />
                                שמור למערכת
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
                                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <Input
                                            placeholder="חיפוש לפי שם, תיאור או מספר..."
                                            className="pr-10"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <TabsList className="w-full md:w-auto justify-end border-b-0 rounded-none h-auto p-0 bg-transparent gap-4 sm:gap-6 overflow-x-auto hide-scrollbar">
                                        <TabsTrigger value="incomes" className="data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 border-b-2 border-transparent rounded-none pb-4 text-base sm:text-lg whitespace-nowrap">
                                            הכנסות ({reportData.transactions.filter(t => t.type === 'INVOICE' || t.type === 'CREDIT_NOTE').length})
                                        </TabsTrigger>
                                        <TabsTrigger value="expenses" className="data-[state=active]:border-red-500 data-[state=active]:text-red-600 border-b-2 border-transparent rounded-none pb-4 text-base sm:text-lg whitespace-nowrap">
                                            הוצאות ({reportData.transactions.filter(t => t.type === 'EXPENSE').length})
                                        </TabsTrigger>
                                    </TabsList>
                                </div>

                                <TransactionsTable
                                    data={reportData.transactions.filter(t => t.type === 'INVOICE' || t.type === 'CREDIT_NOTE')}
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
                        <span>הופק ע"י Keseflow</span>
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
    const formatMoney = (amount: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount)

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
                                <TableCell className="text-center ltr font-mono font-bold">{formatMoney(t.amountNet)}</TableCell>
                                <TableCell className="text-center ltr font-mono text-gray-500">{formatMoney(t.vat)}</TableCell>
                                <TableCell className="text-center ltr font-mono">{formatMoney(t.amount)}</TableCell>
                                <TableCell className="text-center max-w-[200px] truncate" title={t.description}>{t.description}</TableCell>
                                <TableCell className="text-center">{t.entityName || '-'}</TableCell>
                                <TableCell className="text-center font-medium">
                                    {t.type === 'CREDIT_NOTE' && <Badge variant="outline" className="text-red-600 border-red-200 ml-2">זיכוי</Badge>}
                                    {t.number || '-'}
                                </TableCell>
                                <TableCell className="text-center">{new Date(t.date).toLocaleDateString('he-IL')}</TableCell>
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
                    <div key={t.id} className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                        <div className="flex justify-between items-start flex-row-reverse">
                            <div className="text-left w-[40%]" dir="ltr">
                                <div className="font-bold font-mono text-lg flex gap-1 items-center justify-start text-gray-900">
                                    <span className="text-sm">₪</span>
                                    <span>{t.amount.toLocaleString()}</span>
                                </div>
                                <div className="text-xs text-gray-400 font-mono flex gap-1 justify-start">
                                    <span>נטו:</span>
                                    <span>₪{t.amountNet.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="text-right flex-1">
                                <div className="font-bold text-gray-900 line-clamp-1">{t.description}</div>
                                <div className="text-sm text-gray-500 truncate">{t.entityName || '-'}</div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                            <div className="text-gray-500">
                                {new Date(t.date).toLocaleDateString('he-IL')}
                            </div>
                            <div className="flex items-center gap-2">
                                {t.type === 'CREDIT_NOTE' && <Badge variant="outline" className="text-red-600 border-red-200">זיכוי</Badge>}
                                {t.number && (
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono text-xs">
                                        #{t.number}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
