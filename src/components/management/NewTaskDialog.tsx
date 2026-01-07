'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Loader2, CalendarIcon } from 'lucide-react'
import { updateTask } from '@/lib/actions/management'

// ... imports

export function NewTaskDialog({ onTaskCreated, taskToEdit, open: controlledOpen, onOpenChange }: {
    onTaskCreated?: (task: any) => void;
    taskToEdit?: any;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    const [internalOpen, setInternalOpen] = useState(false)
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setOpen = onOpenChange || setInternalOpen

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: taskToEdit?.title || '',
        priority: (taskToEdit?.priority || 'MEDIUM') as Priority,
        department: (taskToEdit?.department || 'DEV') as Department,
        assignee: taskToEdit?.assignee || '',
        dueDate: taskToEdit?.dueDate ? new Date(taskToEdit.dueDate) : undefined
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            let res;
            if (taskToEdit) {
                res = await updateTask(taskToEdit.id, {
                    title: formData.title,
                    priority: formData.priority,
                    department: formData.department,
                    assignee: formData.assignee || null,
                    dueDate: formData.dueDate
                })
            } else {
                res = await createTask({
                    title: formData.title,
                    priority: formData.priority,
                    department: formData.department,
                    status: 'TODO',
                    assignee: formData.assignee || undefined,
                    dueDate: formData.dueDate
                })
            }

            if (res.success) {
                toast.success(taskToEdit ? 'המשימה עודכנה בהצלחה' : 'המשימה נוצרה בהצלחה')
                if (onTaskCreated && res.data) {
                    onTaskCreated(res.data)
                }
                setOpen(false)
                if (!taskToEdit) {
                    setFormData({ title: '', priority: 'MEDIUM', department: 'DEV', assignee: '', dueDate: undefined })
                }
            } else {
                toast.error('שגיאה בשמירת המשימה')
            }
        } catch (error) {
            toast.error('שגיאה לא צפויה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!taskToEdit && (
                <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 gap-2">
                        <Plus size={18} className="order-last" />
                        <span>משימה חדשה</span>
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>{taskToEdit ? 'ערוך משימה' : 'צור משימה חדשה'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* ... (rest of form fields stay mostly same, just verify values) ... */}
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
                        <Label className="text-right block">תאריך יעד (אופציונלי)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-right font-normal",
                                        !formData.dueDate && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                    {formData.dueDate ? format(formData.dueDate, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={formData.dueDate}
                                    onSelect={(date) => setFormData({ ...formData, dueDate: date })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-right block">אחראי (אופציונלי)</Label>
                        <Select
                            value={formData.assignee}
                            onValueChange={(val) => setFormData({ ...formData, assignee: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="בחר אחראי" />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="Lior">Lior</SelectItem>
                                <SelectItem value="Ron">Ron</SelectItem>
                                <SelectItem value="Leon">Leon</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                            {taskToEdit ? 'שמור שינויים' : 'צור משימה'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

