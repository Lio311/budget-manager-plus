'use client'

import useSWR, { mutate } from 'swr'
import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Calendar as CalendarIcon,
    DollarSign,
    CreditCard,
    TrendingUp,
    Briefcase,
    Plus,
    X,
    Edit2,
    Trash2,
    Info,
    Check,
    Loader2,
    Clock,
    Pencil
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency, getDaysInMonth, getMonthName } from '@/lib/utils'
import { getCurrencySymbol } from '@/lib/currency'
import { getBills, toggleBillPaid } from '@/lib/actions/bill'
import { getDebts, toggleDebtPaid } from '@/lib/actions/debts'
import { getIncomes } from '@/lib/actions/income'
import { getExpenses } from '@/lib/actions/expense'
import { getSavings } from '@/lib/actions/savings'
import { getWorkEvents, addWorkEvent, updateWorkEvent, deleteWorkEvent } from '@/lib/actions/work-events'
import { getClients } from '@/lib/actions/clients'
import { useToast } from '@/hooks/use-toast'
import { QuickAddDialog } from '@/components/dashboard/QuickAddDialog'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarTutorial } from '@/components/dashboard/tutorial/CalendarTutorial'
import { CalendarSyncButton } from '@/components/dashboard/CalendarSyncButton'

interface Payment {
    id: string
    name: string
    amount: number
    currency: string
    day: number
    type: 'bill' | 'debt' | 'income' | 'expense' | 'saving'
    isPaid: boolean
}

interface WorkEvent {
    id: string
    title: string
    description?: string
    start: Date | string
    end?: Date | string
    allDay: boolean
    clientId?: string
    client?: { id: string, name: string }
    incomeId?: string
    income?: { id: string, source: string, amount: number, currency: string }
}

