'use client'

import { useState } from 'react'
import { Plus, Search, FileText, CheckCircle, Clock, XCircle, AlertCircle, Download, Trash2, Pencil, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/Pagination'
import { getInvoices, updateInvoiceStatus, type InvoiceFormData } from '@/lib/actions/invoices'
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

const statusConfig = {
    DRAFT: { label: 'טיוטה', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
    SENT: { label: 'נשלח', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
    PAID: { label: 'שולם', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
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
    items: any[]
}

export function InvoicesTab() {
    const { budgetType } = useBudget()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)

    // Dialog states for desktop and mobile
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const invoicesFetcher = async () => {
        const result = await getInvoices(budgetType)
        if (!result.success || !result.data) return []

        return result.data.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            clientName: inv.client?.name || 'לקוח לא ידוע',
            clientId: inv.clientId,
            date: inv.issueDate,
            dueDate: inv.dueDate,
            status: inv.status as any,
            totalAmount: inv.total,
            vatAmount: inv.vatAmount,
            items: []
        }))
    }

    const clientsFetcher = async () => {
        const result = await getClients(budgetType)
        return result.data || []
    }

    const { data: invoices = [], isLoading, mutate } = useSWR<Invoice[]>(
        ['invoices', budgetType],
        invoicesFetcher,
        { revalidateOnFocus: false }
    )
    const { data: clients = [] } = useSWR(['clients', budgetType], clientsFetcher)

    const filteredInvoices = invoices.filter(inv =>
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoiceNumber.toString().includes(searchTerm)
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

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="max-h-[90vh] overflow-y-auto w-[95%] max-w-3xl rounded-xl" dir="rtl">
                            <DialogTitle className="sr-only">הוספת חשבונית</DialogTitle>
                            <div className="p-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">יצירת חשבונית חדשה</h3>
                                <InvoiceForm
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
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            #{inv.invoiceNumber} • {format(new Date(inv.date), 'dd/MM/yyyy')}
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
                                            inv.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                                                inv.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                                                    inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                        inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                        )}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent dir="rtl">
                                            <SelectItem value="DRAFT">טיוטה</SelectItem>
                                            <SelectItem value="SENT">נשלח</SelectItem>
                                            <SelectItem value="PAID">שולם</SelectItem>
                                            <SelectItem value="OVERDUE">באיחור</SelectItem>
                                            <SelectItem value="CANCELLED">בוטל</SelectItem>
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
                                        inv.status === 'DRAFT' ? 'bg-gray-50 text-gray-700' :
                                            inv.status === 'SENT' ? 'bg-blue-50 text-blue-700' :
                                                inv.status === 'PAID' ? 'bg-green-50 text-green-700' :
                                                    inv.status === 'OVERDUE' ? 'bg-red-50 text-red-700' :
                                                        'bg-gray-50 text-gray-700 dark:bg-slate-700 dark:text-gray-300 dark:border-slate-600'
                                    )}>
                                        <span className="w-full text-center font-medium">
                                            <SelectValue />
                                        </span>
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="DRAFT">טיוטה</SelectItem>
                                        <SelectItem value="SENT">נשלח</SelectItem>
                                        <SelectItem value="PAID">שולם</SelectItem>
                                        <SelectItem value="OVERDUE">באיחור</SelectItem>
                                        <SelectItem value="CANCELLED">בוטל</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bottom/Right: Amount + Actions */}
                            <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto md:flex-1 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-slate-700">
                                <div className="text-right md:text-left">
                                    <div className="font-bold text-gray-900 dark:text-gray-100 text-lg">{formatCurrency(inv.totalAmount)}</div>
                                    <div className="text-[10px] text-gray-400">לפני מע"מ: {formatCurrency(inv.totalAmount - (inv.vatAmount || 0))}</div>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(inv.id)} className="gap-2">
                                    <Download className="h-4 w-4" />
                                    <span className="md:hidden">הורד PDF</span>
                                </Button>
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
