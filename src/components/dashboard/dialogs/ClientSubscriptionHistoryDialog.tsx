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
import { Check, X, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { getClientSubscriptionIncomes, updateIncomeStatus } from '@/lib/actions/clients' // We will implement these
import { formatCurrency } from '@/lib/utils'

interface ClientSubscriptionHistoryDialogProps {
    isOpen: boolean
    onClose: () => void
    client: any
}

export function ClientSubscriptionHistoryDialog({ isOpen, onClose, client }: ClientSubscriptionHistoryDialogProps) {
    const [incomes, setIncomes] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

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

    if (!client) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>היסטוריית תשלומי מנוי - {client.name}</DialogTitle>
                    <DialogDescription>
                        ניהול תשלומי מנוי ({client.subscriptionType} - {formatCurrency(client.subscriptionPrice)})
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-md border text-right" dir="rtl">
                        <Table dir="rtl">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">תאריך</TableHead>
                                    <TableHead className="text-right">סכום</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                    <TableHead className="text-right">פעולות</TableHead>
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
                                            <TableCell className="font-medium">
                                                {format(new Date(income.date), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell>{formatCurrency(income.amount)}</TableCell>
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
                                                            <SelectItem value="PENDING">שוחד</SelectItem>
                                                            <SelectItem value="OVERDUE">באיחור</SelectItem>
                                                            <SelectItem value="CANCELLED">בוטל</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </DialogContent>
        </Dialog>
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
