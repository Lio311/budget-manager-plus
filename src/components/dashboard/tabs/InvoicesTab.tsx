'use client'

import { useState } from 'react'
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, AlertCircle, Download, Trash2, Pencil, ChevronDown, Link as LinkIcon, PenTool, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/Pagination'
import { getInvoices, updateInvoiceStatus, generateInvoiceLink, type InvoiceFormData } from '@/lib/actions/invoices'
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
import { InvoiceForm } from '@/components/dashboard/forms/InvoiceForm'
import { useDemo } from '@/contexts/DemoContext'

const statusConfig = {
    DRAFT: { label: 'טיוטה', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
    SENT: { label: 'נשלח', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    PAID: { label: 'שולם', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    SIGNED: { label: 'נחתם', icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-100' },
    OVERDUE: { label: 'באיחור', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
    CANCELLED: { label: 'בוטל', icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-100' }
}

interface Invoice {
    id: string
    invoiceNumber: string
    clientName: string
    clientId: string
    date: string | Date
    dueDate?: string | Date
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    totalAmount: number
    vatAmount: number
    invoiceType: string
    items: any[]
    guestClientName?: string | null
}

const getInvoiceLabel = (type: string) => {
    const map: Record<string, string> = {
        'TAX_INVOICE': 'חשבונית מס',
        'RECEIPT': 'קבלה',
        'INVOICE': 'חשבונית מס \\ קבלה',
        'invoice': 'חשבונית מס \\ קבלה',
        'Invoice': 'חשבונית מס \\ קבלה',
        'DEAL_INVOICE': 'חשבונית עסקה',
        'REFUND_INVOICE': 'חשבונית זיכוי'
    }
    return map[type] || 'חשבונית'
}

export function InvoicesTab() {
    const { budgetType } = useBudget()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    const { isDemo, data: demoData, interceptAction } = useDemo()

    // Dialog states for desktop and mobile
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null) // Restore Edit State

    const invoicesFetcher = async () => {
        const result = await getInvoices(budgetType)
        if (!result.success || !result.data) return []

        return result.data.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            // Logic: If guest name exists and is not empty, use it. Else client name. Else Unknown.
            clientName: (inv.guestClientName && inv.guestClientName.trim()) ? inv.guestClientName : (inv.client?.name || 'לקוח לא ידוע'),
            clientId: inv.clientId,
            date: inv.issueDate,
            dueDate: inv.dueDate,
            status: inv.status as any,
            totalAmount: inv.total,
            vatAmount: inv.vatAmount,
            invoiceType: inv.invoiceType || 'INVOICE',
            items: inv.lineItems || [], // Ensure items passed for edit
            guestClientName: inv.guestClientName,
            createIncomeFromInvoice: inv.createIncomeFromInvoice, // Pass this too
            incomes: inv.incomes
        }))
    }

    const clientsFetcher = async () => {
        const result = await getClients(budgetType)
        return result.data || []
    }

    const { data: invoicesData = [], isLoading, mutate } = useSWR<Invoice[]>(
        isDemo ? null : ['invoices', budgetType],
        invoicesFetcher,
        { revalidateOnFocus: false }
    )
    const { data: clientsData = [] } = useSWR(isDemo ? null : ['clients', budgetType], clientsFetcher)

    const invoices = isDemo ? demoData.invoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        clientId: 'demo-client',
        date: inv.date,
        dueDate: inv.dueDate,
        status: inv.status,
        totalAmount: inv.amount,
        vatAmount: inv.amount * 0.17, // approximation
        invoiceType: 'INVOICE',
        items: [],
        guestClientName: null // Fix missing property
    })) : invoicesData

    const clients = isDemo ? demoData.clients : clientsData

    const filteredInvoices = invoices.filter(inv =>
        (inv.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber?.toString().includes(searchTerm)
    )

    const itemsPerPage = 5

    useAutoPaginationCorrection(currentPage, filteredInvoices.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage)
    const paginatedInvoices = filteredInvoices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    // Optimistic status update for instant UI feedback
    const { execute: optimisticUpdateStatus } = useOptimisticMutation<Invoice[], { id: string, status: any }>(
        ['invoices', budgetType],
        ({ id, status }) => updateInvoiceStatus(id, status),
        {
            getOptimisticData: (current, { id, status }) => current.map(inv => inv.id === id ? { ...inv, status } : inv),
            successMessage: 'סטטוס עודכן בהצלחה',
            errorMessage: 'שגיאה בעדכון הסטטוס'
        }
    )

    const handleStatusChange = async (invoiceId: string, newStatus: any) => {
        try {
            await optimisticUpdateStatus({ id: invoiceId, status: newStatus })
        } catch (error) {
            // Error managed by hook
        }
    }

    const handleDownloadPDF = async (invoiceId: string) => {
        try {
            const response = await fetch(`/api/invoices/${invoiceId}/pdf`)
            if (!response.ok) throw new Error('Failed to download PDF')

            const blob = await response.blob()

            // Try to get filename from content-disposition header
            let filename = `invoice-${invoiceId}.pdf`
            const contentDisposition = response.headers.get('content-disposition')
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/) || contentDisposition.match(/filename="?([^"]+)"?/)
                if (filenameMatch && filenameMatch[1]) {
                    filename = decodeURIComponent(filenameMatch[1])
                }
            }

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

    const handleCopyLink = async (invoiceId: string) => {
        try {
            const result = await generateInvoiceLink(invoiceId)
            if (result.success && result.token) {
                const url = `${window.location.origin}/invoice/${result.token}`

                // Try native share first (mobile)
                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'חשבונית',
                            text: 'הינה החשבונית שלך',
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

    const handleViewInvoice = async (invoiceId: string) => {
        try {
            toast.info('פותח חשבונית...')
            const result = await generateInvoiceLink(invoiceId) // reusing this to get/ensure token
            if (result.success && result.token) {
                // On mobile, async window.open is often blocked. Use location.href for reliability.
                window.location.href = `${window.location.origin}/invoice/${result.token}`
            } else {
                toast.error('שגיאה בפתיחת החשבונית')
            }
        } catch (error) {
            toast.error('שגיאה בפתיחת החשבונית')
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
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">חשבוניות</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ניהול חשבוניות ללקוחות</p>
                </div>

                {/* Desktop Button */}
                <div className="hidden md:block">
                    <Button
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                            if (isDemo) { interceptAction(); return; }
                            if (!clients || clients.length === 0) {
                                toast.error('אין לקוחות פעילים, לא ניתן לייצר חשבונית')
                                return
                            }
                            setIsDialogOpen(true)
                        }}
                    >
                        <Plus className="h-4 w-4 ml-2" />
                        חשבונית חדשה
                    </Button>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open)
                        if (!open) setSelectedInvoice(null)
                    }}>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] max-w-3xl rounded-xl" dir="rtl">
                            <DialogTitle className="sr-only">הוספת חשבונית</DialogTitle>
                            <div className="p-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                                    {selectedInvoice ? 'עריכת חשבונית' : 'יצירת חשבונית חדשה'}
                                </h3>
                                <InvoiceForm
                                    clients={clients}
                                    initialData={selectedInvoice ? {
                                        ...selectedInvoice,
                                        issueDate: selectedInvoice.date,
                                        total: selectedInvoice.totalAmount,
                                        subtotal: selectedInvoice.totalAmount - (selectedInvoice.vatAmount || 0),
                                        // We need to reconstruct full form data if possible, or fetch singular invoice on edit click specific logic
                                        // For now, passing mapped data
                                    } : undefined}
                                    onSuccess={() => {
                                        setIsDialogOpen(false)
                                        setSelectedInvoice(null)
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
                    placeholder="חיפוש לפי שם לקוח או מספר חשבונית..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                />
            </div>

            {/* Mobile FAB */}
            <div className="md:hidden">
                <FloatingActionButton
                    onClick={() => {
                        if (!clients || clients.length === 0) {
                            toast.error('אין לקוחות פעילים, לא ניתן לייצר חשבונית')
                            return
                        }
                        setIsMobileOpen(true)
                    }}
                    colorClass="bg-purple-600"
                    label="הוסף חשבונית"
                />

                <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] rounded-xl" dir="rtl">
                        <DialogTitle className="sr-only">הוספת חשבונית</DialogTitle>
                        <div className="mt-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">יצירת חשבונית חדשה</h3>
                            <InvoiceForm
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

            {/* Invoices List */}
            <div className="flex flex-col gap-3">
                {paginatedInvoices.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-lg border border-gray-200 text-gray-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400">
                        {searchTerm ? 'לא נמצאו חשבוניות' : 'אין חשבוניות עדיין. צור חשבונית חדשה כדי להתחיל.'}
                    </div>
                ) : (
                    paginatedInvoices.map((inv) => (
                        <div key={inv.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group dark:bg-slate-800 dark:border-slate-700">
                            {/* Mobile Layout: Stacked */}
                            {/* Top: Client + Status */}
                            <div className="flex items-start justify-between w-full md:w-auto md:flex-1 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                        {inv.clientName?.[0] || '?'}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                            {inv.clientName}
                                            <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                inv.invoiceType === 'RECEIPT' ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
                                                    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                                            )}>
                                                {getInvoiceLabel(inv.invoiceType)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            #{inv.invoiceNumber} • {format(new Date(inv.date), 'dd/MM/yyyy')} • <span className="text-[10px] text-red-500">{inv.invoiceType}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge - Visible on Mobile Top Right, Desktop Center */}
                                <div className="md:hidden" onClick={(e) => e.stopPropagation()}>
                                    <Select
                                        value={inv.status}
                                        onValueChange={(value) => handleStatusChange(inv.id, value)}
                                    >
                                        <SelectTrigger className={cn("h-7 text-xs px-2 border-0 shadow-none font-medium",
                                            inv.status === 'DRAFT' ? 'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300' :
                                                inv.status === 'SENT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' :
                                                    inv.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                                                        inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                                                            'bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300'
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl" className="text-right">
                                            <SelectItem value="DRAFT" className="pr-8">טיוטה</SelectItem>
                                            <SelectItem value="SENT" className="pr-8">נשלח</SelectItem>
                                            <SelectItem value="SIGNED" className="pr-8">נחתם</SelectItem>
                                            <SelectItem value="PAID" className="pr-8">שולם</SelectItem>
                                            <SelectItem value="OVERDUE" className="pr-8">באיחור</SelectItem>
                                            <SelectItem value="CANCELLED" className="pr-8">בוטל</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Desktop: Status Center */}
                            <div className="hidden md:flex items-center justify-center flex-1" onClick={(e) => e.stopPropagation()}>
                                <Select
                                    value={inv.status}
                                    onValueChange={(value) => handleStatusChange(inv.id, value)}
                                >
                                    <SelectTrigger className={cn("h-8 w-[120px] text-xs px-2 border border-gray-200 shadow-sm",
                                        inv.status === 'DRAFT' ? 'bg-gray-50 text-gray-700 dark:bg-slate-800 dark:text-gray-300 dark:border-slate-700' :
                                            inv.status === 'SENT' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800' :
                                                inv.status === 'PAID' ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800' :
                                                    inv.status === 'OVERDUE' ? 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800' :
                                                        'bg-gray-50 text-gray-700 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600'
                                    )}>
                                        <span className="w-full text-center font-medium">
                                            <SelectValue />
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent dir="rtl" className="text-right">
                                        <SelectItem value="DRAFT" className="pr-8">טיוטה</SelectItem>
                                        <SelectItem value="SENT" className="pr-8">נשלח</SelectItem>
                                        <SelectItem value="SIGNED" className="pr-8">נחתם</SelectItem>
                                        <SelectItem value="PAID" className="pr-8">שולם</SelectItem>
                                        <SelectItem value="OVERDUE" className="pr-8">באיחור</SelectItem>
                                        <SelectItem value="CANCELLED" className="pr-8">בוטל</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bottom/Right: Amount + Actions */}
                            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto md:flex-1 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-700">
                                <div className="text-right md:text-left">
                                    <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{formatCurrency(inv.totalAmount)}</div>
                                    <div className="text-[10px] text-gray-400">לפני מע"מ: {formatCurrency(inv.totalAmount - (inv.vatAmount || 0))}</div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            if (isDemo) { interceptAction(); return; }
                                            // Ideally fetch full details here, but for now prompt edit with known data
                                            setSelectedInvoice(inv)
                                            setIsDialogOpen(true)
                                        }}
                                        className="h-8 w-8 p-0 text-gray-500 hover:text-gray-900 border-gray-200"
                                        title="ערוך"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleCopyLink(inv.id)} className="gap-2 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100">
                                        <LinkIcon className="h-4 w-4" />
                                        <span className="md:hidden">קישור לחתימה</span>
                                        <span className="hidden md:inline">קישור לחתימה</span>
                                    </Button>
                                    {(inv.status as string) === 'SIGNED' && (
                                        <Button variant="outline" size="sm" onClick={() => handleViewInvoice(inv.id)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100" title="צפה בחשבונית">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {
                totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-center direction-ltr">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )
            }
        </div>
    )
}
