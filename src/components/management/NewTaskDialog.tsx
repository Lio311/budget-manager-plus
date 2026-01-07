'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Plus, Loader2, CalendarIcon } from 'lucide-react'
import { updateTask, createTask } from '@/lib/actions/management'
import { Priority, Department } from '@prisma/client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TEAM_MEMBERS = [
    { name: 'Lior', avatar: '/lior-profile.jpg', color: 'blue' },
    { name: 'Ron', avatar: '/team/ron.png', color: 'green' },
    { name: 'Leon', avatar: '/avatars/leon.png', color: 'purple' },
]

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
        description: taskToEdit?.description || '',
        priority: (taskToEdit?.priority || 'MEDIUM') as Priority,
        department: (taskToEdit?.department || 'DEV') as Department,
        assignees: taskToEdit?.assignees || [],
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
                    description: formData.description,
                    priority: formData.priority,
                    department: formData.department,
                    assignees: formData.assignees,
                    dueDate: formData.dueDate
                })
            } else {
                res = await createTask({
                    title: formData.title,
                    description: formData.description,
                    priority: formData.priority,
                    department: formData.department,
                    status: 'TODO',
                    assignees: formData.assignees,
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
                    setFormData({ title: '', description: '', priority: 'MEDIUM', department: 'DEV', assignees: [], dueDate: undefined })
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

                    <div className="space-y-2">
                        <Label className="text-right block">תיאור/הערות (אופציונלי)</Label>
                        <Textarea
                            placeholder="פרטים נוספים..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-gray-50/50 resize-y min-h-[80px]"
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
                                <SelectContent>
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
                                <SelectContent>
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
                            <PopoverContent className="w-auto p-0" align="center" side="bottom" sideOffset={8}>
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
                        <Label className="text-right block">אחראים (ניתן לבחור יותר מאחד)</Label>
                        <div className="flex gap-2 justify-end">
                            <ToggleGroup type="multiple" value={formData.assignees} onValueChange={(val: string[]) => setFormData({ ...formData, assignees: val })}>
                                {TEAM_MEMBERS.map((member) => (
                                    <ToggleGroupItem
                                        key={member.name}
                                        value={member.name}
                                        aria-label={`Toggle ${member.name}`}
                                        className={cn(
                                            "p-1 h-auto rounded-full transition-all",
                                            `data-[state=on]:bg-${member.color}-100 data-[state=on]:ring-2 data-[state=on]:ring-${member.color}-500`
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm overflow-hidden border-2 border-white shadow-sm",
                                            `bg-gradient-to-br from-${member.color}-400 to-${member.color}-600`
                                        )}>
                                            <img
                                                src={member.avatar}
                                                alt={member.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to initial if image fails
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                    (e.target as HTMLImageElement).parentElement!.textContent = member.name.charAt(0);
                                                }}
                                            />
                                        </div>
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>                                    </div>
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

