'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Download, Loader2, Users, Receipt, CreditCard, Factory, FileText, FileArchive } from 'lucide-react'
import { getExportData, ExportType } from '@/lib/actions/export'
import { generateMonthlyConsolidatedPDF } from '@/lib/actions/consolidated-report'
import { generateMonthlyExpenseReportPDF } from '@/lib/actions/expense-report'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { format } from 'date-fns'

const EXPORT_OPTIONS = [
    {
        id: 'clients',
        label: 'לקוחות',
        description: 'ייצוא רשימת כל הלקוחות, כולל פרטי קשר וסטטוס',
        icon: Users,
        headers: ['שם הלקוח', 'אימייל', 'טלפון', 'עיר', 'כתובת', 'ח.פ/ת.ז', 'הערות', 'סטטוס', 'תאריך הצטרפות', 'בנק', 'סניף', 'חשבון']
    },
    {
        id: 'incomes',
        label: 'הכנסות',
        description: 'ייצוא כל ההכנסות והעסקאות שבוצעו',
        icon: Receipt,
        headers: ['תאריך', 'לקוח', 'תיאור/מקור', 'קטגוריה', 'סכום', 'מטבע', 'אמצעי תשלום', 'מספר חשבונית', 'סטטוס']
    },
    {
        id: 'expenses',
        label: 'הוצאות',
        description: 'ייצוא כל ההוצאות העסקיות והתפעוליות',
        icon: CreditCard,
        headers: ['תאריך', 'ספק', 'לקוח משויך', 'תיאור', 'קטגוריה', 'סכום', 'מטבע', 'אופן תשלום', 'סוג הוצאה']
    },
    {
        id: 'suppliers',
        label: 'ספקים',
        description: 'ייצוא רשימת הספקים ופרטי ההתקשרות',
        icon: Factory,
        headers: ['שם הספק', 'אימייל', 'טלפון', 'כתובת', 'ח.פ/ת.ז', 'הערות', 'סטטוס']
    },
    {
        id: 'invoices',
        label: 'חשבוניות',
        description: 'ייצוא היסטוריית החשבוניות שהופקו',
        icon: FileText,
        headers: ['מספר חשבונית', 'לקוח', 'תאריך הנפקה', 'תאריך תשלום', 'סכום לפני מע"מ', 'מע"מ', 'סה"כ לתשלום', 'סטטוס', 'מטבע', 'אמצעי תשלום', 'הערות']
    }
] as const

