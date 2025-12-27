'use client'

import { useState } from 'react'
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, AlertCircle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getQuotes, createQuote, updateQuoteStatus, getNextQuoteNumber, type QuoteFormData } from '@/lib/actions/quotes'
import { getClients } from '@/lib/actions/clients'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useBudget } from '@/contexts/BudgetContext'
import { format } from 'date-fns'
import { DatePicker } from '@/components/ui/date-picker'

const statusConfig = {
    DRAFT: { label: 'טיוטה', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
    SENT: { label: 'נשלח', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    ACCEPTED: { label: 'התקבל', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    EXPIRED: { label: 'פג תוקף', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
    CANCELLED: { label: 'בוטל', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' }
}

export function QuotesTab() {
    const { budgetType } = useBudget()
    const [searchTerm, setSearchTerm] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState<QuoteFormData>({
        clientId: '',
        quoteNumber: '',
        issueDate: new Date(),
        validUntil: undefined,
        subtotal: 0,
        vatRate: 0.18,
        notes: ''
    })

    const quotesFetcher = async () => {
        const result = await getQuotes(budgetType)
        return result.data || []
    }

    const clientsFetcher = async () => {
        const result = await getClients(budgetType)
        return result.data || []
    }

    const { data: quotes = [], isLoading, mutate } = useSWR(['quotes', budgetType], quotesFetcher)
    const { data: clients = [] } = useSWR(['clients', budgetType], clientsFetcher)

    const filteredQuotes = quotes.filter((quote: any) =>
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const result = await createQuote(formData, budgetType)

            if (result.success) {
                toast.success('הצעת מחיר נוצרה בהצלחה')
                setShowForm(false)
                setFormData({
                    clientId: '',
                    quoteNumber: '',
                    issueDate: new Date(),
                    validUntil: undefined,
                    subtotal: 0,
                    vatRate: 0.18,
                    notes: ''
                })
                mutate()
            } else {
                toast.error(result.error || 'שגיאה')
            }
        } catch (error) {
            toast.error('שגיאה ביצירת הצעת המחיר')
        }
    }

    const handleStatusChange = async (quoteId: string, newStatus: any) => {
        const result = await updateQuoteStatus(quoteId, newStatus)
        if (result.success) {
            toast.success('סטטוס עודכן בהצלחה')
            mutate()
        } else {
            toast.error(result.error || 'שגיאה בעדכון הסטטוס')
        }
    }

    const handleDownloadPDF = async (quoteId: string) => {
        try {
            const response = await fetch(`/api/quotes/${quoteId}/pdf`)
            if (!response.ok) throw new Error('Failed to download PDF')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `quote-${quoteId}.pdf`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('PDF הורד בהצלחה')
        } catch (error) {
            toast.error('שגיאה בהורדת PDF')
        }
    }

    const handleNewQuote = async () => {
        const nextNum = await getNextQuoteNumber()

        setFormData({
            ...formData,
            quoteNumber: nextNum.data || '2001'
        })
        setShowForm(true)
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="h-12 w-24 bg-gray-200 rounded animate-pulse" />
                                <div className="h-12 flex-1 bg-gray-200 rounded animate-pulse" />
                                <div className="h-12 w-32 bg-gray-200 rounded animate-pulse" />
                                <div className="h-12 w-32 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const total = formData.subtotal + (formData.subtotal * (formData.vatRate || 0))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">הצעות מחיר</h2>
                    <p className="text-sm text-gray-500 mt-1">ניהול הצעות מחיר ללקוחות</p>
                </div>
                <Button
                    onClick={handleNewQuote}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                    <Plus className="h-4 w-4 ml-2" />
                    הצעת מחיר חדשה
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="חיפוש הצעת מחיר..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 text-yellow-700">הצעת מחיר חדשה</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    מספר הצעת מחיר *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.quoteNumber}
                                    onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    לקוח *
                                </label>
                                <select
                                    required
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                                >
                                    <option value="">בחר לקוח</option>
                                    {clients.map((client: any) => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    תאריך הנפקה *
                                </label>
                                <DatePicker
                                    date={formData.issueDate}
                                    setDate={(date) => date && setFormData({ ...formData, issueDate: date })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    בתוקף עד
                                </label>
                                <DatePicker
                                    date={formData.validUntil}
                                    setDate={(date) => setFormData({ ...formData, validUntil: date })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    סכום לפני מע"מ *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.subtotal}
                                    onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    שיעור מע"מ
                                </label>
                                <select
                                    value={formData.vatRate}
                                    onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                                >
                                    <option value="0">ללא מע"מ (0%)</option>
                                    <option value="0.18">מע"מ רגיל (18%)</option>
                                </select>
                            </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                            <div className="flex justify-between text-sm mb-2">
                                <span>סכום לפני מע"מ:</span>
                                <span>₪{formData.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-2">
                                <span>מע"מ ({(formData.vatRate || 0) * 100}%):</span>
                                <span>₪{(formData.subtotal * (formData.vatRate || 0)).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-yellow-200 pt-2">
                                <span>סה"כ לתשלום:</span>
                                <span className="text-yellow-700">₪{total.toLocaleString()}</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                הערות
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-black">
                                צור הצעת מחיר
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowForm(false)}
                            >
                                ביטול
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">מספר</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">לקוח</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">תאריך</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סכום</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">סטטוס</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredQuotes.map((quote: any) => {
                            const StatusIcon = statusConfig[quote.status as keyof typeof statusConfig].icon
                            const statusInfo = statusConfig[quote.status as keyof typeof statusConfig]

                            return (
                                <tr key={quote.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {quote.quoteNumber}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {quote.client?.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(quote.issueDate), 'dd/MM/yyyy')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        ₪{quote.total.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                                            <StatusIcon className="h-3 w-3" />
                                            {statusInfo.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex gap-2">
                                            <select
                                                value={quote.status}
                                                onChange={(e) => handleStatusChange(quote.id, e.target.value)}
                                                className="text-sm border border-gray-300 rounded px-2 py-1"
                                            >
                                                <option value="DRAFT">טיוטה</option>
                                                <option value="SENT">נשלח</option>
                                                <option value="ACCEPTED">התקבל</option>
                                                <option value="EXPIRED">פג תוקף</option>
                                                <option value="CANCELLED">בוטל</option>
                                            </select>
                                            <Button
                                                onClick={() => handleDownloadPDF(quote.id)}
                                                size="sm"
                                                variant="outline"
                                                className="bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                                            >
                                                <Download className="h-4 w-4 text-yellow-600" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>

                {filteredQuotes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {searchTerm ? 'לא נמצאו הצעות מחיר' : 'אין הצעות מחיר עדיין. צור הצעת מחיר חדשה כדי להתחיל.'}
                    </div>
                )}
            </div>
        </div>
    )
}
