'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getNextInvoiceNumber, createInvoice, updateInvoice, type InvoiceFormData } from '@/lib/actions/invoices'
import { useBudget } from '@/contexts/BudgetContext'
import { useOptimisticMutation } from '@/hooks/useOptimisticMutation'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { getIncomes, getClientUninvoicedIncomes } from '@/lib/actions/income'
import useSWR from 'swr'
import { formatCurrency } from '@/lib/utils'
import { ClientSelector } from './ClientSelector'
import { RichTextEditor } from '@/components/ui/RichTextEditor'


interface LineItem {
    id: string
    description: string
    quantity: number
    price: number
    total: number
}

interface InvoiceFormProps {
    clients: any[]
    initialData?: any
    onSuccess: () => void
}


export function InvoiceForm({ clients, initialData, onSuccess }: InvoiceFormProps) {
    const { budgetType } = useBudget()
    // Helper to map initial data or use defaults
    const getInitialState = (): InvoiceFormData => {
        if (initialData) {
            return {
                clientId: initialData.clientId || '',
                invoiceNumber: initialData.invoiceNumber || '',
                issueDate: initialData.issueDate ? new Date(initialData.issueDate) : new Date(),
                dueDate: initialData.dueDate ? new Date(initialData.dueDate) : undefined,
                subtotal: initialData.subtotal || 0,
                vatRate: initialData.vatRate ?? 0.18,
                vatAmount: initialData.vatAmount || 0,
                total: initialData.total || 0,
                paymentMethod: initialData.paymentMethod || '',
                notes: initialData.notes || '',
                createIncomeFromInvoice: initialData.incomes && initialData.incomes.length > 0,
                invoiceType: initialData.invoiceType || 'TAX_INVOICE',
                lineItems: initialData.lineItems?.map((item: any) => ({
                    id: item.id, // Keep ID for updates if needed, though we often recreate
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                })) || []
            }
        }
        return {
            clientId: '',
            invoiceNumber: '',
            issueDate: new Date(),
            dueDate: undefined,
            subtotal: 0,
            vatRate: 0.18,
            vatAmount: 0,
            total: 0,
            paymentMethod: '',
            notes: '',
            createIncomeFromInvoice: false,
            invoiceType: 'TAX_INVOICE', // Default to Tax Invoice
            lineItems: []
        }
    }

    const [formData, setFormData] = useState<InvoiceFormData>(getInitialState())

    const [errors, setErrors] = useState<Record<string, boolean>>({})
    const [isGuestClient, setIsGuestClient] = useState(!!initialData?.guestClientName)
    const [guestClientName, setGuestClientName] = useState(initialData?.guestClientName || '')

    const [loadingNumber, setLoadingNumber] = useState(false)
    const { year, month } = useBudget()

    const [selectedIncomeId, setSelectedIncomeId] = useState<string>('none')
    const [lineItems, setLineItems] = useState<LineItem[]>(
        initialData?.lineItems?.map((item: any) => ({
            id: item.id || crypto.randomUUID(),
            description: item.description,
            quantity: item.quantity,
            price: item.price,
            total: item.total
        })) || []
    )

    // Fetch incomes for selection logic
    const { data: incomesData } = useSWR(['incomes', month, year, budgetType], () => getIncomes(month, year, budgetType))

    // Fetch client-specific open incomes (regardless of month)
    const { data: clientIncomesData } = useSWR(
        formData.clientId ? ['client-incomes', formData.clientId] : null,
        () => getClientUninvoicedIncomes(formData.clientId!)
    )

    // Determine which incomes to show
    const availableIncomes = formData.clientId
        ? (clientIncomesData?.data || [])
        : (incomesData?.data?.incomes || []).filter((inc: any) => !inc.invoiceId)

    // Auto-fill from selected income
    useEffect(() => {
        if (selectedIncomeId && selectedIncomeId !== 'none') {
            const income = availableIncomes.find((i: any) => i.id === selectedIncomeId)
            if (income) {
                // income.amount is TOTAL (Gross). We need to extract Net (Subtotal).
                // Assuming standard VAT rate of 0.18 (or use formData.vatRate if set, but 0.18 is safer default here)
                const vatRate = formData.vatRate || 0.18
                const totalAmount = income.amount
                const subtotal = totalAmount / (1 + vatRate)

                setFormData(prev => ({
                    ...prev,
                    clientId: income.clientId || prev.clientId,
                    subtotal: subtotal,
                    vatAmount: totalAmount - subtotal,
                    total: totalAmount,
                    notes: `עבור: ${income.source}`
                }))

                // Add default line item if empty
                if (lineItems.length === 0) {
                    setLineItems([{
                        id: crypto.randomUUID(),
                        description: income.source,
                        quantity: 1,
                        price: subtotal, // Net price
                        total: subtotal
                    }])
                }
            }
        }
    }, [selectedIncomeId])

    // Update subtotal when line items change
    useEffect(() => {
        const newSubtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
        setFormData(prev => ({ ...prev, subtotal: newSubtotal, lineItems }))
    }, [lineItems])

    // Fetch next invoice number on mount ONLY IF creating new
    useEffect(() => {
        const fetchNextNumber = async () => {
            if (!initialData) {
                setLoadingNumber(true)
                const result = await getNextInvoiceNumber()
                if (result.success && result.data) {
                    setFormData(prev => ({ ...prev, invoiceNumber: result.data || '' }))
                }
                setLoadingNumber(false)
            }
        }
        fetchNextNumber()
    }, [initialData])

    const { execute: optimisticCreateInvoice } = useOptimisticMutation<any[], InvoiceFormData>(
        ['invoices', budgetType],
        (input) => createInvoice(input, budgetType),
        {
            successMessage: 'חשבונית נוצרה בהצלחה',
            errorMessage: 'שגיאה ביצירת החשבונית'
        }
    )

    const { execute: optimisticUpdateInvoice } = useOptimisticMutation<any[], Partial<InvoiceFormData>>(
        ['invoices', budgetType],
        (input) => updateInvoice(initialData.id, input),
        {
            successMessage: 'חשבונית עודכנה בהצלחה',
            errorMessage: 'שגיאה בעדכון החשבונית'
        }
    )


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const newErrors: Record<string, boolean> = {}

        // Skip income check if editing or creating manual
        if (!initialData && (selectedIncomeId === 'none' || !selectedIncomeId) && !formData.createIncomeFromInvoice) {
            // Allow creating without income association if explicitly chosen or just manual?
            // Current logic enforced it. Let's relax it if user just wants a manual invoice?
            // But keeping strict for now unless editing.
            if (!initialData) newErrors.income = true
        }

        // Relaxing income requirement for Edit since it might already be linked or manually managed
        // If editing, we don't force re-selecting income.

        if (lineItems.length === 0) {
            newErrors.lineItems = true
        }

        if (!isGuestClient && !formData.clientId) {
            newErrors.clientId = true
        }

        if (isGuestClient && !guestClientName.trim()) {
            newErrors.guestClientName = true
        }

        if (Object.keys(newErrors).length > 0) {
            // Filter out income error if we are relaxing it
            if (initialData && newErrors.income) delete newErrors.income;

            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors)
                if (newErrors.income) toast.error('חובה לבחור מכירה/עסקה או לסמן יצירת הכנסה אוטומטית')
                else if (newErrors.lineItems) toast.error('חובה להוסיף לפחות שורה אחת לפירוט החשבונית')
                else toast.error('אנא מלא את שדות החובה המסומנים')
                return
            }
        }
        setErrors({})

        try {
            if (initialData) {
                await optimisticUpdateInvoice({
                    ...formData,
                    lineItems,
                    // client/guest logic usually not changeable in simple edit? or yes?
                    // allowing full edit for now
                    isGuestClient,
                    guestClientName: isGuestClient ? guestClientName : undefined,
                    clientId: isGuestClient ? undefined : formData.clientId,
                })
            } else {
                await optimisticCreateInvoice({
                    ...formData,
                    incomeId: selectedIncomeId,
                    createIncomeFromInvoice: formData.createIncomeFromInvoice,
                    lineItems,
                    isGuestClient,
                    guestClientName: isGuestClient ? guestClientName : undefined,
                    clientId: isGuestClient ? undefined : formData.clientId,
                    invoiceType: formData.invoiceType
                })
            }
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        סוג מסמך
                    </label>
                    <Select
                        value={formData.invoiceType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, invoiceType: value }))}
                    >
                        <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-right">
                            <SelectValue placeholder="בחר סוג מסמך" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                            <SelectItem value="TAX_INVOICE">חשבונית מס</SelectItem>
                            <SelectItem value="RECEIPT">קבלה</SelectItem>
                            <SelectItem value="INVOICE">חשבונית מס / קבלה</SelectItem>
                            <SelectItem value="DEAL_INVOICE">חשבונית עסקה</SelectItem>

                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        מספר חשבונית *
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            required
                            value={formData.invoiceNumber}
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
                        לקוח *
                    </label>
                    <ClientSelector
                        clients={clients}
                        selectedClientId={formData.clientId || ''}
                        guestClientName={guestClientName}
                        isGuestMode={isGuestClient}
                        onClientIdChange={(id) => setFormData(prev => ({ ...prev, clientId: id }))}
                        onGuestModeToggle={() => {
                            setIsGuestClient(!isGuestClient)
                            setErrors(prev => ({ ...prev, clientId: false, guestClientName: false }))
                        }}
                        onGuestNameChange={setGuestClientName}
                        error={errors.clientId || errors.guestClientName}
                    />
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
                        תאריך תשלום
                    </label>
                    <DatePicker
                        date={formData.dueDate}
                        setDate={(date) => setFormData({ ...formData, dueDate: date })}
                    />
                </div>
            </div>

            {/* Sale Selection */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 space-y-4">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="createIncome"
                        checked={formData.createIncomeFromInvoice || false}
                        onChange={(e) => {
                            const checked = e.target.checked
                            setFormData(prev => ({
                                ...prev,
                                createIncomeFromInvoice: checked,
                                incomeId: checked ? undefined : 'none' // Clear income selection if creating new
                            }))
                            if (checked) {
                                setSelectedIncomeId('none')
                            }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="createIncome" className="text-sm font-bold text-blue-900 dark:text-blue-300 cursor-pointer">
                        צור הכנסה חדשה אוטומטית (במקום לבחור קיימת)
                    </label>
                </div>

                {!formData.createIncomeFromInvoice && (
                    <div dir="rtl">
                        <label className="block text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                            בחר מכירה/עסקה (חובה)
                        </label>
                        <Select
                            value={selectedIncomeId}
                            onValueChange={(value) => {
                                setSelectedIncomeId(value)
                                // Reset line items if "none" selected? Or keep? Let's keep for flexibility but recommend reset
                                if (value === 'none') {
                                    setLineItems([])
                                    setFormData(prev => ({ ...prev, subtotal: 0 }))
                                }
                            }}
                        >
                            <SelectTrigger className={`w-full bg-white dark:bg-slate-800 text-right ${errors.income ? '!border-red-500 dark:!border-red-500 ring-1 ring-red-500/20' : 'border-blue-300 dark:border-blue-700'}`}>
                                <SelectValue placeholder="בחר הכנסה לחיוב" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="none">-- בחר מכירה --</SelectItem>
                                {availableIncomes.map((inc: any) => (
                                    <SelectItem key={inc.id} value={inc.id}>
                                        {inc.source} | {formatCurrency(inc.amount, inc.currency)} | {inc.date ? new Date(inc.date).toLocaleDateString('he-IL') : '-'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {availableIncomes.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1 mr-1">
                                * לא נמצאו הכנסות פתוחות (ללא חשבונית) לחודש זה / ללקוח זה.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Line Items Table */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    פירוט העסקה *
                </label>
                <div className={`border rounded-lg overflow-hidden dark:border-slate-700 ${errors.lineItems ? '!border-red-500 dark:!border-red-500 ring-1 ring-red-500/20' : ''}`}>
                    <table className="w-full text-right text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 font-medium">
                            <tr>
                                <th className="p-2 w-[40%]">תיאור</th>
                                <th className="p-2 w-[15%]">כמות</th>
                                <th className="p-2 w-[20%]">מחיר יח'</th>
                                <th className="p-2 w-[20%]">סה"כ</th>
                                <th className="p-2 w-[5%]"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {lineItems.map((item, index) => (
                                <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 rounded px-1"
                                            value={item.description}
                                            onChange={(e) => {
                                                const newItems = [...lineItems]
                                                newItems[index].description = e.target.value
                                                setLineItems(newItems)
                                            }}
                                            placeholder="תיאור הפריט"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 rounded px-1"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0
                                                const newItems = [...lineItems]
                                                newItems[index].quantity = val
                                                newItems[index].total = val * newItems[index].price
                                                setLineItems(newItems)
                                            }}
                                            onWheel={(e) => e.currentTarget.blur()}
                                        />
                                    </td>
                                    <td className="p-2">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 rounded px-1"
                                            value={item.price}
                                            onWheel={(e) => e.currentTarget.blur()}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) || 0
                                                const newItems = [...lineItems]
                                                newItems[index].price = val
                                                newItems[index].total = newItems[index].quantity * val
                                                setLineItems(newItems)
                                            }}
                                        />
                                    </td>
                                    <td className="p-2 font-bold">
                                        {formatCurrency(item.total)}
                                    </td>
                                    <td className="p-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}
                                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="p-2 bg-gray-50 dark:bg-slate-800/30 border-t dark:border-slate-700">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setLineItems([...lineItems, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0, total: 0 }])}
                        >
                            <Plus className="h-4 w-4 ml-1" />
                            הוסף שורה
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* REMOVED: Manual Subtotal Input */}
                {/* <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        סכום לפני מע"מ *
                    </label>
                    <FormattedNumberInput
                        required
                        min="0"
                        value={formData.subtotal.toString()}
                        onChange={(e) => setFormData({ ...formData, subtotal: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-100"
                    />
                </div> */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        שיעור מע"מ
                    </label>
                    <div dir="rtl">
                        <Select
                            value={(formData.vatRate ?? 0).toString()}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, vatRate: parseFloat(value) }))}
                        >
                            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-right">
                                <SelectValue placeholder='בחר מע"מ' />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="0">ללא מע"מ (0%)</SelectItem>
                                <SelectItem value="0.18">מע"מ רגיל (18%)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        אמצעי תשלום
                    </label>
                    <div dir="rtl">
                        <Select
                            value={formData.paymentMethod}
                            onValueChange={(value) => setFormData((prev) => ({ ...prev, paymentMethod: value }))}
                        >
                            <SelectTrigger className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-right">
                                <SelectValue placeholder="בחר אמצעי תשלום" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="BANK_TRANSFER">העברה בנקאית</SelectItem>
                                <SelectItem value="CREDIT_CARD">כרטיס אשראי</SelectItem>
                                <SelectItem value="BIT">ביט</SelectItem>
                                <SelectItem value="PAYBOX">פייבוקס</SelectItem>
                                <SelectItem value="CASH">מזומן</SelectItem>
                                <SelectItem value="CHECK">צ'ק</SelectItem>
                                <SelectItem value="OTHER">אחר</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md dark:bg-slate-800/50">
                <div className="flex justify-between text-sm mb-2">
                    <span className="dark:text-gray-300">סכום לפני מע"מ:</span>
                    <span className="dark:text-gray-100">₪{formData.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                    <span className="dark:text-gray-300">מע"מ ({(formData.vatRate || 0) * 100}%):</span>
                    <span className="dark:text-gray-100">₪{(formData.subtotal * (formData.vatRate || 0)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 dark:border-slate-700">
                    <span className="dark:text-gray-100">סה"כ לתשלום:</span>
                    <span className="text-purple-600">₪{total.toLocaleString()}</span>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    הערות
                </label>
                <RichTextEditor
                    value={formData.notes || ''}
                    onChange={(value) => setFormData({ ...formData, notes: value })}
                    placeholder="הוסף הערות לחשבונית..."
                />
            </div>

            <div className="flex gap-2 pt-2">
                <Button
                    type="submit"
                    className={`w-full md:w-auto transition-all ${(((!isGuestClient && !formData.clientId) || (isGuestClient && !guestClientName)) || !formData.invoiceNumber || lineItems.length === 0 || ((selectedIncomeId === 'none' || !selectedIncomeId) && !formData.createIncomeFromInvoice))
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400'
                        : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    disabled={((!isGuestClient && !formData.clientId) || (isGuestClient && !guestClientName)) || !formData.invoiceNumber || lineItems.length === 0 || ((selectedIncomeId === 'none' || !selectedIncomeId) && !formData.createIncomeFromInvoice)}
                >
                    צור חשבונית
                </Button>
            </div>
        </form>
    )
}
