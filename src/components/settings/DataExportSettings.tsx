'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Download, Loader2, Users, Receipt, CreditCard, Factory, FileText, FileArchive } from 'lucide-react'
import { getExportData, ExportType } from '@/lib/actions/export'
import { toast } from 'sonner'
import { format } from 'date-fns'

const EXPORT_OPTIONS = [
    {
        id: 'clients',
        label: 'לקוחות',
        description: 'ייצוא רשימת כל הלקוחות, כולל פרטי קשר וסטטוס',
        icon: Users,
        headers: ['ID', 'Name', 'Email', 'Phone', 'Tax ID', 'City', 'Address', 'Total Revenue']
    },
    {
        id: 'incomes',
        label: 'הכנסות',
        description: 'ייצוא כל ההכנסות והעסקאות שבוצעו',
        icon: Receipt,
        headers: ['ID', 'Date', 'Amount', 'Currency', 'Source', 'Category', 'Client Name', 'Invoice Number', 'Payment Method', 'Status']
    },
    {
        id: 'expenses',
        label: 'הוצאות',
        description: 'ייצוא כל ההוצאות העסקיות והתפעוליות',
        icon: CreditCard,
        headers: ['ID', 'Date', 'Amount', 'Currency', 'Description', 'Category', 'Supplier Name', 'Payment Method', 'Is Deductible']
    },
    {
        id: 'suppliers',
        label: 'ספקים',
        description: 'ייצוא רשימת הספקים ופרטי ההתקשרות',
        icon: Factory,
        headers: ['ID', 'Name', 'Email', 'Phone', 'Tax ID', 'Category']
    },
    {
        id: 'invoices',
        label: 'חשבוניות',
        description: 'ייצוא היסטוריית החשבוניות שהופקו',
        icon: FileText,
        headers: ['ID', 'Invoice Number', 'Issue Date', 'Client Name', 'Subtotal', 'VAT Amount', 'Total', 'Status']
    }
] as const

export function DataExportSettings() {
    const [loading, setLoading] = useState<Record<string, boolean>>({})

    const convertToCSV = (data: any[], type: string) => {
        if (!data || !data.length) return ''

        // Dynamic headers based on data keys if simplistic, or mapped
        // Let's implement specific mapping for better UX
        const headers = EXPORT_OPTIONS.find(o => o.id === type)?.headers || Object.keys(data[0])

        const csvRows = [headers.join(',')]

        for (const row of data) {
            const values = headers.map(header => {
                let val = ''

                // Mapping logic based on type (simplified for robust export)
                switch (type) {
                    case 'clients':
                        if (header === 'ID') val = row.id
                        if (header === 'Name') val = row.name
                        if (header === 'Email') val = row.email
                        if (header === 'Phone') val = row.phone
                        if (header === 'Tax ID') val = row.taxId
                        if (header === 'City') val = row.city
                        if (header === 'Address') val = row.address
                        if (header === 'Total Revenue') val = row.totalRevenue
                        break;
                    case 'incomes':
                        if (header === 'ID') val = row.id
                        if (header === 'Date') val = row.date ? format(new Date(row.date), 'yyyy-MM-dd') : ''
                        if (header === 'Amount') val = row.amount
                        if (header === 'Currency') val = row.currency
                        if (header === 'Source') val = row.source
                        if (header === 'Category') val = row.category
                        if (header === 'Client Name') val = row.client?.name || row.payer || ''
                        if (header === 'Invoice Number') val = row.invoice?.invoiceNumber || ''
                        if (header === 'Payment Method') val = row.paymentMethod
                        if (header === 'Status') val = row.status
                        break;
                    case 'expenses':
                        if (header === 'ID') val = row.id
                        if (header === 'Date') val = row.date ? format(new Date(row.date), 'yyyy-MM-dd') : ''
                        if (header === 'Amount') val = row.amount
                        if (header === 'Currency') val = row.currency
                        if (header === 'Description') val = row.description
                        if (header === 'Category') val = row.category
                        if (header === 'Supplier Name') val = row.supplier?.name || ''
                        if (header === 'Payment Method') val = row.paymentMethod
                        if (header === 'Is Deductible') val = row.isDeductible ? 'Yes' : 'No'
                        break;
                    case 'suppliers':
                        if (header === 'ID') val = row.id
                        if (header === 'Name') val = row.name
                        if (header === 'Email') val = row.email
                        if (header === 'Phone') val = row.phone
                        if (header === 'Tax ID') val = row.taxId
                        if (header === 'Category') val = row.category
                        break;
                    case 'invoices':
                        if (header === 'ID') val = row.id
                        if (header === 'Invoice Number') val = row.invoiceNumber
                        if (header === 'Issue Date') val = row.issueDate ? format(new Date(row.issueDate), 'yyyy-MM-dd') : ''
                        if (header === 'Client Name') val = row.client?.name || row.guestClientName || ''
                        if (header === 'Subtotal') val = row.subtotal
                        if (header === 'VAT Amount') val = row.vatAmount
                        if (header === 'Total') val = (row.subtotal || 0) + (row.vatAmount || 0)
                        if (header === 'Status') val = row.status // Check if status exists on invoice, assuming yes or derived
                        break;
                    default:
                        val = row[header]
                }

                const escaped = ('' + (val || '')).replace(/"/g, '\\"')
                return `"${escaped}"`
            })
            csvRows.push(values.join(','))
        }

        return csvRows.join('\n')
    }

    const handleExport = async (type: string) => {
        setLoading(prev => ({ ...prev, [type]: true }))
        try {
            const result = await getExportData(type as ExportType)

            if (result.success && result.data) {
                const csv = convertToCSV(result.data, type)
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.setAttribute('download', `${type}_export_${format(new Date(), 'yyyy-MM-dd')}.csv`)
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success(`קובץ ${type} יוצא בהצלחה`)
            } else {
                toast.error('שגיאה בייצוא הנתונים')
            }
        } catch (error) {
            console.error(error)
            toast.error('שגיאה בייצוא הנתונים')
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
                <CardDescription className="text-right">
                    הורדת נתונים כקובץ CSV לשימוש ב-Excel או תוכנות אחרות
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    {EXPORT_OPTIONS.map((option) => (
                        <div
                            key={option.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                {option.id === 'invoices' && (
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
                                )}
                                <Button
                                    onClick={() => handleExport(option.id)}
                                    disabled={loading[option.id]}
                                    variant="outline"
                                    className="h-10 border-gray-200 hover:border-gray-300 hover:bg-white min-w-[140px]"
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
