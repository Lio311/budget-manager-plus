'use client'

import useSWR from 'swr'
import { useState } from 'react'
import { Plus, Trash2, Pencil, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { getCategories, addCategory, updateCategory, deleteCategory } from '@/lib/actions/category'
import { PRESET_COLORS } from '@/lib/constants'
import { useBudget } from '@/contexts/BudgetContext'
import { useConfirm } from '@/hooks/useConfirm'

interface Category {
    id: string
    name: string
    type: string
    color: string | null
}

export function CategoryManager() {
    const { toast } = useToast()
    const { budgetType } = useBudget()
    const [activeTab, setActiveTab] = useState('expense')
    const confirm = useConfirm()

    // Data Fetching
    const fetcher = async () => {
        const result = await getCategories(activeTab, budgetType as 'PERSONAL' | 'BUSINESS')
        if (result.success && result.data) return result.data
        return []
    }

    const { data: categories = [], mutate, isLoading } = useSWR<Category[]>(
        ['categories', activeTab, budgetType],
        fetcher
    )

    // State
    const [newItemName, setNewItemName] = useState('')
    const [newItemColor, setNewItemColor] = useState(PRESET_COLORS[0].class)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('')

    // Actions
    async function handleAdd() {
        if (!newItemName.trim()) return

        setIsSubmitting(true)
        const result = await addCategory({
            name: newItemName.trim(),
            type: activeTab,
            color: newItemColor,
            scope: budgetType as 'PERSONAL' | 'BUSINESS'
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'הקטגוריה נוספה בהצלחה' })
            setNewItemName('')
            await mutate()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'נכשל בהוספת קטגוריה', variant: 'destructive' })
        }
        setIsSubmitting(false)
    }

    async function handleUpdate(id: string) {
        if (!editName.trim()) return

        setIsSubmitting(true)
        const result = await updateCategory(id, {
            name: editName.trim(),
            color: editColor
        })

        if (result.success) {
            toast({ title: 'הצלחה', description: 'הקטגוריה עודכנה בהצלחה' })
            setEditingId(null)
            await mutate()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'נכשל בעדכון קטגוריה', variant: 'destructive' })
        }
        setIsSubmitting(false)
    }

    async function handleDelete(id: string) {
        const confirmed = await confirm('האם אתה בטוח שברצונך למחוק קטגוריה זו?', 'מחיקת קטגוריה')
        if (!confirmed) return
        const result = await deleteCategory(id)
        if (result.success) {
            toast({ title: 'הצלחה', description: 'הקטגוריה נמחקה בהצלחה' })
            await mutate()
        } else {
            toast({ title: 'שגיאה', description: result.error || 'נכשל במחיקת קטגוריה', variant: 'destructive' })
        }
    }

    const startEdit = (cat: Category) => {
        setEditingId(cat.id)
        setEditName(cat.name)
        setEditColor(cat.color || PRESET_COLORS[0].class)
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditName('')
        setEditColor('')
    }

    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    return (
        <div className="w-full h-full flex flex-col" dir="rtl">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="expense">{budgetType === 'BUSINESS' ? 'עלויות' : 'הוצאות'}</TabsTrigger>
                    <TabsTrigger value="income">{budgetType === 'BUSINESS' ? 'מכירות' : 'הכנסות'}</TabsTrigger>
                    <TabsTrigger value="saving">חסכונות</TabsTrigger>
                </TabsList>

                {/* Add New Section */}
                <div className="mb-4 p-4 border rounded-lg bg-gray-50 dark:bg-slate-800 dark:border-slate-700 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={handleAdd} disabled={!newItemName.trim() || isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            <span className="mr-2">הוסף למאגר</span>
                        </Button>
                        <Input
                            placeholder="שם קטגוריה חדשה"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            className="flex-1 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                        />
                    </div>

                    {/* Color Picker Grid */}
                    <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
                        {PRESET_COLORS.map((color) => (
                            <div
                                key={color.name}
                                className={`h-8 w-8 sm:h-6 sm:w-6 rounded-full cursor-pointer border-2 transition-all ${color.class.split(' ')[0]} ${newItemColor === color.class ? 'border-primary scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                                    }`}
                                onClick={() => setNewItemColor(color.class)}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {categories.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">אין קטגוריות זמינות</p>
                            ) : (
                                categories.map((cat) => (
                                    <div key={cat.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700 hover:shadow-sm transition-shadow gap-2">
                                        {editingId === cat.id ? (
                                            <div className="flex flex-col sm:flex-row gap-3 w-full items-center">
                                                <div className="flex-1 w-full space-y-2">
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="h-8 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-1 flex-wrap justify-center sm:justify-start">
                                                        {PRESET_COLORS.map((color) => (
                                                            <div
                                                                key={`edit-${color.name}`}
                                                                className={`h-6 w-6 sm:h-5 sm:w-5 rounded-full cursor-pointer border-2 ${color.class.split(' ')[0]} ${editColor === color.class ? 'border-primary' : 'border-transparent'
                                                                    }`}
                                                                onClick={() => setEditColor(color.class)}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 shrink-0 w-full sm:w-auto justify-end">
                                                    <Button size="sm" onClick={() => handleUpdate(cat.id)} disabled={isSubmitting}>
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={cancelEdit}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-4 w-4 rounded-full ${cat.color?.split(' ')[0] || 'bg-gray-200'}`} />
                                                    <span className="font-medium dark:text-gray-100">{cat.name}</span>
                                                </div>
                                                <div className="flex gap-1 items-center justify-end w-full sm:w-auto">
                                                    <Button size="sm" variant="ghost" onClick={() => startEdit(cat)}>
                                                        <Pencil className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                        onClick={() => handleDelete(cat.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </Tabs>
        </div>
    )
}
