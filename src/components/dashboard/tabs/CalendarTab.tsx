'use client'

import useSWR, { mutate } from 'swr'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Calendar } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency, getDaysInMonth, getMonthName } from '@/lib/utils'
import { getBills } from '@/lib/actions/bill'
import { getDebts } from '@/lib/actions/debts'
import { getIncomes } from '@/lib/actions/income'
import { getExpenses } from '@/lib/actions/expense'
import { getSavings } from '@/lib/actions/savings'
import { toggleBillPaid } from '@/lib/actions/bill'
import { toggleDebtPaid } from '@/lib/actions/debts'
import { useToast } from '@/hooks/use-toast'

interface Payment {
    id: string
    name: string
    amount: number
    day: number
    type: 'bill' | 'debt' | 'income' | 'expense' | 'saving'
    isPaid: boolean
}

export function CalendarTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()

    // Fetchers
    const fetchBills = async () => (await getBills(month, year)).data || []
    const fetchDebts = async () => (await getDebts(month, year)).data || []
    const fetchIncomes = async () => (await getIncomes(month, year)).data || []
    const fetchExpenses = async () => (await getExpenses(month, year)).data || []
    const fetchSavings = async () => (await getSavings(month, year)).data || []

    // SWR Hooks
    const { data: bills = [], isLoading: loadingBills, mutate: mutateBills } = useSWR(['bills', month, year], fetchBills)
    const { data: debts = [], isLoading: loadingDebts, mutate: mutateDebts } = useSWR(['debts', month, year], fetchDebts)
    const { data: incomes = [], isLoading: loadingIncomes } = useSWR(['incomes', month, year], fetchIncomes)
    const { data: expenses = [], isLoading: loadingExpenses } = useSWR(['expenses', month, year], fetchExpenses)
    const { data: savings = [], isLoading: loadingSavings } = useSWR(['savings', month, year], fetchSavings)

    const loading = loadingBills || loadingDebts || loadingIncomes || loadingExpenses || loadingSavings

    // Aggregate Payments
    const payments: Payment[] = [
        ...bills.map((bill: any) => ({
            id: bill.id,
            name: bill.name,
            amount: bill.amount,
            day: bill.dueDay,
            type: 'bill' as const,
            isPaid: bill.isPaid
        })),
        ...debts.map((debt: any) => ({
            id: debt.id,
            name: debt.creditor,
            amount: debt.monthlyPayment,
            day: debt.dueDay,
            type: 'debt' as const,
            isPaid: debt.isPaid
        })),
        ...incomes.map((income: any) => ({
            id: income.id,
            name: income.source,
            amount: income.amount,
            day: income.date ? new Date(income.date).getDate() : 1,
            type: 'income' as const,
            isPaid: true
        })),
        ...expenses.map((expense: any) => ({
            id: expense.id,
            name: expense.description,
            amount: expense.amount,
            day: expense.date ? new Date(expense.date).getDate() : 1,
            type: 'expense' as const,
            isPaid: true
        })),
        ...savings.map((saving: any) => ({
            id: saving.id,
            name: saving.description,
            amount: saving.monthlyDeposit,
            day: saving.date ? new Date(saving.date).getDate() : 1,
            type: 'saving' as const,
            isPaid: true
        }))
    ]

    const togglePaid = async (payment: Payment) => {
        const result = payment.type === 'bill'
            ? await toggleBillPaid(payment.id, !payment.isPaid)
            : await toggleDebtPaid(payment.id, !payment.isPaid)

        if (result.success) {
            if (payment.type === 'bill') {
                mutateBills()
            } else {
                mutateDebts()
            }
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן סטטוס',
                variant: 'destructive'
            })
        }
    }

    const daysInMonth = getDaysInMonth(month, year)
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

    const getPaymentsForDay = (day: number) => {
        return payments.filter(p => p.day === day)
    }

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
    const paidPayments = payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0)

    // Create calendar grid
    const calendarDays = []
    // Add empty cells for days before month starts
    for (let i = 0; i < (6 - firstDayOfMonth); i++) {
        calendarDays.push(null)
    }
    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day)
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-gradient-to-l from-blue-50 to-white border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-700">סך תשלומים החודש</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            {formatCurrency(totalPayments, currency)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {payments.length} תשלומים מתוכננים
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-l from-green-50 to-white border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-700">שולם עד כה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {formatCurrency(paidPayments, currency)}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                            {payments.filter(p => p.isPaid).length} מתוך {payments.length} תשלומים
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <CardTitle>לוח שנה - {getMonthName(month)} {year}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].reverse().map((day) => (
                            <div key={day} className="text-center font-bold text-sm text-muted-foreground p-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, index) => {
                            const dayPayments = day ? getPaymentsForDay(day) : []
                            const hasPayments = dayPayments.length > 0
                            const allPaid = dayPayments.length > 0 && dayPayments.every(p => p.isPaid)

                            return (
                                <div
                                    key={index}
                                    className={`min-h-[80px] p-2 border rounded-lg ${day === null
                                        ? 'bg-gray-50'
                                        : hasPayments
                                            ? allPaid
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
                                            : 'hover:bg-accent'
                                        } transition-colors`}
                                >
                                    {day && (
                                        <>
                                            <div className="font-semibold text-sm mb-1">{day}</div>
                                            {hasPayments && (
                                                <div className="space-y-1">
                                                    {dayPayments.map((payment) => (
                                                        <div
                                                            key={payment.id}
                                                            className={`text-[10px] md:text-xs p-1 rounded truncate ${payment.type === 'bill'
                                                                ? 'bg-yellow-200 text-yellow-800'
                                                                : payment.type === 'debt'
                                                                    ? 'bg-purple-200 text-purple-800'
                                                                    : payment.type === 'income'
                                                                        ? 'bg-green-200 text-green-800'
                                                                        : payment.type === 'saving'
                                                                            ? 'bg-blue-200 text-blue-800'
                                                                            : 'bg-red-200 text-red-800'
                                                                } ${payment.isPaid ? 'opacity-50 line-through' : ''}`}
                                                            title={payment.name}
                                                        >
                                                            {payment.name}
                                                        </div>
                                                    ))}
                                                    <div className="text-xs font-bold text-center mt-1">
                                                        {dayPayments.length} תשלומים
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Payments List */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת תשלומים לחודש</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {payments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">אין תשלומים מתוכננים</p>
                        ) : (
                            <div className="space-y-2">
                                {payments
                                    .sort((a, b) => a.day - b.day)
                                    .map((payment) => (
                                        <div
                                            key={payment.id}
                                            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${payment.isPaid ? 'bg-green-50 border-green-200' : 'hover:bg-accent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4 flex-1">
                                                <button
                                                    onClick={() => togglePaid(payment)}
                                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${payment.isPaid
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-gray-300 hover:border-green-500'
                                                        }`}
                                                >
                                                    {payment.isPaid && <Check className="h-4 w-4 text-white" />}
                                                </button>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-medium ${payment.isPaid ? 'line-through text-muted-foreground' : ''}`}>
                                                            {payment.name}
                                                        </p>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${payment.type === 'bill'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : payment.type === 'debt'
                                                                ? 'bg-purple-100 text-purple-700'
                                                                : payment.type === 'income'
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : payment.type === 'saving'
                                                                        ? 'bg-blue-100 text-blue-700'
                                                                        : 'bg-red-100 text-red-700'
                                                            }`}>
                                                            {payment.type === 'bill' ? 'חשבון' : payment.type === 'debt' ? 'חוב' : payment.type === 'income' ? 'הכנסה' : payment.type === 'saving' ? 'חיסכון' : 'הוצאה'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        תאריך: {payment.day}/{month}/{year}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`text-lg font-bold ${payment.isPaid
                                                    ? 'text-green-600'
                                                    : payment.type === 'bill'
                                                        ? 'text-yellow-600'
                                                        : payment.type === 'debt'
                                                            ? 'text-purple-600'
                                                            : payment.type === 'income'
                                                                ? 'text-green-600'
                                                                : payment.type === 'saving'
                                                                    ? 'text-blue-600'
                                                                    : 'text-red-600'
                                                    }`}>
                                                    {formatCurrency(payment.amount, currency)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
