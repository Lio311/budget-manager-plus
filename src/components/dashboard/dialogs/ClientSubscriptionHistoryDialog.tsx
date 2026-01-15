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
    onUpdate?: () => void
}

const SUBSCRIPTION_TYPES_HE: Record<string, string> = {
    'WEEKLY': 'שבועי',
    'MONTHLY': 'חודשי',
    'YEARLY': 'שנתי',
    'PROJECT': 'פרויקט'
}

export function ClientSubscriptionHistoryDialog({ isOpen, onClose, client, onUpdate }: ClientSubscriptionHistoryDialogProps) {
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
            const result = await deleteSubscriptionIncome(id)
            if (result.success) {
                toast.success('תשלום נמחק בהצלחה')
                setIncomes(prev => prev.filter(inc => inc.id !== id))
                onUpdate?.()
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
                onUpdate?.()
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
                        ניהול תשלומי מנוי ({SUBSCRIPTION_TYPES_HE[client.subscriptionType] || client.subscriptionType} - {formatCurrency(client.subscriptionPrice || 0)})
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-6" dir="rtl">
                        {/* Summary Stats or Current Status could go here */}

                        {(() => {
                            const now = new Date()
                            now.setHours(0, 0, 0, 0)

                            // Sort oldest to newest
                            const sortedIncomes = [...incomes].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

                            const pastIncomes = sortedIncomes.filter(inc => new Date(inc.date) < now)
                            const futureIncomes = sortedIncomes.filter(inc => new Date(inc.date) >= now)

                            return (
                                <>
                                    {/* Past Payments - Accordion */}
                                    {pastIncomes.length > 0 && (
                                        <PastPaymentsAccordion incomes={pastIncomes} onStatusChange={handleStatusChange} onEdit={setEditingIncome} onDelete={handleDelete} updatingId={updatingId} />
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
                                                    {futureIncomes.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                                                אין תשלומים עתידיים
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        futureIncomes.map((income) => (
                                                            <IncomeRow
                                                                key={income.id}
                                                                income={income}
                                                                onStatusChange={handleStatusChange}
                                                                onEdit={setEditingIncome}
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

import { ChevronDown, ChevronUp } from "lucide-react"

function PastPaymentsAccordion({ incomes, onStatusChange, onEdit, onDelete, updatingId }: any) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div className="border rounded-md bg-gray-50/50 dark:bg-slate-900/50 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-100/50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">תשלומים קודמים</span>
                    <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-600">{incomes.length}</Badge>
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
                                {incomes.map((income: any) => (
                                    <IncomeRow
                                        key={income.id}
                                        income={income}
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

function IncomeRow({ income, onStatusChange, onEdit, onDelete, updatingId, isPast }: any) {
    return (
        <TableRow className={isPast ? "opacity-75 hover:opacity-100 transition-opacity" : ""}>
            <TableCell className="font-medium whitespace-nowrap py-4">
                {format(new Date(income.date), 'dd/MM/yyyy')}
            </TableCell>
            <TableCell className="whitespace-nowrap py-4 text-base">
                {formatCurrency(income.amount)}
            </TableCell>
            <TableCell className="py-2">
                <Select
                    value={income.status}
                    onValueChange={(val) => onStatusChange(income.id, val)}
                    disabled={updatingId === income.id}
                >
                    <SelectTrigger className={`w-[130px] h-9 ${income.status === 'PAID' ? 'text-green-600 border-green-200 bg-green-50' :
                        income.status === 'PENDING' ? 'text-yellow-600 border-yellow-200 bg-yellow-50' :
                            income.status === 'OVERDUE' ? 'text-red-600 border-red-200 bg-red-50' : ''
                        }`}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="PAID" className="text-green-600">שולם</SelectItem>
                        <SelectItem value="PENDING" className="text-yellow-600">ממתין</SelectItem>
                        <SelectItem value="OVERDUE" className="text-red-600">באיחור</SelectItem>
                        <SelectItem value="CANCELLED" className="text-gray-500">בוטל</SelectItem>
                    </SelectContent>
                </Select>
            </TableCell>
            <TableCell className="py-2">
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                        onClick={() => onEdit(income)}
                        title="ערוך תשלום"
                    >
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                        onClick={() => onDelete(income.id)}
                        title="מחק תשלום"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}
