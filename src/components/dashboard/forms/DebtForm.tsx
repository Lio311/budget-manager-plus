'use client'

import { useState } from 'react'
import { useSWRConfig } from 'swr'
import { Loader2, Plus, Wallet } from 'lucide-react'
import { format } from 'date-fns'

import { useBudget } from '@/contexts/BudgetContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/utils'
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '@/lib/currency'
import { PaymentMethodSelector } from '@/components/dashboard/PaymentMethodSelector'
import { addDebt } from '@/lib/actions/debts'
import { DEBT_TYPES } from '@/lib/constants/debt-types'
import { DatePicker } from '@/components/ui/date-picker'

interface DebtFormProps {
    isMobile?: boolean
    onSuccess?: () => void
}

export function DebtForm({ isMobile, onSuccess }: DebtFormProps) {
    const { month, year, currency: budgetCurrency, budgetType } = useBudget()
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0)
    const { toast } = useToast()
    const { mutate: globalMutate } = useSWRConfig()

    const [submitting, setSubmitting] = useState(false)
    const [newDebt, setNewDebt] = useState<{
        creditor: string
        debtType: string
        totalAmount: string
        currency: string
        date: string // Changed from dueDay
        isRecurring: boolean
        numberOfInstallments: string
        paymentMethod: string
    }>({
        creditor: '',
        debtType: DEBT_TYPES.OWED_BY_ME,
        totalAmount: '',
        currency: 'ILS',
        date: '', // Changed from dueDay
        isRecurring: false,
        numberOfInstallments: '',
        paymentMethod: ''
    })

    const handleAdd = async () => {
        // Validate required fields
        if (!newDebt.creditor || !newDebt.creditor.trim()) {
            toast({ title: 'שגיאה', description: 'יש למלא שם מלווה', variant: 'destructive' })
            return
        }

        if (!newDebt.totalAmount || parseFloat(newDebt.totalAmount) <= 0) {
            toast({ title: 'שגיאה', description: 'יש למלא סכום כולל תקין', variant: 'destructive' })
            return
        }

        if (!newDebt.date) { // New validation for date
            toast({ title: 'שגיאה', description: 'יש לבחור תאריך הלוואה', variant: 'destructive' })
            return
        }

        if (newDebt.isRecurring) {
            if (!newDebt.numberOfInstallments || parseInt(newDebt.numberOfInstallments) < 1) {
                toast({ title: 'שגיאה', description: 'מספר תשלומים חייב להיות לפחות 1', variant: 'destructive' })
                return
            }
        }

        setSubmitting(true)
        try {
            const totalAmount = parseFloat(newDebt.totalAmount)
            const monthlyPayment = newDebt.isRecurring
                ? totalAmount / parseInt(newDebt.numberOfInstallments)
                : totalAmount

            const debtDate = new Date(newDebt.date) // Parse the date string
            const dueDay = debtDate.getDate() // Extract day from the date

            const result = await addDebt(month, year, {
                creditor: newDebt.creditor.trim(),
                debtType: newDebt.debtType,
                totalAmount,
                currency: newDebt.currency,
                monthlyPayment,
                dueDay, // Use the extracted day
                isRecurring: newDebt.isRecurring,
                totalDebtAmount: newDebt.isRecurring ? totalAmount : undefined,
                numberOfInstallments: newDebt.isRecurring ? parseInt(newDebt.numberOfInstallments) : undefined,
                paymentMethod: newDebt.paymentMethod || undefined
            }, budgetType)

            if (result.success) {
                setNewDebt({
                    creditor: '',
                    debtType: DEBT_TYPES.OWED_BY_ME,
                    totalAmount: '',
                    currency: 'ILS',
                    date: '', // Reset date
                    isRecurring: false,
                    numberOfInstallments: '',
                    paymentMethod: ''
                })

                globalMutate(['debts', month, year, budgetType])
                globalMutate(key => Array.isArray(key) && key[0] === 'overview')

                toast({
                    title: 'הצלחה',
                    description: newDebt.isRecurring ? `נוצרו ${newDebt.numberOfInstallments} תשלומים בהצלחה` : 'ההלוואה נוספה בהצלחה'
                })

                if (onSuccess) onSuccess()
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף הלוואה', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add debt failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בלתי צפויה', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <Wallet className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-bold text-[#323338] dark:text-gray-100">הוספת הלוואה</h3>
            </div>

            <div className="flex flex-col gap-4">
                {/* Creditor Name - Full Width */}
                <div className="w-full">
                    <label className="text-xs font-medium mb-1.5 block text-[#676879] dark:text-gray-300">שם המלווה / לווה</label>
                    <Input
                        placeholder="שם..."
                        className="h-10 border-gray-200 focus:ring-purple-500/20 focus:border-purple-500"
                        value={newDebt.creditor}
                        onChange={(e) => setNewDebt({ ...newDebt, creditor: e.target.value })}
                        disabled={submitting}
                    />
                </div>

                {/* Currency, Amount, Due Day - 2 columns on desktop */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    <div>
                        <label className="text-xs font-medium mb-1.5 block text-[#676879] dark:text-gray-300">מטבע</label>
                        <select
                            className="w-full p-2.5 border border-gray-200 dark:border-slate-700 rounded-lg h-10 bg-white dark:bg-slate-800 dark:text-gray-100 text-sm outline-none"
                            value={newDebt.currency}
                            onChange={(e) => setNewDebt({ ...newDebt, currency: e.target.value })}
                            disabled={submitting}
                        >
                            {Object.entries(SUPPORTED_CURRENCIES).map(([code, symbol]) => (
                                <option key={code} value={code}>{code}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1.5 block text-[#676879] dark:text-gray-300">סכום כולל</label>
                        <FormattedNumberInput
                            placeholder="סכום כולל"
                            className="h-10 border-gray-200 focus:ring-purple-500/20 focus:border-purple-500"
                            value={newDebt.totalAmount}
                            onChange={(e) => setNewDebt({ ...newDebt, totalAmount: e.target.value })}
                            disabled={submitting}
                            dir="ltr"
                        />
                    </div>
                </div>

                {/* Due Day - Full Width */}
                <div className="w-full">
                    <label className="text-xs font-bold mb-1.5 block text-[#676879] dark:text-gray-300">תאריך הלוואה</label>
                    <DatePicker
                        date={newDebt.date ? new Date(newDebt.date) : undefined}
                        setDate={(date) => setNewDebt({ ...newDebt, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                        fromDate={startOfMonth}
                        toDate={endOfMonth}
                    />
                </div>

                {/* Payment Method - Full Width */}
                <div className="w-full">
                    <PaymentMethodSelector
                        value={newDebt.paymentMethod}
                        onChange={(val) => setNewDebt({ ...newDebt, paymentMethod: val })}
                    />
                </div>

                <div className="flex flex-col gap-4"> {/* Container for Checkbox and Button */}
                    <div className="flex items-center gap-2 h-10 bg-gray-50 dark:bg-slate-800/50 px-3 rounded-lg border border-gray-100 dark:border-slate-700 w-full sm:w-auto self-start">
                        <Checkbox
                            id="recurring-debt"
                            checked={newDebt.isRecurring}
                            onCheckedChange={(checked) => setNewDebt({ ...newDebt, isRecurring: checked as boolean })}
                            className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <label htmlFor="recurring-debt" className="text-sm font-medium cursor-pointer select-none text-[#323338] dark:text-gray-100">
                            תשלומים
                        </label>
                    </div>

                    {newDebt.isRecurring && (
                        <div className="p-4 pt-0 border-t border-gray-100 dark:border-slate-700 mt-2 grid gap-6 grid-cols-1 sm:grid-cols-2 animate-in slide-in-from-top-2 duration-200">
                            <div className="space-y-1.5 mt-2">
                                <label className="text-xs text-[#676879] dark:text-gray-300">מספר תשלומים</label>
                                <Input
                                    type="number"
                                    placeholder="12"
                                    min="1"
                                    className="h-10 w-24 border-gray-200 focus:ring-purple-500/20 focus:border-purple-500"
                                    value={newDebt.numberOfInstallments}
                                    onChange={(e) => setNewDebt({ ...newDebt, numberOfInstallments: e.target.value })}
                                    disabled={submitting}
                                    dir="ltr"
                                />
                            </div>
                            {newDebt.totalAmount && newDebt.numberOfInstallments && parseInt(newDebt.numberOfInstallments) > 0 && (
                                <div className="space-y-1.5 mt-2">
                                    <label className="text-xs text-[#676879] dark:text-gray-300">תשלום חודשי משוער</label>
                                    <div className="h-10 px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-sm flex items-center w-full font-medium text-[#323338] dark:text-gray-100">
                                        {formatCurrency(
                                            parseFloat(newDebt.totalAmount) / parseInt(newDebt.numberOfInstallments),
                                            getCurrencySymbol(newDebt.currency)
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <Button
                        onClick={handleAdd}
                        className="w-full h-10 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-sm transition-all hover:shadow-md"
                        disabled={submitting}
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-rainbow-spin" /> : 'הוסף'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
