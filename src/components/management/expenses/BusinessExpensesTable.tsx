'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Search, Filter, Loader2, Calendar as CalendarIcon, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { createBusinessExpense, deleteBusinessExpense, updateBusinessExpense } from '@/lib/actions/business-expenses'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

export function BusinessExpensesTable({
    initialExpenses
}: {
    initialExpenses: any[]
}) {
    const [expenses, setExpenses] = useState(initialExpenses)
    const [search, setSearch] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [editingExpense, setEditingExpense] = useState<any | null>(null)

    // New Expense Form State
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'פיתוח',
        date: new Date(),
        responsibles: ['RON']
    })

    const categories = ['פיתוח', 'אבטחה', 'בדיקות', 'שיווק', 'פיתוח עסקי', 'General', 'Marketing', 'Hosting', 'Legal', 'Office']

    // Team Member Data
    const TEAM_MEMBERS: Record<string, { name: string, avatar: string, color: string }> = {
        'RON': { name: 'רון', avatar: '/images/team/ron.png', color: 'bg-indigo-500' },
        'LEON': { name: 'לאון', avatar: '/images/team/leon.png', color: 'bg-orange-500' },
        'LIOR': { name: 'ליאור', avatar: '/images/team/lior-profile.jpg', color: 'bg-blue-500' },
    }

    const calculateSplit = (amount: number, responsibles: string[]) => {
        const split: Record<string, number> = { 'RON': 0, 'LEON': 0, 'LIOR': 0 }

        if (!responsibles || responsibles.length === 0) {
            split['RON'] = amount // Default to Ron
            return split
        }

        if (responsibles.length === 1) {
            split[responsibles[0]] = amount
            return split
        }

        const hasRon = responsibles.includes('RON')
        const hasLeon = responsibles.includes('LEON')
        const hasLior = responsibles.includes('LIOR')

        // Specific Rules
        if (hasRon && hasLeon && responsibles.length === 2) {
            split['RON'] = amount * 0.70
            split['LEON'] = amount * 0.30
            return split
        }

        if (hasRon && hasLeon && hasLior && responsibles.length === 3) {
            split['RON'] = amount * 0.40
            split['LIOR'] = amount * 0.40
            split['LEON'] = amount * 0.20
            return split
        }

        // Fallback: Equal Split
        const share = amount / responsibles.length
        responsibles.forEach(p => {
            split[p] = share
        })
        return split
    }

    // Calculate Totals per Person
    const personTotals = filteredExpenses.reduce((acc, expense) => {
        const split = calculateSplit(expense.amount, expense.responsibles || ['RON'])
        acc['RON'] += split['RON'] || 0
        acc['LEON'] += split['LEON'] || 0
        acc['LIOR'] += split['LIOR'] || 0
        return acc
    }, { 'RON': 0, 'LEON': 0, 'LIOR': 0 })


    const categoryMap: Record<string, string> = {
        'Marketing': 'שיווק',
        'General': 'כללי',
        'Hosting': 'אחסון/שרתים',
        'Legal': 'משפטי',
        'Office': 'משרדי',
        'Development': 'פיתוח',
        'Security': 'אבטחה',
        'QA': 'בדיקות',
        'BizDev': 'פיתוח עסקי'
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await createBusinessExpense({
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: formData.date,
                responsibles: formData.responsibles
            })

            if (res.success) {
                toast.success('ההוצאה נוספה בהצלחה')
                setExpenses([res.data, ...expenses])
                setIsDialogOpen(false)
                setFormData({
                    description: '',
                    amount: '',
                    category: 'Marketing',
                    date: new Date(),
                    responsibles: ['RON']
                })
            } else {
                toast.error('שגיאה בהוספת ההוצאה')
            }
        } catch (error) {
            toast.error('שגיאה לא צפויה')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingExpense) return
        setLoading(true)

        try {
            const res = await updateBusinessExpense(editingExpense.id, {
                description: formData.description,
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: formData.date,
                responsibles: formData.responsibles
            })

            if (res.success) {
                toast.success('ההוצאה עודכנה בהצלחה')
                setExpenses(expenses.map(e => e.id === editingExpense.id ? res.data : e))
                setIsDialogOpen(false)
                setEditingExpense(null)
                setFormData({
                    description: '',
                    amount: '',
                    category: 'Marketing',
                    date: new Date(),
                    responsibles: ['RON']
                })
            } else {
                toast.error('שגיאה בעדכון ההוצאה')
            }
        } catch (error) {
            toast.error('שגיאה לא צפויה')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('האם אתה בטוח שברצונך למחוק הוצאה זו?')) return

        const oldExpenses = [...expenses]
        setExpenses(expenses.filter(e => e.id !== id))

        const res = await deleteBusinessExpense(id)
        if (!res.success) {
            toast.error('שגיאה במחיקת ההוצאה')
            setExpenses(oldExpenses)
        } else {
            toast.success('ההוצאה נמחקה')
        }
    }

    const handleEdit = (expense: any) => {
        setEditingExpense(expense)
        setFormData({
            description: expense.description,
            amount: expense.amount.toString(),
            category: expense.category,
            date: new Date(expense.date),
            responsibles: expense.responsibles || ['RON']
        })
        setIsDialogOpen(true)
    }

    const filteredExpenses = expenses.filter(e => {
        const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
            e.category.toLowerCase().includes(search.toLowerCase())
        const matchCategory = categoryFilter === 'ALL' || e.category === categoryFilter
        return matchSearch && matchCategory
    })

    const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{filteredExpenses.length}</div>
                        <p className="text-xs text-muted-foreground">סה״כ הוצאות</p>
                    </CardContent>
                </Card>

                {/* Individual Person Cards */}
                {['RON', 'LEON', 'LIOR'].map(personKey => (
                    <Card key={personKey} className="relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-1 h-full ${TEAM_MEMBERS[personKey].color}`} />
                        <CardContent className="pt-6 flex justify-between items-center">
                            <div>
                                <div className="text-2xl font-bold">₪{Math.round(personTotals[personKey as keyof typeof personTotals]).toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">{TEAM_MEMBERS[personKey].name}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                <img
                                    src={TEAM_MEMBERS[personKey].avatar}
                                    alt={TEAM_MEMBERS[personKey].name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-yellow-500 hover:bg-yellow-600 text-white gap-2 font-bold shadow-sm">
                                <Plus size={16} />
                                הוצאה חדשה
                            </Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                            <DialogHeader className="text-right">
                                <DialogTitle>{editingExpense ? 'עריכת הוצאה' : 'הוספת הוצאה עסקית'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={editingExpense ? handleUpdate : handleCreate} className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label className="text-right block">תיאור</Label>
                                    <Input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="לדוגמה: תשלום לשרתים"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-right block">סכום (₪)</Label>
                                        <Input
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-right block">קטגוריה</Label>
                                        <Select
                                            value={formData.category}
                                            onValueChange={val => setFormData({ ...formData, category: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent dir="rtl" className="text-right min-w-[150px]">
                                                {categories.map(c => (
                                                    <SelectItem key={c} value={c} className="pr-8">{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-right block">תאריך</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-right font-normal",
                                                    !formData.date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="ml-2 h-4 w-4" />
                                                {formData.date ? format(formData.date, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={formData.date}
                                                onSelect={(date) => date && setFormData({ ...formData, date })}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-right block mb-2">אחריות (חלוקת הוצאה)</Label>
                                    <div className="flex gap-4 justify-start" dir="rtl"> {/* Align Right (RTL Start) */}
                                        {['RON', 'LEON', 'LIOR'].map((person) => {
                                            const isSelected = formData.responsibles?.includes(person)
                                            return (
                                                <div
                                                    key={person}
                                                    onClick={() => {
                                                        const current = formData.responsibles || ['RON']
                                                        let next = []
                                                        if (current.includes(person)) {
                                                            if (current.length === 1) return // Prevent empty
                                                            next = current.filter(p => p !== person)
                                                        } else {
                                                            next = [...current, person]
                                                        }
                                                        setFormData({ ...formData, responsibles: next })
                                                    }}
                                                    className={`
                                                         cursor-pointer flex flex-col items-center gap-2 transition-all p-2 rounded-xl border-2
                                                         ${isSelected
                                                            ? 'border-blue-500 bg-blue-50 scale-105'
                                                            : 'border-transparent hover:bg-gray-50 opacity-60 hover:opacity-100'
                                                        }
                                                     `}
                                                >
                                                    <div className={`
                                                         w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm text-white shadow-sm border-2
                                                         ${isSelected ? 'border-blue-500' : 'border-transparent'}
                                                     `}>
                                                        <img
                                                            src={TEAM_MEMBERS[person].avatar}
                                                            alt={TEAM_MEMBERS[person].name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-600">
                                                        {TEAM_MEMBERS[person].name}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    {editingExpense && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingExpense(null)
                                                setIsDialogOpen(false)
                                                setFormData({
                                                    description: '',
                                                    amount: '',
                                                    category: 'פיתוח',
                                                    date: new Date(),
                                                    responsibles: ['RON']
                                                })
                                            }}
                                        >
                                            ביטול
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={loading} className="bg-blue-600">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                                        {editingExpense ? 'עדכן הוצאה' : 'שמור הוצאה'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="חיפוש..."
                            className="pl-10 pr-4 w-40 sm:w-64 bg-gray-50 border-gray-200 text-right"
                            dir="rtl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[150px] h-9 gap-2">
                            <Filter size={16} className="text-gray-500" />
                            <SelectValue placeholder="סינון" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="text-right min-w-[150px]">
                            <SelectItem value="ALL" className="pr-8">כל הקטגוריות</SelectItem>
                            {categories.map(c => (
                                <SelectItem key={c} value={c} className="pr-8">{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader className="bg-gray-50">
                        <TableRow>
                            <TableHead className="text-right">תאריך</TableHead>
                            <TableHead className="text-right">תיאור</TableHead>
                            <TableHead className="text-right">קטגוריה</TableHead>
                            <TableHead className="text-center">קמפיין מקושר</TableHead>
                            <TableHead className="text-center">חברי צוות</TableHead>
                            <TableHead className="text-right">סכום</TableHead>
                            <TableHead className="text-center w-[100px]">פעולות</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredExpenses.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                    לא נמצאו הוצאות
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredExpenses.map((expense) => (
                                <TableRow key={expense.id} className="group">
                                    <TableCell>{format(new Date(expense.date), 'dd/MM/yyyy')}</TableCell>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                            {categoryMap[expense.category] || expense.category}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm text-center">
                                        {expense.campaign ? expense.campaign.name : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex justify-center -space-x-2 space-x-reverse">
                                            {(expense.responsibles || ['RON']).map((r: string) => (
                                                <div key={r} className="w-6 h-6 rounded-full border border-white overflow-hidden" title={TEAM_MEMBERS[r]?.name}>
                                                    <img
                                                        src={TEAM_MEMBERS[r]?.avatar}
                                                        alt={TEAM_MEMBERS[r]?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-900">
                                        ₪{expense.amount.toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                onClick={() => handleEdit(expense)}
                                                title="ערוך"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                onClick={() => handleDelete(expense.id)}
                                                title="מחק"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
