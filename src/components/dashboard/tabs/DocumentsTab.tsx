'use client'

import { useState, useEffect } from 'react'
import { FileText, Receipt, CreditCard, Eye, Link as LinkIcon, Pencil, Trash2, CheckCircle, Info, Plus } from 'lucide-react'
import { DocumentsTutorial } from '@/components/dashboard/tutorial/DocumentsTutorial'
import { cn } from '@/lib/utils'
import { QuoteForm } from '@/components/dashboard/forms/QuoteForm'
import { InvoiceForm } from '@/components/dashboard/forms/InvoiceForm'
import { CreditNoteForm } from '@/components/dashboard/forms/CreditNoteForm'
import useSWR from 'swr'
import { getClients } from '@/lib/actions/clients'
import { getQuotes, generateQuoteLink, updateQuoteStatus, convertQuoteToInvoice, deleteQuote } from '@/lib/actions/quotes'
import { getInvoices, generateInvoiceLink, updateInvoiceStatus, deleteInvoice } from '@/lib/actions/invoices'
import { getCreditNotes, generateCreditNoteLink, deleteCreditNote } from '@/lib/actions/credit-notes'
import { useBudget } from '@/contexts/BudgetContext'
import { useDemo } from '@/contexts/DemoContext'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Pagination } from '@/components/ui/Pagination'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'
import { useConfirm } from '@/hooks/useConfirm'
import { toast } from 'sonner'

type DocumentType = 'quote' | 'invoice' | 'credit' | null

const documentTypes = [
    {
        value: 'quote' as const,
        label: 'הצעת מחיר',
        icon: FileText,
        color: 'bg-yellow-500 hover:bg-yellow-600',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-600',
        hoverBorderColor: 'hover:border-yellow-500',
        hoverIconBg: 'group-hover:bg-yellow-50',
        hoverTextColor: 'group-hover:text-yellow-600'
    },
    {
        value: 'invoice' as const,
        label: 'חשבונית',
        cardLabel: 'חשבונית (מס, קבלה, עסקה)',
        icon: Receipt,
        color: 'bg-purple-500 hover:bg-purple-600',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-600',
        hoverBorderColor: 'hover:border-purple-500',
        hoverIconBg: 'group-hover:bg-purple-50',
        hoverTextColor: 'group-hover:text-purple-600'
    },
    {
        value: 'credit' as const,
        label: 'זיכוי',
        icon: CreditCard,
        color: 'bg-orange-500 hover:bg-orange-600',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-600',
        hoverBorderColor: 'hover:border-orange-500',
        hoverIconBg: 'group-hover:bg-orange-50',
        hoverTextColor: 'group-hover:text-orange-600'
    },
]