export function DataExportSettings() {
    const [loading, setLoading] = useState<Record<string, boolean>>({})
    const [generatingPDF, setGeneratingPDF] = useState(false)
    const [invoiceYear, setInvoiceYear] = useState<string>(new Date().getFullYear().toString())
    const [invoiceMonth, setInvoiceMonth] = useState<string>((new Date().getMonth() + 1).toString())
    const [expenseYear, setExpenseYear] = useState<string>(new Date().getFullYear().toString())
    const [expenseMonth, setExpenseMonth] = useState<string>((new Date().getMonth() + 1).toString())

    const months = [
        { label: 'ינואר', value: '1' },
        { label: 'פברואר', value: '2' },
        { label: 'מרץ', value: '3' },
        { label: 'אפריל', value: '4' },
        { label: 'מאי', value: '5' },
        { label: 'יוני', value: '6' },
        { label: 'יולי', value: '7' },
        { label: 'אוגוסט', value: '8' },
        { label: 'ספטמבר', value: '9' },
        { label: 'אוקטובר', value: '10' },
        { label: 'נובמבר', value: '11' },
        { label: 'דצמבר', value: '12' },
    ]

    const handleGenerateMonthlyPDF = async () => {
        setGeneratingPDF(true)
        try {
            const result = await generateMonthlyConsolidatedPDF(parseInt(invoiceMonth), parseInt(invoiceYear))
            if (result.success && result.data) {
                toast.success('הפקת PDF הסתיימה בהצלחה')
                
                const byteCharacters = atob(result.data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/pdf' })

                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', result.filename || 'Monthly_Report.pdf')
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
            } else {
                toast.error(result.error || 'נכשל בהפקת ה-PDF')
            }
        } catch (error) {
            toast.error('שגיאה בלתי צפויה')
            console.error(error)
        } finally {
            setGeneratingPDF(false)
        }
    }

    const handleGenerateMonthlyExpensesPDF = async () => {
        setGeneratingPDF(true)
        try {
            const result = await generateMonthlyExpenseReportPDF(parseInt(expenseMonth), parseInt(expenseYear))
            if (result.success && result.data) {
                toast.success('הפקת דוח הוצאות הסתיימה בהצלחה')
                
                const byteCharacters = atob(result.data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/pdf' })

                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', result.filename || `Expense_Report_${expenseYear}_${expenseMonth}.pdf`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                URL.revokeObjectURL(url)
            } else {
                toast.error(result.error || 'נכשל בהפקת הדוח')
            }
        } catch (error) {
            toast.error('שגיאה בלתי צפויה')
            console.error(error)
        } finally {
            setGeneratingPDF(false)
        }
    }

    const convertToCSV = (data: any[], type: string) => {
        if (!data || !data.length) return ''

        // Dynamic headers based on data keys if simplistic, or mapped
        // Let's implement specific mapping for better UX
        const headers = EXPORT_OPTIONS.find(o => o.id === type)?.headers || Object.keys(data[0])

        const csvRows = [headers.join(',')]

        for (const row of data) {
            let values: string[] = []

            switch (type) {
                case 'clients':
                    values = [
                        row.name,
                        row.email,
                        row.phone,
                        row.city,
                        row.address,
                        row.taxId,
                        row.notes,
                        row.isActive ? 'פעיל' : 'לא פעיל',
                        row.createdAt ? new Date(row.createdAt).toLocaleDateString('he-IL') : '',
                        row.bankName,
                        row.bankBranch,
                        row.bankAccount
                    ]
                    break
                case 'incomes':
                    values = [
                        row.date ? new Date(row.date).toLocaleDateString('he-IL') : '',
                        row.client?.name || '',
                        row.source,
                        row.category,
                        row.amount?.toString(),
                        row.currency,
                        row.paymentMethod,
                        row.invoice?.invoiceNumber || '',
                        row.status
                    ]
                    break
                case 'expenses':
                    values = [
                        row.date ? new Date(row.date).toLocaleDateString('he-IL') : '',
                        row.supplier?.name || '',
                        row.client?.name || '',
                        row.description,
                        row.category,
                        row.amount?.toString(),
                        row.currency,
                        row.paymentMethod,
                        row.expenseType
                    ]
                    break
                case 'suppliers':
                    values = [
                        row.name,
                        row.email,
                        row.phone,
                        row.address,
                        row.taxId,
                        row.notes,
                        row.isActive ? 'פעיל' : 'לא פעיל'
                    ]
                    break
                case 'invoices':
                    values = [
                        row.invoiceNumber,
                        row.client?.name || row.guestClientName || '',
                        row.issueDate ? new Date(row.issueDate).toLocaleDateString('he-IL') : '',
                        row.dueDate ? new Date(row.dueDate).toLocaleDateString('he-IL') : '',
                        row.subtotal?.toString(),
                        row.vatAmount?.toString(),
                        row.total?.toString(),
                        row.status,
                        row.currency,
                        row.paymentMethod,
                        row.notes
                    ]
                    break
            }

            const escapedValues = values.map(val => {
                const str = '' + (val || '')
                return `"${str.replace(/"/g, '""')}"`
            })
            csvRows.push(escapedValues.join(','))
        }

        return csvRows.join('\n')
    }

    const handleExport = async (type: ExportType) => {
        setLoading(prev => ({ ...prev, [type]: true }))
        try {
            const result = await getExportData(type)

            if (result.success && result.data) {
                const csv = convertToCSV(result.data, type)
                // Add BOM for Excel Hebrew support
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `${type}_export_${format(new Date(), 'yyyy-MM-dd')}.csv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success('הקובץ יוצא בהצלחה')
            } else {
                toast.error('שגיאה בייצוא הנתונים')
            }
        } catch (error) {
            console.error(error)
            toast.error('אירעה שגיאה בייצוא')
        } finally {
            setLoading(prev => ({ ...prev, [type]: false }))
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-right flex items-center gap-2 justify-end">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    ייצוא נתונים
                </CardTitle>
                <CardDescription className="text-right" dir="rtl">
                    הורדת נתונים כקובץ CSV לשימוש ב-Excel או תוכנות אחרות
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    {EXPORT_OPTIONS.map((option) => (
                        <div
                            key={option.id}
                            className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors gap-4"
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                {option.id === 'invoices' && (
                                    <>
                                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-md border text-xs">
                                            <Select value={invoiceYear} onValueChange={setInvoiceYear}>
                                                <SelectTrigger className="h-8 w-[80px] text-right">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="2026">2026</SelectItem>
                                                    <SelectItem value="2025">2025</SelectItem>
                                                    <SelectItem value="2024">2024</SelectItem>
                                                    <SelectItem value="2023">2023</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Select value={invoiceMonth} onValueChange={setInvoiceMonth}>
                                                <SelectTrigger className="h-8 w-[90px] text-right">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {months.map(m => (
                                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                onClick={handleGenerateMonthlyPDF}
                                                disabled={generatingPDF}
                                                variant="outline"
                                                className="h-8 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 font-bold"
                                                title="הורד דוח PDF מרוכז לחודש הנבחר"
                                            >
                                                {generatingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                                                דוח חודשי
                                            </Button>
                                        </div>

                                        <Button
                                            onClick={() => {
                                                window.open('/api/export/invoices/zip', '_blank')
                                            }}
                                            variant="outline"
                                            className="h-10 border-gray-200 hover:border-gray-300 hover:bg-white text-blue-600 hover:text-blue-700"
                                            title="הורד את כל החשבוניות כ-PDF בקובץ ZIP"
                                        >
                                            <FileArchive className="mr-2 h-4 w-4" />
                                            PDF ZIP
                                        </Button>
                                    </>
                                )}
                                {option.id === 'expenses' && (
                                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-2 rounded-md border text-xs">
                                        <Select value={expenseYear} onValueChange={setExpenseYear}>
                                            <SelectTrigger className="h-8 w-[80px] text-right">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="2026">2026</SelectItem>
                                                <SelectItem value="2025">2025</SelectItem>
                                                <SelectItem value="2024">2024</SelectItem>
                                                <SelectItem value="2023">2023</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Select value={expenseMonth} onValueChange={setExpenseMonth}>
                                            <SelectTrigger className="h-8 w-[90px] text-right">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {months.map(m => (
                                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            onClick={handleGenerateMonthlyExpensesPDF}
                                            disabled={generatingPDF}
                                            variant="outline"
                                            className="h-8 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 font-bold"
                                            title="הורד דוח הוצאות חודשי עם נספחים"
                                        >
                                            {generatingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
                                            דוח חודשי
                                        </Button>
                                    </div>
                                )}
                                <Button
                                    onClick={() => handleExport(option.id)}
                                    disabled={loading[option.id]}
                                    variant="outline"
                                    className="h-10 border-gray-200 hover:border-gray-300 hover:bg-white min-w-[120px]"
                                >
                                    {loading[option.id] ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            מייצא...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="mr-2 h-4 w-4" />
                                            הורד CSV
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{option.label}</h3>
                                    <div className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-md">
                                        <option.icon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {option.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
