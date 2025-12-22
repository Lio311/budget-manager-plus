'use client'

import useSWR from 'swr'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, Loader2, Pencil, X, Check } from 'lucide-react'
import { useBudget } from '@/contexts/BudgetContext'
import { formatCurrency } from '@/lib/utils'
import { getSavings, addSaving, deleteSaving, updateSaving } from '@/lib/actions/savings'
import { getCategories, addCategory } from '@/lib/actions/category'
import { useToast } from '@/hooks/use-toast'
import { DatePicker } from '@/components/ui/date-picker'
import { format } from 'date-fns'
import { PRESET_COLORS } from '@/lib/constants'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface Saving {
    id: string
    type: string
    category: string
    description: string
    monthlyDeposit: number
    goal: string | null
    date: Date
}

interface Category {
    id: string
    name: string
    color: string | null
}

export function SavingsTab() {
    const { month, year, currency } = useBudget()
    const { toast } = useToast()

    // --- Data Fetching ---

    // Savings Fetcher
    const fetcherSavings = async () => {
        const result = await getSavings(month, year)
        if (result.success && result.data) return result.data
        throw new Error(result.error || 'Failed to fetch savings')
    }

    const { data: savings = [], isLoading: loadingSavings, mutate: mutateSavings } = useSWR(
        ['savings', month, year],
        fetcherSavings,
        { revalidateOnFocus: false }
    )

    // Categories Fetcher
    const fetcherCategories = async () => {
        const result = await getCategories('saving')
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categories = [], mutate: mutateCategories } = useSWR<Category[]>(
        ['categories', 'saving'],
        async () => {
            const data = await fetcherCategories()
            if (data.length === 0) {
                const { seedCategories } = await import('@/lib/actions/category')
                await seedCategories('saving')
                return fetcherCategories()
            }
            return data
        },
        { revalidateOnFocus: false }
    )

    // --- State ---

    const [submitting, setSubmitting] = useState(false)

    // Create form state
    const [newSaving, setNewSaving] = useState({
        category: '',
        description: '',
        monthlyDeposit: '',
        goal: '',
        date: new Date(),
        isRecurring: false,
        recurringEndDate: undefined as Date | undefined
    })

    // Edit form state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState({
        category: '',
        description: '',
        monthlyDeposit: '',
        goal: '',
        date: new Date()
    })

    // New Category State
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0].class)

    // Set default category
    useEffect(() => {
        if (categories.length > 0 && !newSaving.category) {
            setNewSaving(prev => ({ ...prev, category: categories[0].name }))
        }
    }, [categories, newSaving.category])

    const totalMonthlyDeposit = savings.reduce((sum: number, saving: any) => sum + saving.monthlyDeposit, 0)

    // --- Actions ---

    async function handleAdd() {
        if (!newSaving.category || !newSaving.description || !newSaving.monthlyDeposit) {
            toast({ title: 'שגיאה', description: 'נא למלא את כל השדות החובה', variant: 'destructive' })
            return
        }

        setSubmitting(true)
        try {
            const result = await addSaving(month, year, {
                category: newSaving.category,
                description: newSaving.description,
                monthlyDeposit: parseFloat(newSaving.monthlyDeposit),
                goal: newSaving.goal || undefined,
                date: newSaving.date, // Server component will handle the conversion
                isRecurring: newSaving.isRecurring,
                recurringStartDate: newSaving.isRecurring ? newSaving.date : undefined,
                recurringEndDate: newSaving.isRecurring ? newSaving.recurringEndDate : undefined
            } as any)

            if (result.success) {
                toast({ title: 'הצלחה', description: 'החיסכון נוסף בהצלחה' })
                setNewSaving({
                    category: categories.length > 0 ? categories[0].name : '',
                    description: '',
                    monthlyDeposit: '',
                    goal: '',
                    date: new Date(),
                    isRecurring: false,
                    recurringEndDate: undefined
                })
                await mutateSavings()
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף חיסכון', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add saving failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בלתי צפויה', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleAddCategory() {
        if (!newCategoryName.trim()) return

        setSubmitting(true)
        try {
            const result = await addCategory({
                name: newCategoryName.trim(),
                type: 'saving',
                color: newCategoryColor
            })

            if (result.success) {
                toast({ title: 'הצלחה', description: 'קטגוריה נוספה בהצלחה' })
                setNewCategoryName('')
                setIsAddCategoryOpen(false)
                await mutateCategories()
                // Update local state to select the new category
                const newCatName = newCategoryName.trim()
                setNewSaving(prev => ({ ...prev, category: newCatName }))
            } else {
                toast({ title: 'שגיאה', description: result.error || 'לא ניתן להוסיף קטגוריה', variant: 'destructive' })
            }
        } catch (error) {
            console.error('Add category failed:', error)
            toast({ title: 'שגיאה', description: 'אירעה שגיאה בשרת', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    async function handleDelete(id: string) {
        const result = await deleteSaving(id)
        if (result.success) {
            toast({ title: 'הצלחה', description: 'החיסכון נמחק בהצלחה' })
            await mutateSavings()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן למחוק חיסכון', variant: 'destructive' })
        }
    }

    const startEdit = (saving: any) => {
        setEditingId(saving.id)
        setEditData({
            category: saving.category || saving.type || '',
            description: saving.description,
            monthlyDeposit: saving.monthlyDeposit.toString(),
            goal: saving.goal || '',
            date: new Date(saving.date)
        })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditData({ category: '', description: '', monthlyDeposit: '', goal: '', date: new Date() })
    }

    async function handleUpdate(id: string) {
        setSubmitting(true)
        const result = await updateSaving(id, {
            category: editData.category,
            description: editData.description,
            monthlyDeposit: parseFloat(editData.monthlyDeposit),
            goal: editData.goal || undefined,
            date: editData.date
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'החיסכון עודכן בהצלחה' })
            setEditingId(null)
            await mutateSavings()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'לא ניתן לעדכן חיסכון', variant: 'destructive' })
        }
        setSubmitting(false)
    }

    const getCategoryColor = (catName: string) => {
        const cat = categories.find(c => c.name === catName)
        return cat?.color || 'bg-gray-100 text-gray-700 border-gray-200'
    }

    if (loadingSavings) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 w-full max-w-full overflow-x-hidden pb-10">
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
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="flex gap-2">
                            <select
                                className="w-full p-2 border rounded-md h-10 bg-background text-sm min-w-[120px]"
                                value={newSaving.category}
                                onChange={(e) => setNewSaving({ ...newSaving, category: e.target.value })}
                                disabled={submitting}
                            >
                                <option value="" disabled>בחר סוג</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <Popover open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4 z-50" dir="rtl">
                                    <div className="space-y-4">
                                        <h4 className="font-medium leading-none mb-4">קטגוריה חדשה</h4>
                                        <div className="space-y-2">
                                            <Input
                                                placeholder="שם הקטגוריה"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {PRESET_COLORS.map((color) => (
                                                <div
                                                    key={color.name}
                                                    className={`h-6 w-6 rounded-full cursor-pointer border-2 ${color.class.split(' ')[0]} ${newCategoryColor === color.class ? 'border-primary' : 'border-transparent'}`}
                                                    onClick={() => setNewCategoryColor(color.class)}
                                                />
                                            ))}
                                        </div>
                                        <Button onClick={handleAddCategory} className="w-full" disabled={!newCategoryName || submitting}>שמור</Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="flex-[2] min-w-[200px]">
                            <Input
                                placeholder="תיאור"
                                value={newSaving.description}
                                onChange={(e) => setNewSaving({ ...newSaving, description: e.target.value })}
                            />
                        </div>

                        <div className="flex-1 min-w-[120px]">
                            <Input
                                type="number"
                                placeholder="הפקדה חודשית"
                                className="w-full"
                                value={newSaving.monthlyDeposit}
                                onChange={(e) => setNewSaving({ ...newSaving, monthlyDeposit: e.target.value })}
                            />
                        </div>

                        <div className="flex-1 min-w-[120px]">
                            <Input
                                type="number"
                                placeholder="יעד חיסכון"
                                className="w-full"
                                value={newSaving.targetAmount}
                                onChange={(e) => setNewSaving({ ...newSaving, targetAmount: e.target.value })}
                            />
                        </div>

                        <div className="w-[140px]">
                            <DatePicker
                                date={newSaving.date}
                                setDate={(date) => setNewSaving({ ...newSaving, date: date || new Date() })}
                                placeholder="תאריך"
                            />
                        </div>

                        <Button
                            onClick={handleAdd}
                            className="gap-2 h-10 px-6"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )} הוסף
                        </Button>
                    </div>

                    <div className="flex items-start gap-4 p-4 mt-3 border rounded-lg">
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
                                <div className="space-y-2 w-[240px]">
                                    <label className="text-xs font-medium">תאריך סיום</label>
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
                            savings.map((saving: any) => (
                                <div
                                    key={saving.id}
                                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-accent transition-colors gap-3"
                                >
                                    {editingId === saving.id ? (
                                        <>
                                            <div className="flex flex-nowrap gap-2 items-center flex-1 w-full overflow-x-auto pb-1">
                                                <select
                                                    className="p-2 border rounded-md bg-background h-10 text-sm min-w-[120px]"
                                                    value={editData.category}
                                                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                    ))}
                                                </select>
                                                <Input
                                                    className="flex-1 min-w-[150px]"
                                                    value={editData.description}
                                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                                />
                                                <Input
                                                    className="w-24 sm:w-32 flex-shrink-0"
                                                    type="number"
                                                    value={editData.monthlyDeposit}
                                                    onChange={(e) => setEditData({ ...editData, monthlyDeposit: e.target.value })}
                                                />
                                                <Input
                                                    className="w-32 flex-shrink-0"
                                                    value={editData.goal}
                                                    onChange={(e) => setEditData({ ...editData, goal: e.target.value })}
                                                    placeholder="מטרה"
                                                />
                                                <div className="w-[140px] flex-shrink-0">
                                                    <DatePicker
                                                        date={editData.date}
                                                        setDate={(date) => setEditData({ ...editData, date: date || new Date() })}
                                                        placeholder="תאריך"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
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
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(saving.category || saving.type)}`}>
                                                        {saving.category || saving.type}
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