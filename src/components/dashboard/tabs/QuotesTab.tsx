'use client'

import { useState } from 'react'
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, AlertCircle, Download, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/Pagination'
import { Switch } from '@/components/ui/switch'
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

    const { data: quotes = [], isLoading, mutate } = useSWR(['quotes', budgetType], quotesFetcher, { revalidateOnFocus: false })
    const { data: clients = [] } = useSWR(['clients', budgetType], clientsFetcher)

    const filteredQuotes = quotes.filter((q: any) =>
        q.client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quoteNumber.toString().includes(searchTerm)
    )

    const itemsPerPage = 5
    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage)
    const paginatedQuotes = filteredQuotes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
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

            // Extract filename from Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition')
            let filename = `quote-${quoteId}.pdf`

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/)
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1])
                }
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = filename
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
                <div className="divide-y divide-gray-200">
                    {paginatedQuotes.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                            {searchTerm ? 'לא נמצאו הצעות מחיר' : 'אין הצעות מחיר עדיין. צור הצעת מחיר חדשה כדי להתחיל.'}
                        </div>
                    ) : (
                        paginatedQuotes.map((quote) => (
                            <div key={quote.id} className="bg-white p-4 hover:bg-gray-50 transition-all flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                                        {quote.clientName?.[0] || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#323338] flex items-center gap-2">
                                            {quote.clientName}
                                            <span className="text-xs font-normal text-gray-400">
                                                #{quote.quoteNumber}
                                            </span>
                                            {quote.status === 'DRAFT' && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">טיוטה</span>}
                                            {quote.status === 'SENT' && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">נשלח</span>}
                                            {quote.status === 'ACCEPTED' && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded">התקבל</span>}
                                            {quote.status === 'EXPIRED' && <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">פג תוקף</span>}
                                            {quote.status === 'CANCELLED' && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">בוטל</span>}
                                        </div>
                                        <div className="text-xs text-[#676879] flex items-center gap-2">
                                            <span>{format(new Date(quote.date), 'dd/MM/yyyy')}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>{quote.items?.length || 0} פריטים</span>
                                            {quote.validUntil && (
                                                <>
                                                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                    <span className={new Date(quote.validUntil) < new Date() ? 'text-red-500' : ''}>
                                                        בתוקף עד {format(new Date(quote.validUntil), 'dd/MM/yyyy')}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-left">
                                        <div className="font-bold text-[#323338]">{formatCurrency(quote.totalAmount)}</div>
                                        <div className="text-[10px] text-gray-400">לפני מע"מ: {formatCurrency(quote.totalAmount - (quote.vatAmount || 0))}</div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" onClick={() => handleDownloadPDF(quote.id)}>
                                            <Download className="h-4 w-4 text-gray-500" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex justify-center direction-ltr">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
