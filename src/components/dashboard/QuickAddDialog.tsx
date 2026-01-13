'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TrendingDown, TrendingUp, PiggyBank, CreditCard, Receipt } from 'lucide-react'

interface QuickAddDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedDay: number | null
    isBusiness: boolean
    onSelectAction: (action: 'expense' | 'income' | 'saving' | 'debt' | 'bill') => void
}

export function QuickAddDialog({ open, onOpenChange, selectedDay, isBusiness, onSelectAction }: QuickAddDialogProps) {
    const actions = [
        {
            type: 'expense' as const,
            label: 'הוצאה',
            icon: TrendingDown,
            color: 'from-red-500 to-red-600',
            hoverColor: 'hover:from-red-600 hover:to-red-700',
            bgColor: 'bg-red-50',
            textColor: 'text-red-600',
            show: true
        },
        {
            type: 'income' as const,
            label: isBusiness ? 'מכירה' : 'הכנסה',
            icon: TrendingUp,
            color: 'from-green-500 to-green-600',
            hoverColor: 'hover:from-green-600 hover:to-green-700',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600',
            show: true
        },
        {
            type: 'saving' as const,
            label: 'חיסכון',
            icon: PiggyBank,
            color: 'from-blue-500 to-blue-600',
            hoverColor: 'hover:from-blue-600 hover:to-blue-700',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            show: true
        },
        {
            type: 'debt' as const,
            label: 'הלוואה',
            icon: CreditCard,
            color: 'from-purple-500 to-purple-600',
            hoverColor: 'hover:from-purple-600 hover:to-purple-700',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            show: true
        },
        {
            type: 'bill' as const,
            label: 'חשבון קבוע',
            icon: Receipt,
            color: 'from-orange-500 to-orange-600',
            hoverColor: 'hover:from-orange-600 hover:to-orange-700',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600',
            show: !isBusiness // Only show for personal
        }
    ].filter(action => action.show)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right text-xl">
                        הוסף פריט ליום {selectedDay}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    {actions.map((action) => {
                        const Icon = action.icon
                        return (
                            <button
                                key={action.type}
                                onClick={() => {
                                    onSelectAction(action.type)
                                    onOpenChange(false)
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

                <p className="text-xs text-gray-500 text-center mt-4">
                    בחר את סוג הפריט שברצונך להוסיף
                </p>
            </DialogContent>
        </Dialog>
    )
}
