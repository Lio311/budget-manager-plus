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
import { Check, X, Loader2, Edit2, Trash2 } from "lucide-react"
import { toast } from 'sonner'
import { getClientSubscriptionIncomes, updateIncomeStatus, deleteSubscriptionIncome, updateSubscriptionIncome } from '@/lib/actions/clients'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DatePicker } from '@/components/ui/date-picker'
import { useConfirm } from '@/hooks/useConfirm'

interface ClientSubscriptionHistoryDialogProps {
    isOpen: boolean
    onClose: () => void
    client: any
}

const SUBSCRIPTION_TYPES_HE: Record<string, string> = {
    'WEEKLY': 'שבועי',
    'MONTHLY': 'חודשי',
    'YEARLY': 'שנתי',
    'PROJECT': 'פרויקט'
}

export function ClientSubscriptionHistoryDialog({ isOpen, onClose, client }: ClientSubscriptionHistoryDialogProps) {
    const [incomes, setIncomes] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [editingIncome, setEditingIncome] = useState<any>(null)
    const confirm = useConfirm()

    useEffect(() => {
        if (isOpen && client) {
            fetchHistory()
        }
    }, [isOpen, client])

    const fetchHistory = async () => {
        setIsLoading(true)
        try {
            const result = await getClientSubscriptionIncomes(client.id)
            if (result.success) {
                setIncomes(result.data || [])
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

    const handleStatusChange = async (incomeId: string, newStatus: string) => {
        setUpdatingId(incomeId)
        try {
            const result = await updateIncomeStatus(incomeId, newStatus)
            if (result.success) {
                toast.success('סטטוס עודכן בהצלחה')
                setIncomes(prev => prev.map(inc =>
                    inc.id === incomeId ? { ...inc, status: newStatus } : inc
                ))
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
            const result = await deleteSubscriptionIncome(id)
            if (result.success) {
                toast.success('תשלום נמחק בהצלחה')
                setIncomes(prev => prev.filter(inc => inc.id !== id))
            } else {
                toast.error('שגיאה במחיקת תשלום')
            }
        } catch (error) {
            toast.error('שגיאה במחיקת תשלום')
        }
    }

    const handleSaveEdit = async (income: any) => {
        try {
            const result = await updateSubscriptionIncome(income.id, {
                date: new Date(income.date),
                amount: income.amount
            })

            if (result.success) {
                toast.success('תשלום עודכן בהצלחה')
                setIncomes(prev => prev.map(inc =>
                    inc.id === income.id
                        ? { ...inc, date: income.date, amount: income.amount }
                        : inc
                ))
                setEditingIncome(null)
            } else {
                toast.error('שגיאה בעדכון תשלום')
            }
        } catch (error) {
            toast.error('שגיאה בעדכון תשלום')
        }
    }

    if (!client) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>היסטוריית תשלומי מנוי - {client.name}</DialogTitle>
                    <DialogDescription>
                        ניהול תשלומי מנוי ({SUBSCRIPTION_TYPES_HE[client.subscriptionType] || client.subscriptionType} - {formatCurrency(client.subscriptionPrice)})
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-md border text-right overflow-x-auto" dir="rtl">
                        <Table dir="rtl" className="min-w-[600px] sm:min-w-full">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right w-[100px]">תאריך</TableHead>
                                    <TableHead className="text-right w-[100px]">סכום</TableHead>
                                    <TableHead className="text-right w-[100px]">סטטוס</TableHead>
                                    <TableHead className="text-right min-w-[140px]">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incomes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                            לא נמצאו רישומי מנוי
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incomes.map((income) => (
                                        <TableRow key={income.id}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {format(new Date(income.date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">{formatCurrency(income.amount)}</TableCell>
                                            <TableCell>
                                                <StatusBadge status={income.status} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Select
                                                        value={income.status}
                                                        onValueChange={(val) => handleStatusChange(income.id, val)}
                                                        disabled={updatingId === income.id}
                                                    >
                                                        <SelectTrigger className="w-[110px] h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="PAID">שולם</SelectItem>
                                                            <SelectItem value="PENDING">ממתין</SelectItem>
                                                            <SelectItem value="OVERDUE">באיחור</SelectItem>
                                                            <SelectItem value="CANCELLED">בוטל</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <div className="flex gap-1 mr-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                            onClick={() => setEditingIncome(income)}
                                                            title="ערוך תשלום"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(income.id)}
                                                            title="מחק תשלום"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* Edit Dialog */}
                {editingIncome && (
                    <Dialog open={!!editingIncome} onOpenChange={(open) => !open && setEditingIncome(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>עריכת תשלום</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>תאריך</Label>
                                    <DatePicker
                                        date={new Date(editingIncome.date)}
                                        setDate={(date) => date && setEditingIncome({ ...editingIncome, date: date.toISOString() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>סכום</Label>
                                    <Input
                                        type="number"
                                        value={editingIncome.amount}
                                        onChange={(e) => setEditingIncome({ ...editingIncome, amount: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setEditingIncome(null)}>ביטול</Button>
                                    <Button onClick={() => handleSaveEdit(editingIncome)}>שמור שינויים</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

            </DialogContent >
        </Dialog >
    )
}

function StatusBadge({ status }: { status: string }) {
    switch (status) {
        case 'PAID':
            return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">שולם</Badge>
        case 'PENDING':
            return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">ממתין</Badge>
        case 'OVERDUE':
            return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">באיחור</Badge>
        case 'CANCELLED':
            return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">בוטל</Badge>
        default:
            return <Badge variant="outline">{status}</Badge>
    }
}
