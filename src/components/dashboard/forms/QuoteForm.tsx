'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { getNextQuoteNumber, createQuote, type QuoteFormData } from '@/lib/actions/quotes'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { useBudget } from '@/contexts/BudgetContext'
import { toast } from 'sonner'

interface QuoteFormProps {
    clients: any[]
    onSuccess: () => void
}

export function QuoteForm({ clients, onSuccess }: QuoteFormProps) {
    const { budgetType } = useBudget()
    const [loadingNumber, setLoadingNumber] = useState(false)

    const [formData, setFormData] = useState<QuoteFormData>({
        clientId: '',
        quoteNumber: '',
        issueDate: new Date(),
        validUntil: undefined,
        subtotal: 0,
        vatRate: 0.18,
        notes: ''
    })

    // Fetch next quote number on mount
    useEffect(() => {
        const fetchNextNumber = async () => {
            setLoadingNumber(true)
            const result = await getNextQuoteNumber()
            if (result.success && result.data) {
                setFormData(prev => ({ ...prev, quoteNumber: result.data || '' }))
            }
            setLoadingNumber(false)
        }
        fetchNextNumber()
    }, [])

    const { execute: optimisticCreateQuote } = useOptimisticMutation<any[], QuoteFormData>(
        ['quotes', budgetType],
        (input) => createQuote(input, budgetType),
        {
            getOptimisticData: (current, input) => {
                return current
            },
            successMessage: 'הצעת מחיר נוצרה בהצלחה',
            errorMessage: 'שגיאה ביצירת הצעת המחיר'
        }
    )

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await optimisticCreateQuote(formData)
            onSuccess()
        } catch (error) {
            // Error managed by hook
        }
    }

    const total = formData.subtotal + (formData.subtotal * (formData.vatRate || 0))

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        מספר הצעת מחיר *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            value={formData.quoteNumber}
                            onChange={(e) => setFormData({ ...formData, quoteNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
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

            <div className="flex gap-2 pt-2">
                <Button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white w-full md:w-auto">
                    צור הצעת מחיר
                </Button>
            </div>
        </form>
    )
}
