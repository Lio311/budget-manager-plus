'use client'

import { useState } from 'react'
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, AlertCircle, Download, Trash2, Pencil, ChevronDown, Link as LinkIcon, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/Pagination'
import { getQuotes, updateQuoteStatus, generateQuoteLink, type QuoteFormData } from '@/lib/actions/quotes'
import { getClients } from '@/lib/actions/clients'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useBudget } from '@/contexts/BudgetContext'
import { format } from 'date-fns'
import { formatCurrency, cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { QuoteForm } from '@/components/dashboard/forms/QuoteForm'

const statusConfig = {
    DRAFT: { label: 'טיוטה', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
    SENT: { label: 'נשלח', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    ACCEPTED: { label: 'התקבל', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    EXPIRED: { label: 'פג תוקף', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
    CANCELLED: { label: 'בוטל', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' }
}

interface Quote {
    id: string
    quoteNumber: string
    clientName: string
    clientId: string
    date: string | Date
    validUntil?: string | Date
    status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
    totalAmount: number
    vatAmount: number
    items: any[]
    isSigned: boolean
}

export function QuotesTab() {
    const { budgetType } = useBudget()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    // Dialog states for desktop and mobile
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const quotesFetcher = async () => {
        const result = await getQuotes(budgetType)
        if (!result.success || !result.data) return []

        return result.data.map((q: any) => ({
            id: q.id,
            quoteNumber: q.quoteNumber,
            clientName: q.client?.name || 'לקוח לא ידוע',
            clientId: q.clientId,
            date: q.issueDate,
            validUntil: q.validUntil,
            status: q.status as any,
            totalAmount: q.total,
            vatAmount: q.vatAmount,
            isSigned: q.isSigned,
            items: []
        }))
    }

    const clientsFetcher = async () => {
        const result = await getClients(budgetType)
        return result.data || []
    }

    const { data: quotes = [], isLoading, mutate } = useSWR<Quote[]>(['quotes', budgetType], quotesFetcher, { revalidateOnFocus: false })
    const { data: clients = [] } = useSWR(['clients', budgetType], clientsFetcher)

    const filteredQuotes = quotes.filter((q: any) =>
        q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quoteNumber.toString().includes(searchTerm)
    )

    const itemsPerPage = 5

    useAutoPaginationCorrection(currentPage, filteredQuotes.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage)
    const paginatedQuotes = filteredQuotes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Optimistic status update for instant UI feedback
    const { execute: optimisticUpdateStatus } = useOptimisticMutation<Quote[], { id: string, status: any }>(
        ['quotes', budgetType],
        ({ id, status }) => updateQuoteStatus(id, status),
        {
            getOptimisticData: (current, { id, status }) => current.map(q => q.id === id ? { ...q, status } : q),
            successMessage: 'סטטוס עודכן בהצלחה',
            errorMessage: 'שגיאה בעדכון הסטטוס'
        }
    )

    const handleStatusChange = async (quoteId: string, newStatus: any) => {
        try {
            await optimisticUpdateStatus({ id: quoteId, status: newStatus })
        } catch (error) {
            // Error managed by hook
        }
    }

    const handleViewQuote = async (quoteId: string) => {
        try {
            toast.info('פותח הצעת מחיר...')
            const result = await generateQuoteLink(quoteId)
            if (result.success && result.token) {
                window.location.href = `${window.location.origin}/quote/${result.token}`
            } else {
                toast.error('שגיאה בפתיחת הצעת המחיר')
            }
        } catch (error) {
            toast.error('שגיאה בפתיחת הצעת המחיר')
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

    const handleCopyLink = async (quoteId: string) => {
        try {
            const result = await generateQuoteLink(quoteId)
            if (result.success && result.token) {
                const url = `${window.location.origin}/quote/${result.token}`

                // Try native share first (mobile)
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'הצעת מחיר',
                            text: 'הינה הצעת המחיר שלך',
                            url: url
                        })
                        return // Success
                    } catch (err) {
                        // Ignore sharing error (user cancelled) and fallback to clipboard
                        if ((err as Error).name !== 'AbortError') {
                            console.error('Share failed:', err)
                        }
                    }
                }

                // Fallback to clipboard
                await navigator.clipboard.writeText(url)
                toast.success('הקישור הועתק ללוח')
            } else {
                toast.error('שגיאה ביצירת הקישור')
            }
        } catch (error) {
            toast.error('שגיאה ביצירת הקישור')
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div className="h-8 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-10 w-40 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="h-10 w-full bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md border border-gray-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex gap-4">
                                <div className="h-12 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="h-12 flex-1 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="h-12 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="h-12 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">הצעות מחיר</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ניהול הצעות מחיר ללקוחות</p>
                </div>

                {/* Desktop Button */}
                <div className="hidden md:block">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white dark:text-black">
                                <Plus className="h-4 w-4 ml-2" />
                                הצעת מחיר חדשה
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] max-w-3xl rounded-xl" dir="rtl">
                            <DialogTitle className="sr-only">הוספת הצעת מחיר</DialogTitle>
                            <div className="p-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">יצירת הצעת מחיר חדשה</h3>
                                <QuoteForm
                                    clients={clients}
                                    onSuccess={() => {
                                        setIsDialogOpen(false)
                                        mutate()
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="חיפוש לפי שם לקוח או מספר הצעה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
            </div>

            {/* Mobile FAB */}
            <div className="md:hidden">
                <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <DialogTrigger asChild>
                        <FloatingActionButton onClick={() => setIsMobileOpen(true)} colorClass="bg-yellow-500" label="הוסף הצעה" />
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                        <DialogTitle className="sr-only">הוספת הצעת מחיר</DialogTitle>
                        <div className="mt-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">יצירת הצעת מחיר חדשה</h3>
                            <QuoteForm
                                clients={clients}
                                onSuccess={() => {
                                    setIsMobileOpen(false)
                                    mutate()
                                }}
                            />
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* List */}
            <div className="flex flex-col gap-3">
                {paginatedQuotes.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg border border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400">
                        {searchTerm ? 'לא נמצאו הצעות מחיר' : 'אין הצעות מחיר עדיין. צור הצעת מחיר חדשה כדי להתחיל.'}
                    </div>
                ) : (
                    paginatedQuotes.map((quote) => (
                        <div key={quote.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group dark:bg-slate-800 dark:border-slate-700">
                            {/* Mobile Layout: Stacked */}
                            {/* Top: Client + Status */}
                            <div className="flex items-start justify-between w-full md:w-auto md:flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                        {quote.clientName?.[0] || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            {quote.clientName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            #{quote.quoteNumber} • {format(new Date(quote.date), 'dd/MM/yyyy')}
                                        </div>
                                        {quote.validUntil && (
                                            <div className={cn("text-xs mt-1",
                                                new Date(quote.validUntil) < new Date() && quote.status !== 'ACCEPTED' ? 'text-red-500' : 'text-gray-400'
                                            )}>
                                                בתוקף עד {format(new Date(quote.validUntil), 'dd/MM/yyyy')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Status Badge - Visible on Mobile Top Right, Desktop Center */}
                                <div className="md:hidden" onClick={(e) => e.stopPropagation()}>
                                    <Select
                                        value={quote.status}
                                        onValueChange={(value) => handleStatusChange(quote.id, value)}
                                    >
                                        <SelectTrigger className={cn("h-7 text-xs px-2 border-0 shadow-none font-medium",
                                            quote.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                                                quote.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                                    quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                                                        quote.status === 'EXPIRED' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-700'
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="DRAFT">טיוטה</SelectItem>
                                            <SelectItem value="SENT">נשלח</SelectItem>
                                            <SelectItem value="ACCEPTED">התקבל</SelectItem>
                                            <SelectItem value="EXPIRED">פג תוקף</SelectItem>
                                            <SelectItem value="CANCELLED">בוטל</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Desktop: Status Center */}
                            <div className="hidden md:flex items-center justify-center flex-1" onClick={(e) => e.stopPropagation()}>
                                <Select
                                    value={quote.status}
                                    onValueChange={(value) => handleStatusChange(quote.id, value)}
                                >
                                    <SelectTrigger className={cn("h-8 w-[120px] text-xs px-2 border border-gray-200 shadow-sm",
                                        quote.status === 'DRAFT' ? 'bg-gray-50 text-gray-700' :
                                            quote.status === 'SENT' ? 'bg-blue-50 text-blue-700' :
                                                quote.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' :
                                                    quote.status === 'EXPIRED' ? 'bg-orange-50 text-orange-700' :
                                                        'bg-gray-50 text-gray-700 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600'
                                    )}>
                                        <span className="w-full text-center font-medium">
                                            <SelectValue />
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="DRAFT">טיוטה</SelectItem>
                                        <SelectItem value="SENT">נשלח</SelectItem>
                                        <SelectItem value="ACCEPTED">התקבל</SelectItem>
                                        <SelectItem value="EXPIRED">פג תוקף</SelectItem>
                                        <SelectItem value="CANCELLED">בוטל</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bottom/Right: Amount + Actions */}
                            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto md:flex-1 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-700">
                                <div className="text-right md:text-left">
                                    <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{formatCurrency(quote.totalAmount)}</div>
                                    <div className="text-[10px] text-gray-400">לפני מע"מ: {formatCurrency(quote.totalAmount - (quote.vatAmount || 0))}</div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleCopyLink(quote.id)} className="gap-2 text-yellow-600 border-yellow-200 bg-yellow-50 hover:bg-yellow-100">
                                    <LinkIcon className="h-4 w-4" />
                                    <span className="md:hidden">קישור להצעה</span>
                                    <span className="hidden md:inline">קישור להצעה</span>
                                </Button>
                                {quote.isSigned && (
                                    <Button variant="outline" size="icon" onClick={() => handleViewQuote(quote.id)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-center direction-ltr">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </div>
    )
}
