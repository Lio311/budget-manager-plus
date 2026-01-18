'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrendingDown, TrendingUp, PiggyBank, CreditCard, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Payment {
    id: string
    name: string
    amount: number
    currency: string
    day: number
    type: 'bill' | 'debt' | 'income' | 'expense' | 'saving'
    isPaid: boolean
}

interface QuickAddDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDay: number | null
    isBusiness: boolean
    payments?: Payment[]
    onTogglePaid?: (payment: Payment) => void
    onSelectAction: (action: 'expense' | 'income' | 'saving' | 'debt' | 'bill') => void
}

export function QuickAddDialog({ open, onOpenChange, selectedDay, isBusiness, payments = [], onTogglePaid, onSelectAction }: QuickAddDialogProps) {
    const actions = [
        {
            type: 'expense' as const,
            label: 'הוצאה',
            icon: TrendingDown,
            color: 'from-red-500 to-red-600',
            hoverColor: 'hover:from-red-600 hover:to-red-700',
            bgColor: 'bg-red-50 dark:bg-red-950/30',
            textColor: 'text-red-600 dark:text-red-400',
            show: true
        },
        {
            type: 'income' as const,
            label: isBusiness ? 'מכירה' : 'הכנסה',
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
            hoverColor: 'hover:from-green-600 hover:to-green-700',
            bgColor: 'bg-green-50 dark:bg-green-950/30',
            textColor: 'text-green-600 dark:text-green-400',
            show: true
        },
        {
            type: 'saving' as const,
            label: 'חיסכון',
            icon: PiggyBank,
            color: 'from-blue-500 to-blue-600',
            hoverColor: 'hover:from-blue-600 hover:to-blue-700',
            bgColor: 'bg-blue-50 dark:bg-blue-950/30',
            textColor: 'text-blue-600 dark:text-blue-400',
            show: !isBusiness // Only show for personal
        },
        {
            type: 'debt' as const,
            label: 'הלוואה',
            icon: CreditCard,
            color: 'from-purple-500 to-purple-600',
            hoverColor: 'hover:from-purple-600 hover:to-purple-700',
            bgColor: 'bg-purple-50 dark:bg-purple-950/30',
            textColor: 'text-purple-600 dark:text-purple-400',
            show: !isBusiness // Only show for personal
        },
        {
            type: 'bill' as const,
            label: 'חשבון קבוע',
            icon: Receipt,
            color: 'from-orange-500 to-orange-600',
            hoverColor: 'hover:from-orange-600 hover:to-orange-700',
            bgColor: 'bg-orange-50 dark:bg-orange-950/30',
            textColor: 'text-orange-600 dark:text-orange-400',
            show: !isBusiness // Only show for personal
        }
    ].filter(action => action.show)

    const categoryLabels: Record<Payment['type'], { label: string, color: string }> = {
        'income': { label: 'הכנסה', color: 'bg-green-100 text-green-800 border-green-200' },
        'expense': { label: 'הוצאה', color: 'bg-red-100 text-red-800 border-red-200' },
        'saving': { label: 'חיסכון', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        'bill': { label: 'חשבון קבוע', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        'debt': { label: 'הלוואה', color: 'bg-purple-100 text-purple-800 border-purple-200' }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right text-xl">
                        {payments.length > 0 ? `יום ${selectedDay}` : `הוסף פריט ליום ${selectedDay}`}
                    </DialogTitle>
                </DialogHeader>

                {/* Existing Payments */}
                {payments.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">תשלומים קיימים:</h3>
                        {payments.map((payment) => {
                            const category = categoryLabels[payment.type]
                            return (
                                <div key={payment.id} className={`p-3 rounded-lg border-r-4 ${payment.isPaid ? 'opacity-60 bg-gray-50 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-800 shadow-sm'} border-gray-200 dark:border-slate-700`}>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-sm">{payment.name}</p>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${category.color}`}>
                                                    {category.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">{formatCurrency(payment.amount, payment.currency)}</p>
                                        </div>
                                        {(!payment.isPaid && (payment.type === 'bill' || payment.type === 'debt') && onTogglePaid) && (
                                            <Button size="sm" onClick={() => onTogglePaid(payment)}>סמן כשולם</Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3">הוסף פריט חדש:</h3>
                        </div>
                    </div>
                )}

                {/* Quick Add Actions */}
                <div className="grid grid-cols-2 gap-3">
                    {actions.map((action) => {
                        const Icon = action.icon
                        return (
                            <button
                                key={action.type}
                                onClick={() => {
                                    onSelectAction(action.type)
                                }}
                                className={`group relative p-6 rounded-xl border-2 border-transparent transition-all duration-200 ${action.bgColor} hover:border-current ${action.textColor} hover:shadow-lg`}
                            >
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${action.color} ${action.hoverColor} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                                        <Icon className="text-white" size={24} />
                                    </div>
                                    <span className="font-bold text-sm">{action.label}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {payments.length === 0 && (
                    <p className="text-xs text-gray-500 text-center mt-4">
                        בחר את סוג הפריט שברצונך להוסיף
                    </p>
                )}
            </DialogContent>
        </Dialog>
    )
}
