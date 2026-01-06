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
    ChevronDown,
    ChevronUp,
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
import { downloadOpenFormat } from '@/lib/actions/open-format'

export default function ProfitLossTab() {
    const [selectedYear, setSelectedYear] = useState<number | null>(null)
    const [reportData, setReportData] = useState<ProfitLossReport | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)

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

    const handleDownloadOpenFormat = async (year: number) => {
        toast.info('מכין קבצים להורדה...')
        const result = await downloadOpenFormat(year)
        if (result.success && result.data) {
            const downloadFile = (content: string, filename: string) => {
                const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            }

            downloadFile(result.data.ini, 'INI.TXT')
            downloadFile(result.data.bkmv, 'BKMVDATA.TXT')
            toast.success('הקבצים ירדו בהצלחה')
        } else {
            toast.error(result.error || 'שגיאה בהורדת הקבצים')
        }
    }

    const handleYearSelect = (year: number) => {
        setSelectedYear(year)
        setIsDetailOpen(true)
    }

    const isYearCompleted = (year: number) => year < currentYear

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
                            <span>הופק ע"י Keseflow</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Report Dialog */}
            <Dialog open={!!selectedYear && isDetailOpen && isYearCompleted(selectedYear!)} onOpenChange={(open) => !open && setIsDetailOpen(false)}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-full">
                    <DialogHeader className="flex flex-col gap-4">
                        <DialogTitle className="text-2xl font-bold text-center">
                            דוח רווח והפסד - {selectedYear}
                        </DialogTitle>

                        {/* Centered Action Buttons */}
                        <div className="flex justify-center gap-4 w-full">
                            <Button variant="outline" className="gap-2 min-w-[140px]">
                                הורד PDF
                                <Download size={16} />
                            </Button>
                            <Button variant="outline" onClick={() => handleDownloadOpenFormat(selectedYear!)} className="gap-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 min-w-[140px]">
                                הורד BKMVDATA
                                <Download size={16} />
                            </Button>
                        </div>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="py-20 text-center">טוען נתונים...</div>
                    ) : reportData ? (
                        <ReportDetailView data={reportData} />
                    ) : (
                        <div className="py-20 text-center text-red-500">לא נמצאו נתונים</div>
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

function ReportDetailView({ data }: { data: ProfitLossReport }) {
    const formatMoney = (amount: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount)

    return (
        <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-emerald-50 border-emerald-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-emerald-700 font-medium">סה"כ הכנסות (חייבות)</p>
                            <h3 className="text-2xl font-bold text-emerald-900">{formatMoney(data.revenue.taxable)}</h3>
                            <p className="text-xs text-emerald-600 mt-1">מע"מ: {formatMoney(data.revenue.vat)}</p>
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
                            <h3 className="text-2xl font-bold text-red-900">{formatMoney(data.expenses.recognized)}</h3>
                            <p className="text-xs text-red-600 mt-1">מע"מ: {formatMoney(data.expenses.vatRecognized)}</p>
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
                            <h3 className="text-2xl font-bold text-blue-900">{formatMoney(data.netProfit)}</h3>
                            <p className="text-xs text-blue-600 mt-1">לפני מס הכנסה</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Detailed Tables */}
            <Tabs defaultValue="incomes" className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger value="incomes" className="data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 border-b-2 border-transparent rounded-none pb-4 text-lg">
                        הכנסות ({data.transactions.filter(t => t.type === 'INVOICE' || t.type === 'CREDIT_NOTE').length})
                    </TabsTrigger>
                    <TabsTrigger value="expenses" className="data-[state=active]:border-red-500 data-[state=active]:text-red-600 border-b-2 border-transparent rounded-none pb-4 text-lg">
                        הוצאות ({data.transactions.filter(t => t.type === 'EXPENSE').length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="incomes" className="mt-6">
                    <TransactionsTable
                        transactions={data.transactions.filter(t => t.type === 'INVOICE' || t.type === 'CREDIT_NOTE')}
                        type="income"
                    />
                </TabsContent>

                <TabsContent value="expenses" className="mt-6">
                    <TransactionsTable
                        transactions={data.transactions.filter(t => t.type === 'EXPENSE')}
                        type="expense"
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function TransactionsTable({ transactions, type }: { transactions: TransactionItem[], type: 'income' | 'expense' }) {
    const [searchTerm, setSearchTerm] = useState('')

    const filtered = transactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.number?.includes(searchTerm)
    )

    const formatMoney = (amount: number) => new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount)

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <Input
                    placeholder="חיפוש לפי שם, תיאור או מספר..."
                    className="pr-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="border rounded-xl overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            {/* Removed 'Recognized?' column */}
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
                                {/* Removed 'Recognized?' cell */}
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
        </div>
    )
}
