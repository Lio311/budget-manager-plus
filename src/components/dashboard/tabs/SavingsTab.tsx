'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Loader2, Pencil, X, Check } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getSavings, addSaving, deleteSaving, updateSaving } from '@/lib/actions/savings'
import { useToast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'

interface Saving {
    id: string
    type: string
    description: string
    monthlyDeposit: number
    goal: string | null
    date: Date
}

const SAVING_TYPES = [
    { value: 'bank_deposit', label: 'פיקדון בבנק' },
    { value: 'pension_fund', label: 'קופת גמל' },
    { value: 'provident_fund', label: 'קרן השתלמות' },
    { value: 'study_fund', label: 'קרן השתלמות לימודים' },
    { value: 'other', label: 'אחר' }
]

export function SavingsTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()
    const [savings, setSavings] = useState<Saving[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [newSaving, setNewSaving] = useState({
        type: '',
        description: '',
        monthlyDeposit: '',
        goal: '',
        date: new Date(),
        isRecurring: false,
        recurringStartDate: undefined as Date | undefined,
        recurringEndDate: undefined as Date | undefined
    })
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({
        type: '',
        description: '',
        monthlyDeposit: '',
        goal: ''
    })

    const totalMonthlyDeposit = savings.reduce((sum, saving) => sum + saving.monthlyDeposit, 0)

    useEffect(() => {
        loadSavings()
    }, [month, year])

    async function loadSavings() {
        setLoading(true)
        const result = await getSavings(month, year)

        if (result.success && result.data) {
            setSavings(result.data)
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לטעון חסכונות',
                variant: 'destructive',
                duration: 1000
            })
        }
        setLoading(false)
    }

    const handleAdd = async () => {
        if (newSaving.type && newSaving.description && newSaving.monthlyDeposit) {
            setSubmitting(true)
            const result = await addSaving(month, year, {
                type: newSaving.type,
                description: newSaving.description,
                monthlyDeposit: parseFloat(newSaving.monthlyDeposit),
                goal: newSaving.goal || undefined,
                date: newSaving.date,
                isRecurring: newSaving.isRecurring,
                recurringStartDate: newSaving.recurringStartDate,
                recurringEndDate: newSaving.recurringEndDate
            })

            if (result.success) {
                setNewSaving({
                    type: '',
                    description: '',
                    monthlyDeposit: '',
                    goal: '',
                    date: new Date(),
                    isRecurring: false,
                    recurringStartDate: undefined,
                    recurringEndDate: undefined
                })
                await loadSavings()
                toast({
                    title: 'הצלחה',
                    description: 'החיסכון נוסף בהצלחה',
                    duration: 1000
                })
            } else {
                toast({
                    title: 'שגיאה',
                    description: result.error || 'לא ניתן להוסיף חיסכון',
                    variant: 'destructive',
                    duration: 1000
                })
            }
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteSaving(id)

        if (result.success) {
            await loadSavings()
            toast({
                title: 'הצלחה',
                description: 'החיסכון נמחק בהצלחה',
                duration: 1000
            })
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן למחוק חיסכון',
                variant: 'destructive',
                duration: 1000
            })
        }
    }

    const startEdit = (saving: Saving) => {
        setEditingId(saving.id)
        setEditData({
            type: saving.type,
            description: saving.description,
            monthlyDeposit: saving.monthlyDeposit.toString(),
            goal: saving.goal || ''
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditData({ type: '', description: '', monthlyDeposit: '', goal: '' })
    }

    const handleUpdate = async (id: string) => {
        setSubmitting(true)
        const result = await updateSaving(id, {
            type: editData.type,
            description: editData.description,
            monthlyDeposit: parseFloat(editData.monthlyDeposit),
            goal: editData.goal || undefined
        })

        if (result.success) {
            setEditingId(null)
            await loadSavings()
            toast({
                title: 'הצלחה',
                description: 'החיסכון עודכן בהצלחה',
                duration: 1000
            })
        } else {
            toast({
                title: 'שגיאה',
                description: result.error || 'לא ניתן לעדכן חיסכון',
                variant: 'destructive',
                duration: 1000
            })
        }
        setSubmitting(false)
    }

    const getTypeLabel = (type: string) => {
        return SAVING_TYPES.find(t => t.value === type)?.label || type
    }

    return (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-10">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                        <Card className="bg-gradient-to-l from-green-50 to-white border-green-200 shadow-sm">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-green-700 text-xs sm:text-sm">סך הפקדות חודשיות</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-xl sm:text-2xl font-bold text-green-600 break-all">
                                    {formatCurrency(totalMonthlyDeposit, currency)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-l from-blue-50 to-white border-blue-200 shadow-sm">
                            <CardHeader className="p-4 pb-2">
                                <CardTitle className="text-blue-700 text-xs sm:text-sm">מספר חסכונות</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-xl sm:text-2xl font-bold text-blue-600">
                                    {savings.length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Add New Saving */}
                    <Card className="mx-0 sm:mx-auto">
                        <CardHeader>
                            <CardTitle className="text-lg">הוסף חיסכון חדש</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                                <Select value={newSaving.type} onValueChange={(value) => setNewSaving({ ...newSaving, type: value })}>
                                    <SelectTrigger className="sm:col-span-2 lg:col-span-1">
                                        <SelectValue placeholder="סוג חיסכון" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SAVING_TYPES.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="תיאור"
                                    value={newSaving.description}
                                    onChange={(e) => setNewSaving({ ...newSaving, description: e.target.value })}
                                    className="sm:col-span-2 lg:col-span-1"
                                />
                                <Input
                                    type="number"
                                    placeholder="הפקדה חודשית"
                                    value={newSaving.monthlyDeposit}
                                    onChange={(e) => setNewSaving({ ...newSaving, monthlyDeposit: e.target.value })}
                                />
                                <Input
                                    placeholder="מטרה (אופציונלי)"
                                    value={newSaving.goal}
                                    onChange={(e) => setNewSaving({ ...newSaving, goal: e.target.value })}
                                />
                                <DatePicker
                                    date={newSaving.date}
                                    setDate={(date) => setNewSaving({ ...newSaving, date: date || new Date() })}
                                    placeholder="תאריך"
                                />
                                <Button onClick={handleAdd} className="w-full gap-2 sm:col-span-2 lg:col-span-1" disabled={submitting}>
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                    הוסף
                                </Button>
                            </div>

                            {/* Recurring Savings Options */}
                            <div className="flex items-start gap-4 p-4 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="recurring-saving"
                                        checked={newSaving.isRecurring}
                                        onCheckedChange={(checked) => setNewSaving({ ...newSaving, isRecurring: checked as boolean })}
                                    />
                                    <label htmlFor="recurring-saving" className="text-sm font-medium cursor-pointer">
                                        חיסכון קבוע
                                    </label>
                                </div>

                                {newSaving.isRecurring && (
                                    <div className="flex gap-4 flex-1">
                                        <div className="space-y-2 flex-1">
                                            <label className="text-sm font-medium">תאריך התחלה</label>
                                            <DatePicker
                                                date={newSaving.recurringStartDate}
                                                setDate={(date) => setNewSaving({ ...newSaving, recurringStartDate: date })}
                                                placeholder="בחר תאריך התחלה"
                                            />
                                        </div>
                                        <div className="space-y-2 flex-1">
                                            <label className="text-sm font-medium">תאריך סיום</label>
                                            <DatePicker
                                                date={newSaving.recurringEndDate}
                                                setDate={(date) => setNewSaving({ ...newSaving, recurringEndDate: date })}
                                                placeholder="בחר תאריך סיום"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Savings List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">רשימת חסכונות</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                    <div className="space-y-3">
                        {savings.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8 italic">אין חסכונות רשומים</p>
                        ) : (
                            savings.map((saving) => (
                                <div
                                    key={saving.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent transition-colors gap-3"
                                >
                                    {editingId === saving.id ? (
                                        <>
                                            <div className="grid gap-2 sm:grid-cols-4 flex-1 w-full">
                                                <Select value={editData.type} onValueChange={(value) => setEditData({ ...editData, type: value })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {SAVING_TYPES.map((type) => (
                                                            <SelectItem key={type.value} value={type.value}>
                                                                {type.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    value={editData.description}
                                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                />
                                                <Input
                                                    type="number"
                                                    value={editData.monthlyDeposit}
                                                    onChange={(e) => setEditData({ ...editData, monthlyDeposit: e.target.value })}
                                                />
                                                <Input
                                                    value={editData.goal}
                                                    onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
                                                    placeholder="מטרה"
                                                />
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto">
                                                <Button onClick={() => handleUpdate(saving.id)} size="sm" disabled={submitting}>
                                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                </Button>
                                                <Button onClick={cancelEdit} variant="outline" size="sm">
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 w-full">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                        {getTypeLabel(saving.type)}
                                                    </span>
                                                    <p className="font-medium">{saving.description}</p>
                                                </div>
                                                {saving.goal && (
                                                    <p className="text-sm text-muted-foreground">מטרה: {saving.goal}</p>
                                                )}
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(saving.date).toLocaleDateString('he-IL')}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                                                <span className="text-lg font-bold text-green-600">
                                                    {formatCurrency(saving.monthlyDeposit, currency)}
                                                </span>
                                                <div className="flex items-center gap-2 mr-4">
                                                    <Button onClick={() => startEdit(saving)} variant="ghost" size="sm">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button onClick={() => handleDelete(saving.id)} variant="destructive" size="sm">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
