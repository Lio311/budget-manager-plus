'use client'

import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, Calendar, DollarSign, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { deleteMarketingExpense } from '@/lib/actions/marketing'
import { toast } from 'sonner'
import { useState } from 'react'

export function MarketingExpensesTable({ expenses }: { expenses: any[] }) {
    const [localExpenses, setLocalExpenses] = useState(expenses)

    const handleDelete = async (id: string) => {
        if (confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) {
            // Optimistic update
            setLocalExpenses(prev => prev.filter(e => e.id !== id))
            const res = await deleteMarketingExpense(id)
            if (res.success) {
                toast.success('הוצאה נמחקה בהצלחה')
            } else {
                toast.error('שגיאה במחיקת ההוצאה')
                // Revert
                setLocalExpenses(expenses)
            }
        }
    }

    return (
        <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">הוצאות שיווק ואתר</h3>
                    <p className="text-xs text-gray-500">מעקב אחר הוצאות שוטפות של האתר והקמפיינים</p>
                </div>
                {/* 
                  Future: Add "New Expense" button here if we want manual expenses 
                  that aren't tied to campaigns creation dialog 
                */}
            </div>

            <div className="overflow-x-auto">
                <Table dir="rtl">
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="text-right font-bold w-[130px]">תאריך</TableHead>
                            <TableHead className="text-right font-bold">תיאור</TableHead>
                            <TableHead className="text-right font-bold">קטגוריה</TableHead>
                            <TableHead className="text-right font-bold">קמפיין מקושר</TableHead>
                            <TableHead className="text-right font-bold">סכום</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {localExpenses.length > 0 ? (
                            localExpenses.map((expense) => (
                                <TableRow key={expense.id} className="hover:bg-gray-50/50">
                                    <TableCell className="font-medium text-gray-600">
                                        {format(new Date(expense.date), 'dd/MM/yyyy', { locale: he })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-gray-800">{expense.title}</span>
                                            {expense.notes && <span className="text-xs text-gray-400 truncate max-w-[200px]">{expense.notes}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="font-normal bg-white">
                                            {expense.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {expense.marketingCampaign ? (
                                            <Badge variant="secondary" className="bg-pink-50 text-pink-700 hover:bg-pink-100 border-pink-100">
                                                {expense.marketingCampaign.name}
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-900">
                                        {expense.amount.toLocaleString()} ₪
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => handleDelete(expense.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                    אין הוצאות להצגה
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </Card>
    )
}
