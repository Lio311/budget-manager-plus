'use client'

import { useState } from 'react'
import { Plus, Search, FileText, Download, Trash2, Eye, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Pagination } from '@/components/ui/Pagination'
import { getCreditNotes, deleteCreditNote, generateCreditNoteLink } from '@/lib/actions/credit-notes'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { useAutoPaginationCorrection } from '@/hooks/useAutoPaginationCorrection'
import useSWR from 'swr'
import { toast } from 'sonner'
import { useBudget } from '@/contexts/BudgetContext'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { CreditNoteForm } from '@/components/dashboard/forms/CreditNoteForm'

interface CreditNote {
    id: string
    creditNoteNumber: string
    issueDate: Date
    creditAmount: number
    totalCredit: number
    invoiceNumber: string
    clientName: string
    reason?: string
}

export function CreditNotesTab() {
    const { budgetType } = useBudget()
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const creditNotesFetcher = async () => {
        const result = await getCreditNotes(budgetType)
        if (!result.success || !result.data) return []

        return result.data.map((cn: any) => ({
            id: cn.id,
            creditNoteNumber: cn.creditNoteNumber,
            issueDate: cn.issueDate,
            creditAmount: cn.creditAmount,
            totalCredit: cn.totalCredit,
            invoiceNumber: cn.invoice.invoiceNumber,
            clientName: cn.invoice.client?.name || 'לקוח לא ידוע',
            reason: cn.reason
        }))
    }

    const { data: creditNotes = [], isLoading, mutate } = useSWR<CreditNote[]>(
        ['creditNotes', budgetType],
        creditNotesFetcher,
        { revalidateOnFocus: false }
    )

    const filteredCreditNotes = creditNotes.filter(cn =>
        cn.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cn.creditNoteNumber.includes(searchTerm) ||
        cn.invoiceNumber.includes(searchTerm)
    )

    const itemsPerPage = 5
    useAutoPaginationCorrection(currentPage, filteredCreditNotes.length, itemsPerPage, setCurrentPage)
    const totalPages = Math.ceil(filteredCreditNotes.length / itemsPerPage)
    const paginatedCreditNotes = filteredCreditNotes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    )

    const { execute: optimisticDelete } = useOptimisticMutation<CreditNote[], string>(
        ['creditNotes', budgetType],
        (id) => deleteCreditNote(id),
        {
            getOptimisticData: (current, id) => {
                return current.filter(cn => cn.id !== id)
            },
            onError: (error: any) => {
                toast.error('שגיאה במחיקת חשבונית זיכוי')
                mutate()
            },
            onSuccess: () => {
                toast.success('חשבונית זיכוי נמחקה בהצלחה')
                mutate()
            }
        }
    )

    const handleDelete = async (id: string) => {
        if (confirm('האם אתה בטוח שברצונך למחוק חשבונית זיכוי זו?')) {
            await optimisticDelete(id)
        }
    }

    const handleDownloadPDF = async (id: string) => {
        try {
            const response = await fetch(`/api/credit-notes/${id}/pdf`)
            if (!response.ok) throw new Error('Failed to download PDF')

            let filename = `credit-note-${id}.pdf`
            const contentDisposition = response.headers.get('Content-Disposition')

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

    const handleViewCreditNote = (id: string) => {
        window.open(`/credit-note/${id}`, '_blank')
    }

    const handleCopyLink = async (creditNoteId: string) => {
        try {
            const result = await generateCreditNoteLink(creditNoteId)
            if (result.success && result.token) {
                const url = `${window.location.origin}/credit-note/${result.token}`

                if (navigator.share) {
                    try {
                        await navigator.share({
                            title: 'חשבונית זיכוי',
                            text: 'הינה חשבונית הזיכוי שלך',
                            url: url
                        })
                        return
                    } catch (err) {
                        if ((err as Error).name !== 'AbortError') {
                            console.error('Share failed:', err)
                        }
                    }
                }

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
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                        type="text"
                        placeholder="חיפוש לפי לקוח, מספר זיכוי או חשבונית..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                    />
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="hidden md:flex bg-purple-600 hover:bg-purple-700 text-white gap-2">
                            <Plus className="h-4 w-4" />
                            חשבונית זיכוי חדשה
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogTitle>חשבונית זיכוי חדשה</DialogTitle>
                        <CreditNoteForm onSuccess={() => { setIsDialogOpen(false); mutate() }} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Credit Notes List */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
                {filteredCreditNotes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>אין חשבוניות זיכוי</p>
                    </div>
                ) : (
                    paginatedCreditNotes.map((creditNote) => (
                        <div key={creditNote.id} className="p-4 border-b border-gray-100 dark:border-slate-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                {/* Info */}
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-purple-600 dark:text-purple-400">{creditNote.creditNoteNumber}</span>
                                        <span className="text-sm text-gray-500">← חשבונית {creditNote.invoiceNumber}</span>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{creditNote.clientName}</div>
                                    <div className="text-xs text-gray-400">{format(new Date(creditNote.issueDate), 'dd/MM/yyyy')}</div>
                                    {creditNote.reason && (
                                        <div className="text-xs text-gray-500 italic">{creditNote.reason}</div>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <div className="font-bold text-purple-600 dark:text-purple-400 text-lg">{formatCurrency(creditNote.totalCredit)}</div>
                                    <div className="text-xs text-gray-400">לפני מע"מ: {formatCurrency(creditNote.creditAmount)}</div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleCopyLink(creditNote.id)} className="gap-2 text-purple-600 border-purple-200 bg-purple-50 hover:bg-purple-100">
                                        <LinkIcon className="h-4 w-4" />
                                        <span className="hidden md:inline">קישור</span>
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleViewCreditNote(creditNote.id)} className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDownloadPDF(creditNote.id)} className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={() => handleDelete(creditNote.id)} className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex justify-center">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* Mobile FAB */}
            <FloatingActionButton onClick={() => setIsMobileOpen(true)} className="md:hidden" />
            <Dialog open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto">
                    <DialogTitle>חשבונית זיכוי חדשה</DialogTitle>
                    <CreditNoteForm onSuccess={() => { setIsMobileOpen(false); mutate() }} />
                </DialogContent>
            </Dialog>
        </div>
    )
}
