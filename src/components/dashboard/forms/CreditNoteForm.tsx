'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getNextCreditNoteNumber, createCreditNote, type CreditNoteFormData } from '@/lib/actions/credit-notes'
import { getInvoices } from '@/lib/actions/invoices'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { useBudget } from '@/contexts/BudgetContext'
import { toast } from 'sonner'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import useSWR from 'swr'
import { formatCurrency } from '@/lib/utils'

interface CreditNoteFormProps {
    onSuccess: () => void
}

export function CreditNoteForm({ onSuccess }: CreditNoteFormProps) {
    const { budgetType } = useBudget()
    const [formData, setFormData] = useState<CreditNoteFormData>({
        invoiceId: '',
        creditNoteNumber: '',
        issueDate: new Date(),
        creditAmount: 0,
        reason: ''
    })

    const [loadingNumber, setLoadingNumber] = useState(false)
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Fetch invoices
    const { data: invoicesData } = useSWR(['invoices', budgetType], async () => {
        const result = await getInvoices(budgetType)
        return result.data || []
    })

    const invoices = invoicesData || []

    // Fetch next credit note number on mount
    useEffect(() => {
        const fetchNextNumber = async () => {
            setLoadingNumber(true)
            const result = await getNextCreditNoteNumber()
            if (result.success && result.number) {
                setFormData(prev => ({ ...prev, creditNoteNumber: result.number }))
            }
            setLoadingNumber(false)
        }
        fetchNextNumber()
    }, [])

    // Update selected invoice details
    useEffect(() => {
        if (formData.invoiceId) {
            const invoice = invoices.find((inv: any) => inv.id === formData.invoiceId)
            setSelectedInvoice(invoice)
            if (invoice) {
                setFormData(prev => ({
                    ...prev,
                    creditAmount: invoice.total // Default to full credit
                }))
            }
        } else {
            setSelectedInvoice(null)
        }
    }, [formData.invoiceId, invoices])

    const { execute: handleCreate } = useOptimisticMutation(
        async (data: CreditNoteFormData) => {
            const result = await createCreditNote(data)
            if (!result.success) throw new Error(result.error)
            return result
        },
        {
            onSuccess: () => {
                toast.success('חשבונית זיכוי נוצרה בהצלחה')
                onSuccess()
            },
            onError: (error: any) => {
                toast.error(error.message || 'שגיאה ביצירת חשבונית זיכוי')
            }
        }
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.invoiceId) {
            toast.error('יש לבחור חשבונית')
            return
        }

        if (formData.creditAmount <= 0) {
            toast.error('סכום הזיכוי חייב להיות גדול מ-0')
            return
        }

        if (selectedInvoice && formData.creditAmount > selectedInvoice.total) {
            toast.error('סכום הזיכוי לא יכול להיות גדול מסכום החשבונית')
            return
        }

        setIsSubmitting(true)
        try {
            await handleCreate(formData)
        } finally {
            setIsSubmitting(false)
        }
    }

    const vatAmount = selectedInvoice ? formData.creditAmount * selectedInvoice.vatRate : 0
    const totalCredit = formData.creditAmount + vatAmount

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        מספר חשבונית זיכוי *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            value={formData.creditNoteNumber}
                            readOnly
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-slate-900 dark:border-slate-800 dark:text-gray-400"
                        />
                        {loadingNumber && (
                            <div className="absolute left-2 top-2.5">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        חשבונית מקורית *
                    </label>
                    <div dir="rtl">
                        <Select
                            value={formData.invoiceId}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, invoiceId: value }))}
                        >
                            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-right">
                                <SelectValue placeholder="בחר חשבונית" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                {invoices.map((invoice: any) => (
                                    <SelectItem key={invoice.id} value={invoice.id}>
                                        {invoice.invoiceNumber} - {invoice.client?.name} ({formatCurrency(invoice.total)})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        תאריך הנפקה *
                    </label>
                    <DatePicker
                        date={formData.issueDate}
                        setDate={(date) => date && setFormData({ ...formData, issueDate: date })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        סכום זיכוי (לפני מע"מ) *
                    </label>
                    <FormattedNumberInput
                        value={formData.creditAmount}
                        onChange={(e) => { }}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, creditAmount: value }))}
                        className="w-full"
                        disabled={!selectedInvoice}
                    />
                    {selectedInvoice && (
                        <div className="text-xs text-gray-500 mt-1">
                            מקסימום: {formatCurrency(selectedInvoice.total)}
                        </div>
                    )}
                </div>
            </div>

            {selectedInvoice && (
                <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100 dark:border-purple-900/30">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="dark:text-purple-100">סכום לפני מע"מ:</span>
                            <span className="dark:text-purple-100">{formatCurrency(formData.creditAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="dark:text-purple-100">מע"מ ({(selectedInvoice.vatRate * 100)}%):</span>
                            <span className="dark:text-purple-100">{formatCurrency(vatAmount)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-purple-200 pt-2 dark:border-purple-900/50">
                            <span className="dark:text-purple-100">סה"כ זיכוי:</span>
                            <span className="text-purple-700 dark:text-purple-400">{formatCurrency(totalCredit)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    סיבה (אופציונלי)
                </label>
                <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={3}
                    placeholder="למשל: ביטול עסקה, החזר כספי, תיקון טעות..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                />
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white w-full md:w-auto"
                    disabled={isSubmitting || !formData.invoiceId}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            יוצר...
                        </>
                    ) : (
                        'צור חשבונית זיכוי'
                    )}
                </Button>
            </div>
        </form>
    )
}
