'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'
import { createTask } from '@/lib/actions/management'
import { toast } from 'sonner'
import { TaskStatus, Priority, Department } from '@prisma/client'

export function NewTaskDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        priority: 'MEDIUM' as Priority,
        department: 'DEV' as Department,
        assignee: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await createTask({
                title: formData.title,
                priority: formData.priority,
                department: formData.department,
                status: 'TODO',
                assignee: formData.assignee || undefined
            })

            if (res.success) {
                toast.success('המשימה נוצרה בהצלחה')
                setOpen(false)
                setFormData({ title: '', priority: 'MEDIUM', department: 'DEV', assignee: '' })
            } else {
                toast.error('שגיאה ביצירת המשימה')
            }
        } catch (error) {
            toast.error('שגיאה לא צפויה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 gap-2">
                    <Plus size={18} className="order-last" /> {/* RTL: Icon on left visually if order-last? No, order-last makes it right in LTR. In RTL environment, we want icon to left of text. Text is First, Icon Second. So default Flex is Row. In RTL, first item is Right. So Text Right, Icon Left. We want Icon Left. So Icon should be second in DOM? No. Flex row in RTL: First item maps to Right. Second item maps to Left. So: [Text, Icon] -> Text (R), Icon (L). */}
                    <span>משימה חדשה</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>צור משימה חדשה</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label className="text-right block">כותרת המשימה</Label>
                        <Input
                            placeholder="מה צריך לעשות?"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-right block">עדיפות</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(val) => setFormData({ ...formData, priority: val as Priority })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="LOW">נמוכה</SelectItem>
                                    <SelectItem value="MEDIUM">בינונית</SelectItem>
                                    <SelectItem value="HIGH">גבוהה</SelectItem>
                                    <SelectItem value="CRITICAL">קריטית</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block">מחלקה</Label>
                            <Select
                                value={formData.department}
                                onValueChange={(val) => setFormData({ ...formData, department: val as Department })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="DEV">פיתוח</SelectItem>
                                    <SelectItem value="SECURITY">אבטחה</SelectItem>
                                    <SelectItem value="QA">בדיקות</SelectItem>
                                    <SelectItem value="MARKETING">שיווק</SelectItem>
                                    <SelectItem value="BIZ_DEV">פיתוח עסקי</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-right block">אחראי (אופציונלי)</Label>
                        <Input
                            placeholder="שם האחראי..."
                            value={formData.assignee}
                            onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                            צור משימה
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
