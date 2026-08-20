'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { PRESET_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { BusinessProjectFormData } from '@/lib/actions/business-projects'

interface ClientOption {
    id: string
    name: string
}

interface ProjectOption {
    id: string
    name: string
    parentId: string | null
}

interface BusinessProjectFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: BusinessProjectFormData) => Promise<void>
    initialData?: {
        id?: string
        name: string
        description?: string | null
        color?: string | null
        status?: string
        budget?: number | null
        startDate?: Date | null
        endDate?: Date | null
        clientId?: string | null
        parentId?: string | null
    }
    clients: ClientOption[]
    projects: ProjectOption[]
    isEdit?: boolean
}

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'פעיל', color: 'bg-green-500' },
    { value: 'COMPLETED', label: 'הושלם', color: 'bg-blue-500' },
    { value: 'ON_HOLD', label: 'בהמתנה', color: 'bg-amber-500' },
    { value: 'CANCELLED', label: 'בוטל', color: 'bg-red-500' },
]

export function BusinessProjectFormDialog({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    clients,
    projects,
    isEdit = false,
}: BusinessProjectFormDialogProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState(PRESET_COLORS[1].hex) // Blue default
    const [status, setStatus] = useState<'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'>('ACTIVE')
    const [budget, setBudget] = useState<number | null>(null)
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [clientId, setClientId] = useState<string>('')
    const [parentId, setParentId] = useState<string>('')
    const [submitting, setSubmitting] = useState(false)
    const [clientSearch, setClientSearch] = useState('')

    // Available parent projects (exclude self and children)
    const availableParents = projects.filter(p => {
        if (initialData?.id && p.id === initialData.id) return false
        if (p.parentId !== null) return false // Only top-level can be parents
        return true
    })

    // Filtered clients based on search
    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    )

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name || '')
            setDescription(initialData.description || '')
            setColor(initialData.color || PRESET_COLORS[1].hex)
            setStatus((initialData.status as any) || 'ACTIVE')
            setBudget(initialData.budget || null)
            setStartDate(initialData.startDate ? new Date(initialData.startDate) : undefined)
            setEndDate(initialData.endDate ? new Date(initialData.endDate) : undefined)
            setClientId(initialData.clientId || 'none')
            setParentId(initialData.parentId || 'none')
        } else if (isOpen) {
            resetForm()
        }
    }, [isOpen, initialData])

    const resetForm = () => {
        setName('')
        setDescription('')
        setColor(PRESET_COLORS[1].hex)
        setStatus('ACTIVE')
        setBudget(null)
        setStartDate(undefined)
        setEndDate(undefined)
        setClientId('none')
        setParentId('none')
        setClientSearch('')
    }

    const handleSubmit = async () => {
        if (!name.trim()) return

        setSubmitting(true)
        try {
            await onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
                color,
                status,
                budget,
                startDate: startDate || null,
                endDate: endDate || null,
                clientId: clientId === 'none' ? null : (clientId || null),
                parentId: parentId === 'none' ? null : (parentId || null),
            })
            onClose()
            resetForm()
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {isEdit ? 'עריכת פרויקט' : 'פרויקט חדש'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'עדכן את פרטי הפרויקט'
                            : 'צור פרויקט עסקי חדש לניהול הכנסות והוצאות'
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                    {/* Project Name */}
                    <div className="space-y-2">
                        <Label htmlFor="project-name">שם הפרויקט *</Label>
                        <Input
                            id="project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="לדוגמה: פיתוח אתר, קמפיין שיווקי..."
                            className="text-right"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="project-desc">תיאור</Label>
                        <Textarea
                            id="project-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="תיאור קצר של הפרויקט..."
                            className="text-right resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Client Selection */}
                    <div className="space-y-2">
                        <Label>לקוח</Label>
                        <Select value={clientId} onValueChange={setClientId}>
                            <SelectTrigger className="text-right">
                                <SelectValue placeholder="בחר לקוח (אופציונלי)" />
                            </SelectTrigger>
                            <SelectContent>
                                <div className="p-2">
                                    <Input
                                        placeholder="חפש לקוח..."
                                        value={clientSearch}
                                        onChange={(e) => setClientSearch(e.target.value)}
                                        className="text-right h-8 text-sm"
                                    />
                                </div>
                                <SelectItem value="none">ללא לקוח</SelectItem>
                                {filteredClients.map((client) => (
                                    <SelectItem key={client.id} value={client.id}>
                                        {client.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Parent Project */}
                    {availableParents.length > 0 && (
                        <div className="space-y-2">
                            <Label>פרויקט אב</Label>
                            <Select key={`${parentId}-${availableParents.length}`} value={parentId} onValueChange={setParentId}>
                                <SelectTrigger className="text-right">
                                    <SelectValue placeholder="בחר פרויקט אב (אופציונלי)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">ללא - פרויקט ראשי</SelectItem>
                                    {availableParents.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Budget & Status Row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-budget">תקציב מתוכנן</Label>
                            <FormattedNumberInput
                                id="project-budget"
                                value={budget || 0}
                                onChange={() => {}}
                                onValueChange={(val) => setBudget(val || null)}
                                placeholder="0"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>סטטוס</Label>
                            <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                                <SelectTrigger className="text-right">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-2 h-2 rounded-full", opt.color)} />
                                                {opt.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>תאריך התחלה</Label>
                            <DatePicker
                                date={startDate}
                                setDate={(d: Date | undefined) => setStartDate(d)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>תאריך סיום</Label>
                            <DatePicker
                                date={endDate}
                                setDate={(d: Date | undefined) => setEndDate(d)}
                            />
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-2">
                        <Label>צבע</Label>
                        <div className="grid grid-cols-9 gap-2">
                            {PRESET_COLORS.map((c) => (
                                <button
                                    key={c.hex}
                                    type="button"
                                    onClick={() => setColor(c.hex)}
                                    className={cn(
                                        "w-8 h-8 rounded-full transition-all ring-offset-2 ring-offset-background",
                                        color === c.hex ? "ring-2 ring-primary scale-110" : "hover:scale-105"
                                    )}
                                    style={{ backgroundColor: c.hex }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        ביטול
                    </Button>
                    <Button onClick={handleSubmit} disabled={!name.trim() || submitting}>
                        {submitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                        {isEdit ? 'שמור שינויים' : 'צור פרויקט'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