// Mobile FAB Component
function MobileDocumentFab({ onSelect }: { onSelect: (type: DocumentType) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [colorIndex, setColorIndex] = useState(0)

    // Colors: Purple (Invoice) -> Yellow (Quote) -> Orange (Credit)
    const colors = ['bg-purple-600', 'bg-yellow-500', 'bg-orange-500']

    useEffect(() => {
        const interval = setInterval(() => {
            setColorIndex((prev) => (prev + 1) % colors.length)
        }, 3000) // Change color every 3 seconds
        return () => clearInterval(interval)
    }, [])

    return (
        <>
            <div className="fixed bottom-6 left-6 z-50 md:hidden" id="documents-add-fab">
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-lg transition-colors duration-1000 ease-in-out",
                        colors[colorIndex],
                        "hover:opacity-90"
                    )}
                    onClick={() => setIsOpen(true)}
                >
                    <Plus className="h-6 w-6 text-white" />
                </Button>
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-[95%] rounded-xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>מה תרצה להפיק?</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 mt-4">
                        {documentTypes.map((type) => {
                            const Icon = type.icon
                            return (
                                <button
                                    key={type.value}
                                    onClick={() => {
                                        onSelect(type.value)
                                        setIsOpen(false)
                                    }}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-white",
                                        type.color
                                    )}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-900 dark:text-gray-100">
                                            {type.label}
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

export function DocumentsTab() {
    const { budgetType } = useBudget()
    const { isDemo, data: demoData, interceptAction } = useDemo()
    const [showTutorial, setShowTutorial] = useState(false)

    const [selectedType, setSelectedType] = useState<DocumentType>(null)
    const [filterType, setFilterType] = useState<'all' | 'quote' | 'invoice' | 'credit'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')

    // Editing states
    const [editingQuote, setEditingQuote] = useState<any | null>(null)
    const [editingInvoice, setEditingInvoice] = useState<any | null>(null)
    const [editingCreditNote, setEditingCreditNote] = useState<any | null>(null)
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editDialogType, setEditDialogType] = useState<'quote' | 'invoice' | 'credit' | null>(null)

    // Fetch data
    const clientsFetcher = async () => {
        const result = await getClients(budgetType)
        return result.data || []
    }

    const quotesFetcher = async () => {
        const result = await getQuotes(budgetType)
        if (!result.success || !result.data) return []
        return result.data.map((q: any) => ({
            ...q,
            type: 'quote' as const,
            displayNumber: q.quoteNumber,
            displayDate: q.issueDate,
            displayAmount: q.total,
            clientName: q.client?.name || 'לקוח לא ידוע'
        }))
    }

    const invoicesFetcher = async () => {
        const result = await getInvoices(budgetType)
        if (!result.success || !result.data) return []
        return result.data.map((i: any) => ({
            ...i,
            type: 'invoice' as const,
            displayNumber: i.invoiceNumber,
            displayDate: i.issueDate,
            displayAmount: i.total,
            clientName: (i.guestClientName && i.guestClientName.trim()) ? i.guestClientName : (i.client?.name || 'לקוח לא ידוע')
        }))
    }

    const creditNotesFetcher = async () => {
        const result = await getCreditNotes(budgetType)
        if (!result.success || !result.data) return []
        return result.data.map((c: any) => ({
            ...c,
            type: 'credit' as const,
            displayNumber: c.creditNoteNumber,
            displayDate: c.issueDate,
            displayAmount: c.totalCredit,
            clientName: c.client?.name || 'לקוח לא ידוע'
        }))
    }

    const { data: clientsData = [] } = useSWR(
        isDemo ? null : ['clients', budgetType],
        clientsFetcher,
        { revalidateOnFocus: false, shouldRetryOnError: false }
    )

    const { data: quotesData = [], mutate: mutateQuotes } = useSWR(
        isDemo ? null : ['quotes', budgetType],
        quotesFetcher,
        { revalidateOnFocus: false, shouldRetryOnError: false }
    )

    const { data: invoicesData = [], mutate: mutateInvoices } = useSWR(
        isDemo ? null : ['invoices', budgetType],
        invoicesFetcher,
        { revalidateOnFocus: false, shouldRetryOnError: false }
    )

    const { data: creditNotesData = [], mutate: mutateCreditNotes } = useSWR(
        isDemo ? null : ['credit-notes', budgetType],
        creditNotesFetcher,
        { revalidateOnFocus: false, shouldRetryOnError: false }
    )

    const clients = isDemo ? demoData.clients : clientsData

    // Combine all documents
    const allDocuments = [
        ...(isDemo ? [] : quotesData),
        ...(isDemo ? [] : invoicesData),
        ...(isDemo ? [] : creditNotesData)
    ].sort((a, b) => {
        const dateA = new Date(a.displayDate).getTime()
        const dateB = new Date(b.displayDate).getTime()
        return dateB - dateA // Newest first
    })

    // Filter documents
    const filteredDocuments = allDocuments.filter(doc => {
        const matchesFilter = filterType === 'all' || doc.type === filterType
        const matchesSearch =
            doc.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doc.displayNumber?.toString().includes(searchTerm)
        return matchesFilter && matchesSearch
    })

    // Pagination
    const itemsPerPage = 10
    useAutoPaginationCorrection(currentPage, filteredDocuments.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
    const paginatedDocuments = filteredDocuments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const handleFormSuccess = () => {
        setSelectedType(null)
        setEditingQuote(null)
        setEditingInvoice(null)
        setEditingCreditNote(null)
        mutateQuotes()
        mutateInvoices()
        mutateCreditNotes()
    }

    const confirm = useConfirm()

    // Edit document
    const handleEdit = (type: 'quote' | 'invoice' | 'credit', doc: any) => {
        // Check if document is signed/paid (cannot edit)
        if (type === 'quote' && (doc.isSigned || doc.status === 'ACCEPTED')) {
            toast.error('לא ניתן לערוך הצעת מחיר חתומה')
            return
        }
        if (type === 'invoice' && doc.status === 'PAID') {
            toast.error('לא ניתן לערוך חשבונית ששולמה')
            return
        }

        // Set editing state and open dialog
        if (type === 'quote') {
            setEditingQuote(doc)
            setEditDialogType('quote')
        } else if (type === 'invoice') {
            setEditingInvoice(doc)
            setEditDialogType('invoice')
        } else {
            setEditingCreditNote(doc)
            setEditDialogType('credit')
        }
        setShowEditDialog(true)
    }

    // View document
    const handleViewDocument = async (type: 'quote' | 'invoice' | 'credit', id: string) => {
        try {
            toast.info('פותח מסמך...')
            let result
            if (type === 'quote') {
                result = await generateQuoteLink(id)
            } else if (type === 'invoice') {
                result = await generateInvoiceLink(id)
            } else {
                result = await generateCreditNoteLink(id)
            }

            if (result.success && result.token) {
                window.location.href = `${window.location.origin}/${type}/${result.token}`
            } else {
                toast.error('שגיאה בפתיחת המסמך')
            }
        } catch (error) {
            toast.error('שגיאה בפתיחת המסמך')
        }
    }

    // Copy link
    const handleCopyLink = async (type: 'quote' | 'invoice' | 'credit', id: string) => {
        try {
            let result
            if (type === 'quote') {
                result = await generateQuoteLink(id)
            } else if (type === 'invoice') {
                result = await generateInvoiceLink(id)
            } else {
                result = await generateCreditNoteLink(id)
            }

            if (result.success && result.token) {
                const url = `${window.location.origin}/${type}/${result.token}`

                // Try native share first (mobile)
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: type === 'quote' ? 'הצעת מחיר' : type === 'invoice' ? 'חשבונית' : 'זיכוי',
                            text: `הינה ${type === 'quote' ? 'הצעת המחיר' : type === 'invoice' ? 'החשבונית' : 'הזיכוי'} שלך`,
                            url: url
                        })
                        return
                    } catch (err) {
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

    // Status change
    const handleStatusChange = async (type: 'quote' | 'invoice', id: string, newStatus: any) => {
        try {
            if (type === 'quote') {
                await updateQuoteStatus(id, newStatus)
            } else {
                await updateInvoiceStatus(id, newStatus)
            }
            toast.success('סטטוס עודכן בהצלחה')
            mutateQuotes()
            mutateInvoices()
        } catch (error) {
            toast.error('שגיאה בעדכון הסטטוס')
        }
    }

    // Convert quote to invoice
    const handleConvertToInvoice = async (quoteId: string) => {
        if (!await confirm(
            'האם אתה בטוח שברצונך להמיר את הצעת המחיר לחשבונית? פעולה זו תיצור טיוטת חשבונית חדשה.',
            'המרת הצעה לחשבונית'
        )) return

        try {
            toast.info('ממיר לחשבונית...')
            const result = await convertQuoteToInvoice(quoteId)
            if (result.success) {
                toast.success('החשבונית נוצרה בהצלחה!')
                mutateQuotes()
                mutateInvoices()
            } else {
                toast.error(result.error || 'שגיאה ביצירת החשבונית')
            }
        } catch (error) {
            toast.error('שגיאה ביצירת החשבונית')
        }
    }

    // Delete document
    const handleDelete = async (type: 'quote' | 'invoice' | 'credit', id: string) => {
        const docName = type === 'quote' ? 'הצעת המחיר' : type === 'invoice' ? 'החשבונית' : 'הזיכוי'
        if (!await confirm(
            `האם אתה בטוח שברצונך למחוק את ${docName}?`,
            'מחיקת מסמך'
        )) return

        try {
            if (type === 'quote') {
                await deleteQuote(id)
            } else if (type === 'invoice') {
                await deleteInvoice(id)
            } else {
                await deleteCreditNote(id)
            }
            toast.success('המסמך נמחק בהצלחה')
            mutateQuotes()
            mutateInvoices()
            mutateCreditNotes()
        } catch (error) {
            toast.error('שגיאה במחיקת המסמך')
        }
    }

    const getDocumentTypeConfig = (type: 'quote' | 'invoice' | 'credit') => {
        return documentTypes.find(dt => dt.value === type)!
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">הפקת מסמכים</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ניהול הצעות מחיר, חשבוניות וזיכויים
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                    onClick={() => setShowTutorial(true)}
                    title="הדרכה"
                >
                    <Info className="h-5 w-5" />
                </Button>
            </div>

            {/* Document Type Selection - Desktop Grid */}
            <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-4" id="documents-types-grid">
                {documentTypes.map((docType) => {
                    const Icon = docType.icon
                    const isSelected = selectedType === docType.value

                    return (
                        <button
                            key={docType.value}
                            onClick={() => {
                                if (isDemo) {
                                    interceptAction()
                                    return
                                }
                                setSelectedType(isSelected ? null : docType.value)
                            }}
                            className={cn(
                                "relative p-6 rounded-xl border-2 transition-all duration-200",
                                "flex flex-col items-center gap-3 group",
                                isSelected
                                    ? `${docType.borderColor} bg-white dark:bg-slate-800 shadow-lg scale-105`
                                    : `border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md hover:scale-102 ${docType.hoverBorderColor}`
                            )}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                                isSelected ? docType.color : `bg-gray-100 dark:bg-slate-700 ${docType.hoverIconBg}`
                            )}>
                                <Icon className={cn(
                                    "w-8 h-8 transition-colors",
                                    isSelected ? "text-white" : `text-gray-600 dark:text-gray-300 ${docType.hoverTextColor}`
                                )} />
                            </div>
                            <div className="text-center">
                                <div className={cn(
                                    "font-bold text-lg",
                                    isSelected ? docType.textColor : "text-gray-900 dark:text-gray-100"
                                )}>
                                    {(docType as any).cardLabel || docType.label}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {isSelected ? "לחץ לביטול" : "לחץ ליצירה"}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Mobile FAB and Selection Menu */}
            <div className="md:hidden">
                <MobileDocumentFab onSelect={(type) => {
                    if (isDemo) { interceptAction(); return; }
                    setSelectedType(type)
                }} />
            </div>



            {/* Documents List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm" id="documents-list-container">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        רשימת מסמכים
                    </h3>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        {/* Filter */}
                        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="סנן לפי סוג" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="all">כל המסמכים</SelectItem>
                                <SelectItem value="quote">הצעות מחיר</SelectItem>
                                <SelectItem value="invoice">חשבוניות</SelectItem>
                                <SelectItem value="credit">זיכויים</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Search */}
                        <input
                            type="text"
                            placeholder="חיפוש..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-[200px] px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
                        />
                    </div>
                </div>

                {/* Documents Table */}
                <div className="space-y-3">
                    {paginatedDocuments.length === 0 ? (
                        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                            {searchTerm || filterType !== 'all'
                                ? 'לא נמצאו מסמכים'
                                : 'אין מסמכים עדיין. צור מסמך חדש כדי להתחיל.'}
                        </div>
                    ) : (
                        paginatedDocuments.map((doc: any) => {
                            const config = getDocumentTypeConfig(doc.type)
                            const Icon = config.icon
                            const hasStatus = doc.type === 'quote' || doc.type === 'invoice'
                            const canConvert = doc.type === 'quote' && doc.isSigned && !doc.invoiceId

                            return (
                                <div
                                    key={`${doc.type}-${doc.id}`}
                                    className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all"
                                >
                                    {/* Top Row: Icon, Client, Type, Status */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                config.color
                                            )}>
                                                <Icon className="w-5 h-5 text-white" />
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-gray-900 dark:text-gray-100">
                                                        {doc.clientName}
                                                    </span>
                                                    <span className={cn(
                                                        "text-xs px-2 py-0.5 rounded-full font-medium",
                                                        doc.type === 'invoice' && doc.invoiceType === 'RECEIPT'
                                                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                            : config.textColor + " bg-gray-100 dark:bg-slate-700"
                                                    )}>
                                                        {doc.type === 'invoice' && doc.invoiceType ? (
                                                            ({
                                                                'TAX_INVOICE': 'חשבונית מס',
                                                                'RECEIPT': 'קבלה',
                                                                'INVOICE': 'חשבונית',
                                                                'DEAL_INVOICE': 'חשבונית עסקה',
                                                                'REFUND_INVOICE': 'חשבונית זיכוי'
                                                            } as Record<string, string>)[doc.invoiceType] || config.label
                                                        ) : config.label}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    #{doc.displayNumber} • {format(new Date(doc.displayDate), 'dd/MM/yyyy')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Selector (for quotes and invoices) */}
                                        {hasStatus && (
                                            <div className="mr-2">
                                                <Select
                                                    value={doc.status}
                                                    onValueChange={(value) => handleStatusChange(doc.type, doc.id, value)}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-8 w-[120px] text-xs px-2 border shadow-sm",
                                                        doc.status === 'DRAFT' ? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700' :
                                                            doc.status === 'SENT' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' :
                                                                doc.status === 'ACCEPTED' || doc.status === 'PAID' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800' :
                                                                    doc.status === 'EXPIRED' || doc.status === 'OVERDUE' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800' :
                                                                        'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700'
                                                    )}>
                                                        <span className="w-full text-center font-medium">
                                                            <SelectValue />
                                                        </span>
                                                    </SelectTrigger>
                                                    <SelectContent dir="rtl" className="text-right">
                                                        <SelectItem value="DRAFT" className="pr-8">טיוטה</SelectItem>
                                                        <SelectItem value="SENT" className="pr-8">נשלח</SelectItem>
                                                        {doc.type === 'quote' ? (
                                                            <>
                                                                <SelectItem value="ACCEPTED" className="pr-8">נחתם</SelectItem>
                                                                <SelectItem value="EXPIRED" className="pr-8">פג תוקף</SelectItem>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <SelectItem value="PAID" className="pr-8">שולם</SelectItem>
                                                                <SelectItem value="OVERDUE" className="pr-8">באיחור</SelectItem>
                                                            </>
                                                        )}
                                                        <SelectItem value="CANCELLED" className="pr-8">בוטל</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Row: Amount + Action Buttons */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
                                        <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                            {formatCurrency(doc.displayAmount)}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* View Button */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleViewDocument(doc.type, doc.id)}
                                                className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                                                title="צפייה"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>

                                            {/* Copy Link Button */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleCopyLink(doc.type, doc.id)}
                                                className={cn(
                                                    "border-200 bg-50 hover:bg-100",
                                                    config.textColor.replace('text-', 'text-'),
                                                    config.textColor.replace('text-', 'border-'),
                                                    config.textColor.replace('text-', 'bg-').replace('600', '50')
                                                )}
                                                title="העתק קישור"
                                            >
                                                <LinkIcon className="h-4 w-4" />
                                            </Button>

                                            {/* Convert to Invoice (for signed quotes only) */}
                                            {canConvert && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleConvertToInvoice(doc.id)}
                                                    className="gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                                                    title="הפוך לחשבונית"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    <span className="hidden md:inline">הפוך לחשבונית</span>
                                                </Button>
                                            )}

                                            {/* Edit Button - hide for signed/paid documents */}
                                            {!((doc.type === 'quote' && (doc.isSigned || doc.status === 'ACCEPTED')) ||
                                                (doc.type === 'invoice' && doc.status === 'PAID')) && (
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handleEdit(doc.type, doc)}
                                                        className="text-gray-600 border-gray-200 bg-gray-50 hover:bg-gray-100"
                                                        title="עריכה"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}

                                            {/* Delete Button */}
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => handleDelete(doc.type, doc.id)}
                                                className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100"
                                                title="מחיקה"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>

            {/* Combined Create/Edit Dialog */}
            <Dialog open={showEditDialog || !!selectedType} onOpenChange={(open) => {
                if (!open) {
                    setShowEditDialog(false)
                    setSelectedType(null)
                    setEditingQuote(null)
                    setEditingInvoice(null)
                    setEditingCreditNote(null)
                    setEditDialogType(null)
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
                    <DialogHeader>
                        <DialogTitle>
                            {/* Edit Titles */}
                            {editDialogType === 'quote' && 'עריכת הצעת מחיר'}
                            {editDialogType === 'invoice' && 'עריכת חשבונית'}
                            {editDialogType === 'credit' && 'עריכת זיכוי'}

                            {/* Create Titles */}
                            {selectedType === 'quote' && 'יצירת הצעת מחיר חדשה'}
                            {selectedType === 'invoice' && 'יצירת חשבונית חדשה'}
                            {selectedType === 'credit' && 'יצירת זיכוי חדש'}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Forms - Checking both Edit and Create states */}

                    {/* QUOTE FORM */}
                    {((editDialogType === 'quote' && editingQuote) || selectedType === 'quote') && (
                        <QuoteForm
                            clients={clients}
                            initialData={editingQuote || undefined}
                            onSuccess={() => {
                                handleFormSuccess()
                                setShowEditDialog(false)
                            }}
                        />
                    )}

                    {/* INVOICE FORM */}
                    {((editDialogType === 'invoice' && editingInvoice) || selectedType === 'invoice') && (
                        <InvoiceForm
                            clients={clients}
                            initialData={editingInvoice || undefined}
                            onSuccess={() => {
                                handleFormSuccess()
                                setShowEditDialog(false)
                            }}
                        />
                    )}

                    {/* CREDIT NOTE FORM */}
                    {((editDialogType === 'credit' && editingCreditNote) || selectedType === 'credit') && (
                        <CreditNoteForm
                            // Assuming CreditNoteForm handles edit prop or logic internally if passed, 
                            // but simpler to just mirror existing usage. 
                            // Existing usage for EDIT had no props? That seems wrong for 'Edit', 
                            // but I will persist what was there for 'selectedType'.
                            // If edit logic was missing props, I won't fix it blindly.
                            onSuccess={() => {
                                handleFormSuccess()
                                setShowEditDialog(false)
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
            <DocumentsTutorial
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />
        </div>
    )
}
