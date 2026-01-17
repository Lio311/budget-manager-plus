'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from 'date-fns'
import { Check, X, Loader2, Edit2, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from 'sonner'
import { getSupplierSubscriptionExpenses, updateExpenseStatus, deleteSubscriptionExpense, updateSubscriptionExpense } from '@/lib/actions/suppliers'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { useConfirm } from '@/hooks/useConfirm'

interface SupplierSubscriptionHistoryDialogProps {
    isOpen: boolean
    onClose: () => void
    supplier: any
    onUpdate?: () => void
}

const SUBSCRIPTION_TYPES_HE: Record<string, string> = {
    'WEEKLY': 'שבועי',
    'MONTHLY': 'חודשי',
    'YEARLY': 'שנתי',
    'PROJECT': 'פרויקט'
}

export function SupplierSubscriptionHistoryDialog({ isOpen, onClose, supplier, onUpdate }: SupplierSubscriptionHistoryDialogProps) {
    const [expenses, setExpenses] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [editingExpense, setEditingExpense] = useState<any>(null)
    const confirm = useConfirm()

    useEffect(() => {
        if (isOpen && supplier) {
            fetchHistory()
        }
    }, [isOpen, supplier])

    const fetchHistory = async () => {
        setIsLoading(true)
        try {
            const result = await getSupplierSubscriptionExpenses(supplier.id)
            if (result.success) {
                setExpenses(result.data || [])
            } else {
                toast.error('שגיאה בטעינת היסטוריית תשלומים')
            }
        } catch (error) {
            console.error(error)
            toast.error('שגיאה בטעינת היסטוריית תשלומים')
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatusChange = async (expenseId: string, newStatus: string) => {
        setUpdatingId(expenseId)
        try {
            const result = await updateExpenseStatus(expenseId, newStatus)
            if (result.success) {
                toast.success('סטטוס עודכן בהצלחה')
                setExpenses(prev => prev.map(exp =>
                    exp.id === expenseId ? { ...exp, status: newStatus } : exp
                ))
                onUpdate?.()
            } else {
                toast.error('שגיאה בעדכון סטטוס')
            }
        } catch (error) {
            toast.error('שגיאה בעדכון סטטוס')
        } finally {
            setUpdatingId(null)
        }
    }

    const handleDelete = async (id: string) => {
        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק תשלום זה?', 'מחיקת תשלום')
        if (!confirmed) return

        try {
            const result = await deleteSubscriptionExpense(id)
            if (result.success) {
                toast.success('תשלום נמחק בהצלחה')
                setExpenses(prev => prev.filter(exp => exp.id !== id))
                onUpdate?.()
            } else {
                toast.error('שגיאה במחיקת תשלום')
            }
        } catch (error) {
            toast.error('שגיאה במחיקת תשלום')
        }
    }

    const handleSaveEdit = async (expense: any) => {
        try {
            const result = await updateSubscriptionExpense(expense.id, {
                date: new Date(expense.date),
                amount: expense.amount
            })

            if (result.success) {
                toast.success('תשלום עודכן בהצלחה')
                setExpenses(prev => prev.map(exp =>
                    exp.id === expense.id
                        ? { ...exp, date: expense.date, amount: expense.amount }
                        : exp
                ))
                setEditingExpense(null)
                onUpdate?.()
            } else {
                toast.error('שגיאה בעדכון תשלום')
            }
        } catch (error) {
            toast.error('שגיאה בעדכון תשלום')
        }
    }

    if (!supplier) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>היסטוריית תשלומי מנוי - {supplier.name}</DialogTitle>
                    <DialogDescription>
                        ניהול תשלומי מנוי ({SUBSCRIPTION_TYPES_HE[supplier.subscriptionType] || supplier.subscriptionType} - {formatCurrency(supplier.subscriptionPrice)})
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-6" dir="rtl">
                        {(() => {
                            const now = new Date()
                            now.setHours(0, 0, 0, 0)

                            // Sort oldest to newest
                            const sortedExpenses = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                            const pastExpenses = sortedExpenses.filter(exp => new Date(exp.date) < now)
                            const futureExpenses = sortedExpenses.filter(exp => new Date(exp.date) >= now)

                            return (
                                <>
                                    {/* Past Payments - Accordion */}
                                    {pastExpenses.length > 0 && (
                                        <PastPaymentsAccordion
                                            expenses={pastExpenses}
                                            onStatusChange={handleStatusChange}
                                            onEdit={setEditingExpense}
                                            onDelete={handleDelete}
                                            updatingId={updatingId}
                                        />
                                    )}

                                    {/* Future Payments Table */}
                                    <div className="bg-white dark:bg-slate-900 rounded-md border overflow-hidden">
                                        <div className="bg-gray-50/50 p-3 border-b">
                                            <h3 className="font-medium text-sm text-gray-700">תשלומים עתידיים</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <Table dir="rtl" className="min-w-[600px] sm:min-w-full">
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableHead className="text-right h-12">תאריך</TableHead>
                                                        <TableHead className="text-right h-12">סכום</TableHead>
                                                        <TableHead className="text-right h-12 w-[200px]">סטטוס</TableHead>
                                                        <TableHead className="text-right h-12">פעולות</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {futureExpenses.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                                                אין תשלומים עתידיים
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        futureExpenses.map((expense) => (
                                                            <ExpenseRow
                                                                key={expense.id}
                                                                expense={expense}
                                                                onStatusChange={handleStatusChange}
                                                                onEdit={setEditingExpense}
                                                                onDelete={handleDelete}
                                                                updatingId={updatingId}
                                                            />
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                </>
                            )
                        })()}
                    </div>
                )}

                {/* Edit Dialog */}
                {editingExpense && (
                    <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>עריכת תשלום</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>תאריך</Label>
                                    <DatePicker
                                        date={new Date(editingExpense.date)}
                                        setDate={(date) => date && setEditingExpense({ ...editingExpense, date: date.toISOString() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>סכום</Label>
                                    <Input
                                        type="number"
                                        value={editingExpense.amount}
                                        onWheel={(e) => e.currentTarget.blur()}
                                        onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setEditingExpense(null)}>ביטול</Button>
                                    <Button onClick={() => handleSaveEdit(editingExpense)}>שמור שינויים</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

            </DialogContent >
        </Dialog >
    )
}

function PastPaymentsAccordion({ expenses, onStatusChange, onEdit, onDelete, updatingId }: any) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border rounded-md bg-gray-50/50 dark:bg-slate-900/50 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">תשלומים קודמים</span>
                    <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">{expenses.length}</Badge>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
            </button>

            {isOpen && (
                <div className="border-t bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-200">
                    <div className="overflow-x-auto">
                        <Table dir="rtl" className="min-w-[600px] sm:min-w-full">
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-right h-10 text-xs">תאריך</TableHead>
                                    <TableHead className="text-right h-10 text-xs">סכום</TableHead>
                                    <TableHead className="text-right h-10 text-xs w-[200px]">סטטוס</TableHead>
                                    <TableHead className="text-right h-10 text-xs">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {expenses.map((expense: any) => (
                                    <ExpenseRow
                                        key={expense.id}
                                        expense={expense}
                                        onStatusChange={onStatusChange}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        updatingId={updatingId}
                                        isPast={true}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}

function ExpenseRow({ expense, onStatusChange, onEdit, onDelete, updatingId, isPast }: any) {
    return (
        <TableRow className={isPast ? "opacity-75 hover:opacity-100 transition-opacity" : ""}>
            <TableCell className="font-medium whitespace-nowrap py-4">
                {format(new Date(expense.date), 'dd/MM/yyyy')}
            </TableCell>
            <TableCell className="whitespace-nowrap py-4 text-base">
                {formatCurrency(expense.amount)}
            </TableCell>
            <TableCell className="py-2">
                <Select
                    value={expense.status}
                    onValueChange={(val) => onStatusChange(expense.id, val)}
                    disabled={updatingId === expense.id}
                >
                    <SelectTrigger className={`w-[130px] h-9 ${expense.status === 'PAID' ? 'text-green-600 border-green-200 bg-green-50' :
                        expense.status === 'PENDING' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                            expense.status === 'OVERDUE' ? 'text-red-600 border-red-200 bg-red-50' : ''
                        }`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PAID" className="text-green-600">שולם</SelectItem>
                        <SelectItem value="PENDING" className="text-yellow-600">ממתין</SelectItem>
                        <SelectItem value="OVERDUE" className="text-red-600">באיחור</SelectItem>
                        {/* Optionally allow cancelling? */}
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell className="py-2">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        onClick={() => onEdit(expense)}
                        title="ערוך תשלום"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => onDelete(expense.id)}
                        title="מחק תשלום"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}
