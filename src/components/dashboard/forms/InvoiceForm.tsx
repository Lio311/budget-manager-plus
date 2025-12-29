'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { getNextInvoiceNumber, createInvoice, type InvoiceFormData } from '@/lib/actions/invoices'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { useBudget } from '@/contexts/BudgetContext'
import { toast } from 'sonner'

interface InvoiceFormProps {
    clients: any[]
    onSuccess: () => void
}

export function InvoiceForm({ clients, onSuccess }: InvoiceFormProps) {
    const { budgetType } = useBudget()
    const [loadingNumber, setLoadingNumber] = useState(false)

    const [formData, setFormData] = useState<InvoiceFormData>({
        clientId: '',
        invoiceNumber: '',
        issueDate: new Date(),
        dueDate: undefined,
        subtotal: 0,
        vatRate: 0.18,
        paymentMethod: '',
        notes: ''
    })

    // Fetch next invoice number on mount
    useEffect(() => {
        const fetchNextNumber = async () => {
            setLoadingNumber(true)
            const result = await getNextInvoiceNumber()
            if (result.success && result.data) {
                setFormData(prev => ({ ...prev, invoiceNumber: result.data || '' }))
            }
            setLoadingNumber(false)
        }
        fetchNextNumber()
    }, [])

    const { execute: optimisticCreateInvoice } = useOptimisticMutation<any[], InvoiceFormData>(
        ['invoices', budgetType],
        (input) => createInvoice(input, budgetType),
        {
            getOptimisticData: (current, input) => {
                // In a real optimistic update we would add to the list, 
                // but here we just want the server action to fire and SWR to revalidate.
                // We can return current for now or mock the addition if we passed the full list.
                return current
            },
            successMessage: 'חשבונית נוצרה בהצלחה',
            errorMessage: 'שגיאה ביצירת החשבונית'
        }
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await optimisticCreateInvoice(formData)
            onSuccess()
        } catch (error) {
            // Error managed by hook
        }
    }

    const total = formData.subtotal + (formData.subtotal * (formData.vatRate || 0))

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        מספר חשבונית *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            value={formData.invoiceNumber}
                            onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                            disabled={loadingNumber}
                        />
                        {loadingNumber && (
                            <div className="absolute left-2 top-2.5">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        לקוח *
                    </label>
                    <select
                        required
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
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
                        תאריך תשלום
                    </label>
                    <DatePicker
                        date={formData.dueDate}
                        setDate={(date) => setFormData({ ...formData, dueDate: date })}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        שיעור מע"מ
                    </label>
                    <select
                        value={formData.vatRate}
                        onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="0">ללא מע"מ (0%)</option>
                        <option value="0.18">מע"מ רגיל (18%)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        אמצעי תשלום
                    </label>
                    <select
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">בחר אמצעי תשלום</option>
                        <option value="BANK_TRANSFER">העברה בנקאית</option>
                        <option value="CREDIT_CARD">כרטיס אשראי</option>
                        <option value="BIT">ביט</option>
                        <option value="PAYBOX">פייבוקס</option>
                        <option value="CASH">מזומן</option>
                        <option value="CHECK">צ'ק</option>
                        <option value="OTHER">אחר</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex justify-between text-sm mb-2">
                    <span>סכום לפני מע"מ:</span>
                    <span>₪{formData.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                    <span>מע"מ ({(formData.vatRate || 0) * 100}%):</span>
                    <span>₪{(formData.subtotal * (formData.vatRate || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>סה"כ לתשלום:</span>
                    <span className="text-purple-600">₪{total.toLocaleString()}</span>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                />
            </div>

            <div className="flex gap-2 pt-2">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto">
                    צור חשבונית
                </Button>
            </div>
        </form>
    )
}