export function CalendarTab() {
    const { month, year, currency, budgetType } = useBudget()
    const { toast } = useToast()
    const [selectedDay, setSelectedDay] = useState<number | null>(null)
    const [viewMode, setViewMode] = useState<'financial' | 'work'>('financial')
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
    const [editingEventId, setEditingEventId] = useState<string | null>(null)
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        clientId: 'none',
        incomeId: 'none'
    })
    const [errors, setErrors] = useState<Record<string, boolean>>({})
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
    const [showTutorial, setShowTutorial] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const isBusiness = budgetType === 'BUSINESS'

    // Fetchers
    const fetchBills = async () => (await getBills(month, year, budgetType)).data
    const fetchDebts = async () => (await getDebts(month, year, budgetType)).data
    const fetchIncomes = async () => (await getIncomes(month, year, budgetType)).data
    const fetchExpenses = async () => (await getExpenses(month, year, budgetType)).data
    const fetchSavings = async () => (await getSavings(month, year, budgetType)).data

    // Work Mode Fetchers
    const fetchWorkEvents = async () => (await getWorkEvents(month, year)).data || []
    const fetchClients = async () => (await getClients(budgetType)).data || []

    // SWR Hooks
    const { data: billsData, mutate: mutateBills } = useSWR(['bills', month, year, budgetType], fetchBills)
    const { data: debtsData, mutate: mutateDebts } = useSWR(['debts', month, year, budgetType], fetchDebts)
    const { data: incomesData } = useSWR(['incomes', month, year, budgetType], fetchIncomes)
    const { data: expensesData } = useSWR(['expenses', month, year, budgetType], fetchExpenses)
    const { data: savingsData } = useSWR(['savings', month, year, budgetType], fetchSavings)

    const bills = billsData?.bills || []
    const debts = debtsData?.debts || []
    const incomes = incomesData?.incomes || []
    const expenses = expensesData?.expenses || []
    const savings = savingsData?.savings || []

    const { data: workEvents = [], mutate: mutateWorkEvents } = useSWR(
        viewMode === 'work' ? ['workEvents', month, year] : null,
        fetchWorkEvents
    )
    const { data: clients = [] } = useSWR(
        isBusiness ? ['clients', budgetType] : null,
        fetchClients
    )

    // Aggregate Payments
    const payments: Payment[] = [
        ...(Array.isArray(bills) ? bills : []).map((bill: any) => ({
            id: bill.id, name: bill.name, amount: bill.amount, currency: bill.currency || 'ILS', day: bill.dueDate ? new Date(bill.dueDate).getDate() : 1, type: 'bill' as const, isPaid: bill.isPaid
        })),
        ...(Array.isArray(debts) ? debts : []).map((debt: any) => ({
            id: debt.id, name: debt.creditor, amount: debt.monthlyPayment, currency: debt.currency || 'ILS', day: debt.dueDay, type: 'debt' as const, isPaid: debt.isPaid
        })),
        ...(Array.isArray(incomes) ? incomes : []).map((income: any) => ({
            id: income.id, name: income.source, amount: income.amount, currency: income.currency || 'ILS', day: income.date ? new Date(income.date).getDate() : 1, type: 'income' as const, isPaid: true
        })),
        ...(Array.isArray(expenses) ? expenses : []).map((expense: any) => ({
            id: expense.id, name: expense.description, amount: expense.amount, currency: expense.currency || 'ILS', day: expense.date ? new Date(expense.date).getDate() : 1, type: 'expense' as const, isPaid: true
        })),
        ...(Array.isArray(savings) ? savings : []).map((saving: any) => ({
            id: saving.id, name: saving.name || saving.description || 'חיסכון', amount: saving.monthlyDeposit || 0, currency: saving.currency || 'ILS', day: saving.targetDate ? new Date(saving.targetDate).getDate() : 1, type: 'saving' as const, isPaid: true
        }))
    ]

    const togglePaid = async (payment: Payment) => {
        const result = payment.type === 'bill'
            ? await toggleBillPaid(payment.id, !payment.isPaid)
            : await toggleDebtPaid(payment.id, !payment.isPaid)

        if (result.success) {
            payment.type === 'bill' ? mutateBills() : mutateDebts()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן סטטוס', variant: 'destructive' })
        }
    }

    const handleAddEvent = async () => {
        if (!selectedDay) return

        const startDateTime = new Date(year, month - 1, selectedDay)
        const [startHour, startMinute] = newEvent.startTime.split(':')
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute))

        const endDateTime = new Date(year, month - 1, selectedDay)
        const [endHour, endMinute] = newEvent.endTime.split(':')
        endDateTime.setHours(parseInt(endHour), parseInt(endMinute))

        const newErrors: Record<string, boolean> = {}
        if (!newEvent.title) newErrors.title = true
        if (!newEvent.startTime) newErrors.startTime = true
        if (!newEvent.endTime) newErrors.endTime = true

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast({ title: 'שגיאה', description: 'נא למלא את שדות החובה', variant: 'destructive' })
            return
        }
        setErrors({})

        let result;

        if (editingEventId) {
            result = await updateWorkEvent(editingEventId, {
                title: newEvent.title,
                description: newEvent.description,
                start: startDateTime,
                end: endDateTime,
                allDay: false,
                clientId: newEvent.clientId === 'none' ? undefined : newEvent.clientId,
                incomeId: newEvent.incomeId === 'none' ? undefined : newEvent.incomeId
            })
        } else {
            result = await addWorkEvent({
                title: newEvent.title,
                description: newEvent.description,
                start: startDateTime,
                end: endDateTime,
                allDay: false,
                clientId: newEvent.clientId === 'none' ? undefined : newEvent.clientId,
                incomeId: newEvent.incomeId === 'none' ? undefined : newEvent.incomeId
            })
        }

        if (result.success) {
            mutateWorkEvents()
            setIsEventDialogOpen(false)
            setEditingEventId(null)
            setNewEvent({ title: '', description: '', startTime: '09:00', endTime: '10:00', clientId: 'none', incomeId: 'none' })
            setErrors({})
            toast({ title: editingEventId ? 'עודכן בהצלחה' : 'נוסף בהצלחה', description: editingEventId ? 'האירוע עודכן' : 'האירוע נוסף ליומן' })
        } else {
            toast({ title: 'שגיאה', description: 'שגיאה בהוספת האירוע', variant: 'destructive' })
        }
    }

    const handleEditEvent = (event: WorkEvent) => {
        setEditingEventId(event.id)
        setNewEvent({
            title: event.title,
            description: event.description || '',
            startTime: format(new Date(event.start), 'HH:mm'),
            endTime: event.end ? format(new Date(event.end), 'HH:mm') : '10:00',
            clientId: event.clientId || 'none',
            incomeId: event.incomeId || 'none'
        })
    }

    const handleDeleteEvent = async (id: string) => {
        if (confirm('האם אתה בטוח שברצונך למחוק אירוע זה?')) {
            const result = await deleteWorkEvent(id)
            if (result.success) {
                mutateWorkEvents()
                if (editingEventId === id) {
                    setEditingEventId(null)
                    setNewEvent({ title: '', description: '', startTime: '09:00', endTime: '10:00', clientId: 'none', incomeId: 'none' })
                }
                toast({ title: 'נמחק בהצלחה' })
            } else {
                toast({ title: 'שגיאה במחיקה', variant: 'destructive' })
            }
        }
    }

    const daysInMonth = getDaysInMonth(month, year)
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

    const getPaymentsForDay = (day: number) => payments.filter(p => p.day === day)

    const getEventsForDay = (day: number) => {
        const date = new Date(year, month - 1, day)
        return (workEvents as WorkEvent[]).filter(e => {
            const eventDate = new Date(e.start)
            return eventDate.getDate() === day && eventDate.getMonth() === month - 1 && eventDate.getFullYear() === year
        })
    }

    const totalPayments = (billsData?.totalILS || 0) +
        (debtsData?.stats?.monthlyPaymentOwedByMeILS || 0) +
        (isBusiness ? (expensesData?.totalNetILS || 0) : (expensesData?.totalILS || 0)) +
        (savingsData?.stats?.totalMonthlyDepositILS || 0)
    const paidPayments = payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0)

    const calendarDays = []
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null)
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day)

    return (
        <div className="space-y-6">
            {/* Header / Toggle */}
            {/* Header / Info Button moved here */}
            <div className="flex justify-end px-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTutorial(true)}
                    className="h-8 w-8 text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white"
                    title="הדרכה"
                >
                    <Info className="h-5 w-5" />
                </Button>
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                            <CardTitle>
                                {viewMode === 'work' ? 'יומן עבודה' : 'לוח שנה'} - {getMonthName(month)} {year}
                            </CardTitle>
                        </div>

                        {/* Controls moved inside the card */}
                        <div className="flex flex-row-reverse md:flex-row items-center gap-4 overflow-x-auto max-w-full">
                            {isBusiness ? (
                                <div id="calendar-mode-toggle" className="flex items-center space-x-2 rtl:space-x-reverse bg-gray-50 dark:bg-slate-800 p-1.5 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <Switch
                                        id="calendar-mode"
                                        dir="ltr"
                                        checked={viewMode === 'work'}
                                        onCheckedChange={(checked) => setViewMode(checked ? 'work' : 'financial')}
                                    />
                                    <Label htmlFor="calendar-mode" className="cursor-pointer flex items-center gap-2 text-xs md:text-sm">
                                        {viewMode === 'work' ? <Briefcase className="h-3.5 w-3.5" /> : <CalendarIcon className="h-3.5 w-3.5" />}
                                        {viewMode === 'work' ? 'יומן' : 'תשלומים'}
                                    </Label>
                                </div>
                            ) : null}

                            {/* Summary (Only for Financial) */}
                            {viewMode === 'financial' && (
                                <div id="calendar-summary" className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                                    סה"כ: <span className="font-bold text-blue-600">{formatCurrency(totalPayments, getCurrencySymbol(currency))}</span>
                                </div>
                            )}

                            <CalendarSyncButton />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div id="calendar-grid" className="grid grid-cols-7 gap-2 mb-2">
                        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => (
                            <div key={day} className="text-center font-bold text-sm text-muted-foreground p-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2 max-w-full overflow-x-auto">
                        {calendarDays.map((day, index) => {
                            if (!day) return <div key={index} className="h-[80px] p-2 bg-gray-50 dark:bg-slate-900/50 border rounded-lg" />

                            const dayPayments = viewMode === 'financial' ? getPaymentsForDay(day) : []
                            const dayEvents = viewMode === 'work' ? getEventsForDay(day) : []

                            const hasItems = viewMode === 'financial' ? dayPayments.length > 0 : dayEvents.length > 0

                            // Financial View Logic
                            const hasIncome = dayPayments.some(p => p.type === 'income')
                            const hasExpense = dayPayments.some(p => p.type !== 'income') // Bill, Debt, Expense, Saving

                            let financialBg = 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
                            let dotColor = 'bg-gray-300'

                            if (hasItems) {
                                if (hasIncome && hasExpense) {
                                    // Mixed -> Yellow
                                    financialBg = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                    dotColor = 'bg-yellow-500'
                                } else if (hasIncome) {
                                    // Only Income -> Green
                                    financialBg = 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    dotColor = 'bg-green-500'
                                } else {
                                    // Only Expense -> Red
                                    financialBg = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                                    dotColor = 'bg-red-500'
                                }
                            }

                            // Work View Logic
                            const workBg = hasItems
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'

                            return (
                                <div
                                    key={index}
                                    onClick={() => {
                                        setSelectedDay(day);
                                        if (viewMode === 'work') {
                                            setIsEventDialogOpen(true)
                                            setEditingEventId(null)
                                            setNewEvent({ title: '', description: '', startTime: '09:00', endTime: '10:00', clientId: 'none', incomeId: 'none' })
                                            setErrors({})
                                        } else {
                                            // Financial mode - open quick add dialog
                                            setIsQuickAddOpen(true)
                                        }
                                    }}
                                    className={`h-[80px] md:h-auto md:min-h-[100px] p-2 border rounded-lg overflow-hidden cursor-pointer hover:bg-accent transition-colors
                                        ${viewMode === 'financial' ? financialBg : workBg}
                                    `}
                                >
                                    <div className="font-semibold text-sm mb-1">{day}</div>

                                    {/* Financial Items */}
                                    {viewMode === 'financial' && hasItems && (
                                        <div className="space-y-1">
                                            <div className="md:hidden flex justify-center">
                                                <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                                            </div>
                                            <div className="hidden md:block">
                                                <div className="text-xs text-center font-bold">
                                                    {dayPayments.length} תשלומים
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Work Items */}
                                    {viewMode === 'work' && hasItems && (
                                        <div className="space-y-1">
                                            <div className="md:hidden flex justify-center gap-1 flex-wrap">
                                                {dayEvents.map(e => (
                                                    <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                ))}
                                            </div>
                                            <div className="hidden md:block space-y-1">
                                                {dayEvents.slice(0, 3).map(e => (
                                                    <div key={e.id} className="text-[10px] truncate bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-1 rounded flex justify-between gap-1">
                                                        <span className="truncate">{e.title}</span>
                                                        <span className="opacity-75 text-[9px] whitespace-nowrap">
                                                            {format(new Date(e.start), 'HH:mm')}-{e.end ? format(new Date(e.end), 'HH:mm') : ''}
                                                        </span>
                                                    </div>
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <div className="text-[10px] text-center text-muted-foreground">
                                                        +{dayEvents.length - 3} נוספים
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>



            {/* Work Event Dialog */}
            {viewMode === 'work' && selectedDay && (
                <Dialog open={isEventDialogOpen} onOpenChange={(open) => {
                    setIsEventDialogOpen(open);
                    if (!open) {
                        setSelectedDay(null)
                        setEditingEventId(null)
                        setNewEvent({ title: '', description: '', startTime: '09:00', endTime: '10:00', clientId: 'none', incomeId: 'none' })
                        setErrors({})
                    }
                }}>
                    <DialogContent dir="rtl" className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader className="text-right sm:text-right">
                            <DialogTitle>יומן עבודה - {selectedDay}/{month}/{year}</DialogTitle>
                        </DialogHeader>

                        {/* Existing Events List */}
                        <div className="mb-4 space-y-2">
                            {getEventsForDay(selectedDay).map(event => (
                                <div key={event.id} className="p-2 border rounded bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50 flex justify-between items-start group">
                                    <div>
                                        <div className="font-bold text-sm">{event.title}</div>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <span>{format(new Date(event.start), 'HH:mm')} - {event.end ? format(new Date(event.end), 'HH:mm') : ''}</span>
                                            {event.client && <span>• {event.client.name}</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditEvent(event)}>
                                            <Pencil className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-600" onClick={() => handleDeleteEvent(event.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-sm text-right">{editingEventId ? 'ערוך אירוע' : 'הוסף אירוע חדש'}</h4>
                                {editingEventId && (
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingEventId(null)
                                        setNewEvent({ title: '', description: '', startTime: '09:00', endTime: '10:00', clientId: 'none', incomeId: 'none' })
                                    }}>
                                        ביטול עריכה
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label className="text-right block">כותרת האירוע *</Label>
                                <Input
                                    className={`text-right ${errors.title ? 'border-red-500' : ''}`}
                                    value={newEvent.title}
                                    onChange={e => {
                                        setNewEvent({ ...newEvent, title: e.target.value })
                                        if (e.target.value) setErrors(prev => ({ ...prev, title: false }))
                                    }}
                                    placeholder="שם הפגישה/עבודה"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-right block">שעת התחלה *</Label>
                                    <Input
                                        className={`text-right ${errors.startTime ? 'border-red-500' : ''}`}
                                        type="time"
                                        value={newEvent.startTime}
                                        onChange={e => {
                                            setNewEvent({ ...newEvent, startTime: e.target.value })
                                            if (e.target.value) setErrors(prev => ({ ...prev, startTime: false }))
                                        }}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-right block">שעת סיום *</Label>
                                    <Input
                                        className={`text-right ${errors.endTime ? 'border-red-500' : ''}`}
                                        type="time"
                                        value={newEvent.endTime}
                                        onChange={e => {
                                            setNewEvent({ ...newEvent, endTime: e.target.value })
                                            if (e.target.value) setErrors(prev => ({ ...prev, endTime: false }))
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-right block">לקוח (אופציונלי)</Label>
                                <Select value={newEvent.clientId} onValueChange={v => setNewEvent({ ...newEvent, clientId: v })}>
                                    <SelectTrigger dir="rtl" className="text-right flex flex-row-reverse">
                                        <SelectValue placeholder="בחר לקוח" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="none">ללא</SelectItem>
                                        {clients.map((client: any) => (
                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-right block">מכירה מקושרת (אופציונלי)</Label>
                                <Select value={newEvent.incomeId} onValueChange={v => setNewEvent({ ...newEvent, incomeId: v })}>
                                    <SelectTrigger dir="rtl" className="text-right flex flex-row-reverse">
                                        <SelectValue placeholder="בחר הכנסה/עסקה" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="none">ללא</SelectItem>
                                        {incomes.map((income: any) => (
                                            <SelectItem key={income.id} value={income.id}>
                                                {income.source} - {formatCurrency(income.amount, getCurrencySymbol(income.currency))}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>תיאור/הערות</Label>
                                <Textarea
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="פרטים נוספים..."
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>ביטול</Button>
                            <Button onClick={handleAddEvent}>{editingEventId ? 'עדכן אירוע' : 'שמור אירוע'}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Quick Add Dialog for Financial Mode */}
            <QuickAddDialog
                open={isQuickAddOpen}
                onOpenChange={setIsQuickAddOpen}
                selectedDay={selectedDay}
                isBusiness={isBusiness}
                payments={selectedDay ? getPaymentsForDay(selectedDay) : []}
                onTogglePaid={togglePaid}
                onSelectAction={(action) => {
                    // Calculate the date for the selected day
                    const selectedDate = new Date(year, month - 1, selectedDay || 1)
                    const dateStr = format(selectedDate, 'yyyy-MM-dd')

                    // Navigate to the appropriate tab with date parameter
                    const tabMap = {
                        'expense': 'expenses',
                        'income': 'income',
                        'saving': 'savings',
                        'debt': 'debts',
                        'bill': 'bills'
                    }
                    router.push(`?tab=${tabMap[action]}&date=${dateStr}`)
                    setIsQuickAddOpen(false)
                }}
            />

            <CalendarTutorial
                isOpen={showTutorial}
                onClose={() => setShowTutorial(false)}
            />
        </div>
    )
}
