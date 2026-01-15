'use client'

import { useState } from 'react'
import { FileText, Receipt, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import { QuoteForm } from '@/components/dashboard/forms/QuoteForm'
import { InvoiceForm } from '@/components/dashboard/forms/InvoiceForm'
import { CreditNoteForm } from '@/components/dashboard/forms/CreditNoteForm'
import useSWR from 'swr'
import { getClients } from '@/lib/actions/clients'
import { getQuotes } from '@/lib/actions/quotes'
import { getInvoices } from '@/lib/actions/invoices'
import { getCreditNotes } from '@/lib/actions/credit-notes'
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
    SelectValue
} from '@/components/ui/select'
import { Pagination } from '@/components/ui/Pagination'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'

type DocumentType = 'quote' | 'invoice' | 'credit' | null

const documentTypes = [
    {
        value: 'quote' as const,
        label: 'הצעת מחיר',
        icon: FileText,
        color: 'bg-yellow-500 hover:bg-yellow-600',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-600'
    },
    {
        value: 'invoice' as const,
        label: 'חשבונית',
        icon: Receipt,
        color: 'bg-purple-500 hover:bg-purple-600',
        borderColor: 'border-purple-500',
        textColor: 'text-purple-600'
    },
    {
        value: 'credit' as const,
        label: 'זיכוי',
        icon: CreditCard,
        color: 'bg-orange-500 hover:bg-orange-600',
        borderColor: 'border-orange-500',
        textColor: 'text-orange-600'
    },
]

export function DocumentsTab() {
    const { budgetType } = useBudget()
    const { isDemo, data: demoData, interceptAction } = useDemo()

    const [selectedType, setSelectedType] = useState<DocumentType>(null)
    const [filterType, setFilterType] = useState<'all' | 'quote' | 'invoice' | 'credit'>('all')
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')

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
            clientName: i.client?.name || 'לקוח לא ידוע'
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
        clientsFetcher
    )

    const { data: quotesData = [], mutate: mutateQuotes } = useSWR(
        isDemo ? null : ['quotes', budgetType],
        quotesFetcher
    )

    const { data: invoicesData = [], mutate: mutateInvoices } = useSWR(
        isDemo ? null : ['invoices', budgetType],
        invoicesFetcher
    )

    const { data: creditNotesData = [], mutate: mutateCreditNotes } = useSWR(
        isDemo ? null : ['credit-notes', budgetType],
        creditNotesFetcher
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
        mutateQuotes()
        mutateInvoices()
        mutateCreditNotes()
    }

    const getDocumentTypeConfig = (type: 'quote' | 'invoice' | 'credit') => {
        return documentTypes.find(dt => dt.value === type)!
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">הפקת מסמכים</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ניהול הצעות מחיר, חשבוניות וזיכויים
                </p>
            </div>

            {/* Document Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md hover:scale-102"
                            )}
                        >
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
                                isSelected ? docType.color : "bg-gray-100 dark:bg-slate-700 group-hover:bg-gray-200"
                            )}>
                                <Icon className={cn(
                                    "w-8 h-8",
                                    isSelected ? "text-white" : "text-gray-600 dark:text-gray-300"
                                )} />
                            </div>
                            <div className="text-center">
                                <div className={cn(
                                    "font-bold text-lg",
                                    isSelected ? docType.textColor : "text-gray-900 dark:text-gray-100"
                                )}>
                                    {docType.label}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {isSelected ? "לחץ לביטול" : "לחץ ליצירה"}
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Form Section */}
            {selectedType && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {selectedType === 'quote' && 'יצירת הצעת מחיר חדשה'}
                            {selectedType === 'invoice' && 'יצירת חשבונית חדשה'}
                            {selectedType === 'credit' && 'יצירת זיכוי חדש'}
                        </h3>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedType(null)}
                        >
                            ביטול
                        </Button>
                    </div>

                    {selectedType === 'quote' && (
                        <QuoteForm
                            clients={clients}
                            onSuccess={handleFormSuccess}
                        />
                    )}
                    {selectedType === 'invoice' && (
                        <InvoiceForm
                            clients={clients}
                            onSuccess={handleFormSuccess}
                        />
                    )}
                    {selectedType === 'credit' && (
                        <CreditNoteForm
                            onSuccess={handleFormSuccess}
                        />
                    )}
                </div>
            )}

            {/* Documents List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        רשימת מסמכים
                    </h3>

                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        {/* Filter */}
                        <Select value={filterType} onValueChange={setFilterType}>
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
                        paginatedDocuments.map((doc) => {
                            const config = getDocumentTypeConfig(doc.type)
                            const Icon = config.icon

                            return (
                                <div
                                    key={`${doc.type}-${doc.id}`}
                                    className="flex items-center justify-between p-4 border border-gray-100 dark:border-slate-700 rounded-lg hover:shadow-md transition-all"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center",
                                            config.color
                                        )}>
                                            <Icon className="w-5 h-5 text-white" />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-900 dark:text-gray-100">
                                                    {doc.clientName}
                                                </span>
                                                <span className={cn(
                                                    "text-xs px-2 py-0.5 rounded-full font-medium",
                                                    config.textColor,
                                                    "bg-gray-100 dark:bg-slate-700"
                                                )}>
                                                    {config.label}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                #{doc.displayNumber} • {format(new Date(doc.displayDate), 'dd/MM/yyyy')}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left">
                                        <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">
                                            {formatCurrency(doc.displayAmount)}
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
        </div>
    )
}
