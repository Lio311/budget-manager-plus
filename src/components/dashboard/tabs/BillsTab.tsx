'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Check } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'

interface Bill {
    id: string
    name: string
    amount: number
    dueDay: number
    isPaid: boolean
}

export function BillsTab() {
    const { currency } = useBudget()
    const [bills, setBills] = useState<Bill[]>([
        { id: '1', name: 'חשמל', amount: 450, dueDay: 10, isPaid: false },
        { id: '2', name: 'ארנונה', amount: 800, dueDay: 15, isPaid: true },
        { id: '3', name: 'נטפליקס', amount: 55, dueDay: 5, isPaid: false },
        { id: '4', name: 'אינטרנט', amount: 120, dueDay: 1, isPaid: false },
    ])

    const [newBill, setNewBill] = useState({ name: '', amount: '', dueDay: '' })

    const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0)
    const paidBills = bills.filter(b => b.isPaid).reduce((sum, bill) => sum + bill.amount, 0)
    const unpaidBills = totalBills - paidBills

    const handleAdd = () => {
        if (newBill.name && newBill.amount && newBill.dueDay) {
            setBills([
                ...bills,
                {
                    id: Date.now().toString(),
                    name: newBill.name,
                    amount: parseFloat(newBill.amount),
                    dueDay: parseInt(newBill.dueDay),
                    isPaid: false,
                },
            ])
            setNewBill({ name: '', amount: '', dueDay: '' })
        }
    }

    const handleDelete = (id: string) => {
        setBills(bills.filter((bill) => bill.id !== id))
    }

    const togglePaid = (id: string) => {
        setBills(bills.map(bill =>
            bill.id === id ? { ...bill, isPaid: !bill.isPaid } : bill
        ))
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-gradient-to-l from-yellow-50 to-white border-yellow-200">
                    <CardHeader>
                        <CardTitle className="text-yellow-700">סך חשבונות</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-yellow-600">
                            {formatCurrency(totalBills, currency)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-l from-green-50 to-white border-green-200">
                    <CardHeader>
                        <CardTitle className="text-green-700">שולם</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                            {formatCurrency(paidBills, currency)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-l from-red-50 to-white border-red-200">
                    <CardHeader>
                        <CardTitle className="text-red-700">ממתין לתשלום</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">
                            {formatCurrency(unpaidBills, currency)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add New Bill */}
            <Card>
                <CardHeader>
                    <CardTitle>הוסף חשבון קבוע</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Input
                            placeholder="שם החשבון (חשמל, ארנונה...)"
                            value={newBill.name}
                            onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder="סכום"
                            value={newBill.amount}
                            onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder="יום תשלום (1-31)"
                            min="1"
                            max="31"
                            value={newBill.dueDay}
                            onChange={(e) => setNewBill({ ...newBill, dueDay: e.target.value })}
                        />
                        <Button onClick={handleAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            הוסף
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Bills List */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת חשבונות קבועים</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {bills.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">אין חשבונות רשומים</p>
                        ) : (
                            <div className="space-y-2">
                                {bills.map((bill) => (
                                    <div
                                        key={bill.id}
                                        className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${bill.isPaid ? 'bg-green-50 border-green-200' : 'hover:bg-accent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <button
                                                onClick={() => togglePaid(bill.id)}
                                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${bill.isPaid
                                                        ? 'bg-green-500 border-green-500'
                                                        : 'border-gray-300 hover:border-green-500'
                                                    }`}
                                            >
                                                {bill.isPaid && <Check className="h-4 w-4 text-white" />}
                                            </button>
                                            <div className="flex-1">
                                                <p className={`font-medium ${bill.isPaid ? 'line-through text-muted-foreground' : ''}`}>
                                                    {bill.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    תאריך תשלום: {bill.dueDay} בחודש
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-lg font-bold ${bill.isPaid ? 'text-green-600' : 'text-yellow-600'}`}>
                                                {formatCurrency(bill.amount, currency)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(bill.id)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
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
