'use client'

import useSWR, { mutate } from 'swr'
import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Calendar as CalendarIcon, X, Plus, Clock, Briefcase } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency, getDaysInMonth, getMonthName } from '@/lib/utils'
import { getBills, toggleBillPaid } from '@/lib/actions/bill'
import { getDebts, toggleDebtPaid } from '@/lib/actions/debts'
import { getIncomes } from '@/lib/actions/income'
import { getExpenses } from '@/lib/actions/expense'
import { getSavings } from '@/lib/actions/savings'
import { getWorkEvents, addWorkEvent } from '@/lib/actions/work-events'
import { getClients } from '@/lib/actions/clients'
import { useToast } from '@/hooks/use-toast'

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
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        startTime: '09:00',
        endTime: '10:00',
        clientId: 'none',
        incomeId: 'none'
    })

    const isBusiness = budgetType === 'BUSINESS'

    // Fetchers
    const fetchBills = async () => (await getBills(month, year, budgetType)).data?.bills || []
    const fetchDebts = async () => (await getDebts(month, year, budgetType)).data?.debts || []
    const fetchIncomes = async () => (await getIncomes(month, year, budgetType)).data?.incomes || []
    const fetchExpenses = async () => (await getExpenses(month, year, budgetType)).data?.expenses || []
    const fetchSavings = async () => (await getSavings(month, year, budgetType)).data?.savings || []

    // Work Mode Fetchers
    const fetchWorkEvents = async () => (await getWorkEvents(month, year)).data || []
    const fetchClients = async () => (await getClients()).data || []

    // SWR Hooks
    const { data: bills = [], mutate: mutateBills } = useSWR(['bills', month, year, budgetType], fetchBills)
    const { data: debts = [], mutate: mutateDebts } = useSWR(['debts', month, year, budgetType], fetchDebts)
    const { data: incomes = [] } = useSWR(['incomes', month, year, budgetType], fetchIncomes)
    const { data: expenses = [] } = useSWR(['expenses', month, year, budgetType], fetchExpenses)
    const { data: savings = [] } = useSWR(['savings', month, year, budgetType], fetchSavings)

    const { data: workEvents = [], mutate: mutateWorkEvents } = useSWR(
        viewMode === 'work' ? ['workEvents', month, year] : null,
        fetchWorkEvents
    )
    const { data: clients = [] } = useSWR(
        viewMode === 'work' && isBusiness ? ['clients'] : null,
        fetchClients
    )

    // Aggregate Payments
    const payments: Payment[] = [
        ...(Array.isArray(bills) ? bills : []).map((bill: any) => ({
            id: bill.id, name: bill.name, amount: bill.amount, currency: bill.currency || 'ILS', day: bill.dueDay, type: 'bill' as const, isPaid: bill.isPaid
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
            id: saving.id, name: saving.name || saving.description || 'חיסכון', amount: saving.monthlyDeposit || 0, currency: saving.currency || 'ILS', day: saving.date ? new Date(saving.date).getDate() : 1, type: 'saving' as const, isPaid: true
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

        const result = await addWorkEvent({
            title: newEvent.title,
            description: newEvent.description,
            start: startDateTime,
            end: endDateTime,
            allDay: false,
            clientId: newEvent.clientId === 'none' ? undefined : newEvent.clientId,
            incomeId: newEvent.incomeId === 'none' ? undefined : newEvent.incomeId
        })

        if (result.success) {
            mutateWorkEvents()
            setIsEventDialogOpen(false)
            setNewEvent({ title: '', description: '', startTime: '09:00', endTime: '10:00', clientId: 'none', incomeId: 'none' })
            toast({ title: 'נוסף בהצלחה', description: 'האירוע נוסף ליומן' })
        } else {
            toast({ title: 'שגיאה', description: 'שגיאה בהוספת האירוע', variant: 'destructive' })
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

    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0)
    const paidPayments = payments.filter(p => p.isPaid).reduce((sum, p) => sum + p.amount, 0)

    const calendarDays = []
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null)
    for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day)

    return (
        <div className="space-y-6">
            {/* Header / Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {isBusiness ? (
                    <div className="flex items-center space-x-2 rtl:space-x-reverse bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
                        <Switch
                            id="calendar-mode"
                            checked={viewMode === 'work'}
                            onCheckedChange={(checked) => setViewMode(checked ? 'work' : 'financial')}
                        />
                        <Label htmlFor="calendar-mode" className="cursor-pointer flex items-center gap-2">
                            {viewMode === 'work' ? <Briefcase className="h-4 w-4" /> : <CalendarIcon className="h-4 w-4" />}
                            {viewMode === 'work' ? 'יומן עבודה' : 'תשלומים'}
                        </Label>
                    </div>
                ) : <div />}

                {/* Summary (Only for Financial) */}
                {viewMode === 'financial' && (
                    <div className="text-sm text-muted-foreground">
                        סה"כ תשלומים: <span className="font-bold text-blue-600">{formatCurrency(totalPayments, currency)}</span>
                    </div>
                )}
            </div>

            {/* Calendar */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                        <CardTitle>
                            {viewMode === 'work' ? 'יומן עבודה' : 'לוח שנה'} - {getMonthName(month)} {year}
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-2 mb-2">
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
                            const allPaid = dayPayments.length > 0 && dayPayments.every(p => p.isPaid)
                            const financialBg = hasItems
                                ? allPaid
                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'

                            // Work View Logic
                            const workBg = hasItems
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'

                            return (
                                <div
                                    key={index}
                                    onClick={() => { setSelectedDay(day); if (viewMode === 'work') setIsEventDialogOpen(true) }}
                                    className={`h-[80px] md:h-auto md:min-h-[100px] p-2 border rounded-lg overflow-hidden cursor-pointer hover:bg-accent transition-colors
                                        ${viewMode === 'financial' ? financialBg : workBg}
                                    `}
                                >
                                    <div className="font-semibold text-sm mb-1">{day}</div>

                                    {/* Financial Items */}
                                    {viewMode === 'financial' && hasItems && (
                                        <div className="space-y-1">
                                            <div className="md:hidden flex justify-center">
                                                <div className={`w-2 h-2 rounded-full ${allPaid ? 'bg-green-500' : 'bg-yellow-500'}`} />
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
                                                    <div key={e.id} className="text-[10px] truncate bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-1 rounded">
                                                        {e.title}
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

            {/* Financial Details Dialog */}
            {viewMode === 'financial' && selectedDay && (
                <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>תשלומים ליום {selectedDay}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
                            {getPaymentsForDay(selectedDay).map((payment) => (
                                <div key={payment.id} className={`p-3 rounded-lg border-r-4 ${payment.isPaid ? 'opacity-60 bg-gray-50' : 'bg-white shadow-sm'
                                    } border-gray-200`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{payment.name}</p>
                                            <p className="text-xs text-muted-foreground">{formatCurrency(payment.amount, payment.currency)}</p>
                                        </div>
                                        {(!payment.isPaid && (payment.type === 'bill' || payment.type === 'debt')) && (
                                            <Button size="sm" onClick={() => togglePaid(payment)}>סמן כשולם</Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {getPaymentsForDay(selectedDay).length === 0 && <p className="text-center text-muted-foreground">אין תשלומים ליום זה</p>}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Work Event Dialog */}
            {viewMode === 'work' && selectedDay && (
                <Dialog open={isEventDialogOpen} onOpenChange={(open) => { setIsEventDialogOpen(open); if (!open) setSelectedDay(null) }}>
                    <DialogContent dir="rtl" className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle>יומן עבודה - {selectedDay}/{month}/{year}</DialogTitle>
                        </DialogHeader>

                        {/* Existing Events List */}
                        <div className="mb-4 space-y-2">
                            {getEventsForDay(selectedDay).map(event => (
                                <div key={event.id} className="p-2 border rounded bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50">
                                    <div className="font-bold text-sm">{event.title}</div>
                                    <div className="text-xs text-muted-foreground flex gap-2">
                                        <span>{format(new Date(event.start), 'HH:mm')} - {event.end ? format(new Date(event.end), 'HH:mm') : ''}</span>
                                        {event.client && <span>• {event.client.name}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-bold text-sm">הוסף אירוע חדש</h4>
                            <div className="space-y-2">
                                <Label>כותרת האירוע</Label>
                                <Input
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="שם הפגישה/עבודה"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>שעת התחלה</Label>
                                    <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>שעת סיום</Label>
                                    <Input type="time" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>לקוח (אופציונלי)</Label>
                                <Select value={newEvent.clientId} onValueChange={v => setNewEvent({ ...newEvent, clientId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="בחר לקוח" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">ללא</SelectItem>
                                        {clients.map((client: any) => (
                                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>מכירה מקושרת (אופציונלי)</Label>
                                <Select value={newEvent.incomeId} onValueChange={v => setNewEvent({ ...newEvent, incomeId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="בחר הכנסה/עסקה" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">ללא</SelectItem>
                                        {incomes.map((income: any) => (
                                            <SelectItem key={income.id} value={income.id}>
                                                {income.source} - {formatCurrency(income.amount, income.currency)}
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
                            <Button onClick={handleAddEvent}>שמור אירוע</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
