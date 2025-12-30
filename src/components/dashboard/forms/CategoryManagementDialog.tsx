'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Settings, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { PRESET_COLORS } from '@/lib/constants'
import { addCategory, updateCategory, deleteCategory } from '@/lib/actions/category'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Category {
    id: string
    name: string
    color: string | null
    isDefault?: boolean
}

interface CategoryManagementDialogProps {
    categories: Category[]
    type: 'expense' | 'income' | 'saving'
    scope?: 'PERSONAL' | 'BUSINESS'
    onChange: () => void
    trigger?: React.ReactNode
}

export function CategoryManagementDialog({ categories, type, scope = 'PERSONAL', onChange, trigger }: CategoryManagementDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [newItemName, setNewItemName] = useState('')
    const [newItemColor, setNewItemColor] = useState(PRESET_COLORS[0].class)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [editingId, setEditingId] = useState<string | null>(null)
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('')

    async function handleAdd() {
        if (!newItemName.trim()) return

        setIsSubmitting(true)
        try {
            const result = await addCategory({
                name: newItemName.trim(),
                type,
                color: newItemColor,
                scope
            })

            if (result.success) {
                toast.success('קטגוריה נוספה בהצלחה')
                setNewItemName('')
                onChange()
            } else {
                toast.error(result.error || 'שגיאה בהוספת קטגוריה')
            }
        } catch (error) {
            toast.error('שגיאה בשרת')
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleUpdate(id: string) {
        if (!editName.trim()) return

        try {
            const result = await updateCategory(id, {
                name: editName.trim(),
                color: editColor
            })

            if (result.success) {
                toast.success('קטגוריה עודכנה')
                setEditingId(null)
                onChange()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('שגיאה בעדכון')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('האם ברצונך למחוק את הקטגוריה? כל ההוצאות המקושרות לה ימחקו לאחר מכן')) return

        try {
            const result = await deleteCategory(id)
            if (result.success) {
                toast.success('קטגוריה נמחקה')
                onChange()
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('שגיאה במחיקה')
        }
    }

    function startEdit(cat: Category) {
        setEditingId(cat.id)
        setEditName(cat.name)
        setEditColor(cat.color || PRESET_COLORS[0].class)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="icon" className="shrink-0 h-10 w-10">
                        <Settings className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md w-[95%] rounded-xl" dir="rtl">
                <DialogTitle className="text-lg font-bold mb-4">ניהול קטגוריות</DialogTitle>

                {/* Add New Section */}
                <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-100">
                    <h4 className="text-sm font-medium mb-3 text-gray-700">הוספת חדש</h4>
                    <div className="flex gap-2 mb-3">
                        <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="שם הקטגוריה..."
                            className="bg-white"
                        />
                        <Button onClick={handleAdd} disabled={!newItemName.trim() || isSubmitting} className="shrink-0">
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        </Button>
                    </div>
                    {/* Color Picker */}
                    <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color.name}
                                onClick={() => setNewItemColor(color.class)}
                                className={cn(
                                    "h-6 w-6 rounded-full border-2 transition-all",
                                    color.class.split(' ')[0], // bg-color
                                    newItemColor === color.class ? "border-gray-900 scale-110" : "border-transparent hover:scale-110"
                                )}
                            />
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                    <h4 className="text-sm font-medium mb-2 text-gray-700">קיים במערכת ({categories.length})</h4>
                    {categories.map(cat => (
                        <div key={cat.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-colors group">
                            {editingId === cat.id ? (
                                <div className="flex items-center gap-2 flex-1 w-full animate-in fade-in">
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="h-8 text-sm"
                                        autoFocus
                                    />
                                    <div className="flex items-center gap-1">
                                        <Button size="icon" variant="ghost" onClick={() => handleUpdate(cat.id)} className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50">
                                            <Check className="h-4 w-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-gray-400 hover:text-gray-600">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("h-3 w-3 rounded-full", cat.color?.split(' ')[0] || 'bg-gray-400')} />
                                        <span className={cn("text-sm", cat.isDefault && "font-medium")}>
                                            {cat.name}
                                            {cat.isDefault && <span className="mr-2 text-[10px] text-gray-400 font-normal bg-gray-100 px-1.5 py-0.5 rounded-full">ברירת מחדל</span>}
                                        </span>
                                    </div>

                                    {!cat.isDefault && (
                                        <div className="flex items-center gap-1">
                                            <Button size="icon" variant="ghost" onClick={() => startEdit(cat)} className="h-7 w-7 text-gray-400 hover:text-blue-600">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button size="icon" variant="ghost" onClick={() => handleDelete(cat.id)} className="h-7 w-7 text-gray-400 hover:text-red-600">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    )
}
