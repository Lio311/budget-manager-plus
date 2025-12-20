'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2 } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'

interface Income {
    id: string
    source: string
    amount: number
    date: string
}

export function IncomeTab() {
    const { currency } = useBudget()
    const [incomes, setIncomes] = useState<Income[]>([
        { id: '1', source: 'משכורת', amount: 12000, date: '2025-12-01' },
        { id: '2', source: 'עבודה נוספת', amount: 3000, date: '2025-12-15' },
    ])

    const [newIncome, setNewIncome] = useState({ source: '', amount: '', date: '' })

    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0)

    const handleAdd = () => {
        if (newIncome.source && newIncome.amount) {
            setIncomes([
                ...incomes,
                {
                    id: Date.now().toString(),
                    source: newIncome.source,
                    amount: parseFloat(newIncome.amount),
                    date: newIncome.date || new Date().toISOString().split('T')[0],
                },
            ])
            setNewIncome({ source: '', amount: '', date: '' })
        }
    }

    const handleDelete = (id: string) => {
        setIncomes(incomes.filter((income) => income.id !== id))
    }

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-l from-green-50 to-white border-green-200">
                <CardHeader>
                    <CardTitle className="text-green-700">סך הכנסות חודשיות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold text-green-600">
                        {formatCurrency(totalIncome, currency)}
                    </div>
                </CardContent>
            </Card>

            {/* Add New Income */}
            <Card>
                <CardHeader>
                    <CardTitle>הוסף הכנסה חדשה</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Input
                            placeholder="מקור הכנסה (משכורת, עבודה נוספת...)"
                            value={newIncome.source}
                            onChange={(e) => setNewIncome({ ...newIncome, source: e.target.value })}
                        />
                        <Input
                            type="number"
                            placeholder="סכום"
                            value={newIncome.amount}
                            onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
                        />
                        <Input
                            type="date"
                            value={newIncome.date}
                            onChange={(e) => setNewIncome({ ...newIncome, date: e.target.value })}
                        />
                        <Button onClick={handleAdd} className="gap-2">
                            <Plus className="h-4 w-4" />
                            הוסף
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Incomes List */}
            <Card>
                <CardHeader>
                    <CardTitle>רשימת הכנסות</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {incomes.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">אין הכנסות רשומות לחודש זה</p>
                        ) : (
                            <div className="space-y-2">
                                {incomes.map((income) => (
                                    <div
                                        key={income.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">{income.source}</p>
                                            <p className="text-sm text-muted-foreground">{income.date}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-bold text-green-600">
                                                {formatCurrency(income.amount, currency)}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(income.id)}
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
