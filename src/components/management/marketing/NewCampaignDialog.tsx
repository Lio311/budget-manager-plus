'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { createCampaign } from '@/lib/actions/marketing'
import { toast } from 'sonner'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'

export function NewCampaignDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        type: 'SOCIAL', // Default
        priority: 'MEDIUM',
        status: 'ACTIVE',
        cost: '',
        currency: 'ILS',
        paymentMethod: '',
        notes: '',
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await createCampaign({
                ...formData,
                cost: formData.cost ? parseFloat(formData.cost) : 0
            })

            if (res.success) {
                toast.success('הקמפיין נוצר בהצלחה')
                setOpen(false)
                setFormData({
                    name: '',
                    type: 'SOCIAL',
                    priority: 'MEDIUM',
                    status: 'ACTIVE',
                    cost: '',
                    currency: 'ILS',
                    paymentMethod: '',
                    notes: '',
                    startDate: undefined,
                    endDate: undefined
                })
            } else {
                toast.error('שגיאה ביצירת הקמפיין')
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
                <Button className="bg-pink-600 hover:bg-pink-700 text-white gap-2">
                    <Plus size={18} />
                    קמפיין חדש
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader className="text-right">
                    <DialogTitle>הוספת קמפיין שיווקי</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-right block">שם הקמפיין</Label>
                            <Input
                                placeholder="לדוגמה: קמפיין פייסבוק חורף"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block">סוג פעילות</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val) => setFormData({ ...formData, type: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="SOCIAL">Social Media</SelectItem>
                                    <SelectItem value="PPC">PPC / ממומן</SelectItem>
                                    <SelectItem value="COLLABORATION">שיתוף פעולה</SelectItem>
                                    <SelectItem value="INFLUENCER">משפיענים</SelectItem>
                                    <SelectItem value="PR">יח"צ</SelectItem>
                                    <SelectItem value="EMAIL">Email Marketing</SelectItem>
                                    <SelectItem value="OTHER">אחר</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-right block">תאריך התחלה</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-right font-normal",
                                            !formData.startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {formData.startDate ? format(formData.startDate, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={formData.startDate}
                                        onSelect={(date) => setFormData({ ...formData, startDate: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block">תאריך סיום (אופציונלי)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-right font-normal",
                                            !formData.endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                        {formData.endDate ? format(formData.endDate, "PPP", { locale: he }) : <span>בחר תאריך</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={formData.endDate}
                                        onSelect={(date) => setFormData({ ...formData, endDate: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label className="text-right block">תקציב / עלות</Label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                />
                                <span className="absolute left-3 top-2.5 text-gray-400 text-sm">₪</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block">אופן תשלום</Label>
                            <Select
                                value={formData.paymentMethod}
                                onValueChange={(val) => setFormData({ ...formData, paymentMethod: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר" />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="CREDIT_CARD">אשראי</SelectItem>
                                    <SelectItem value="BANK_TRANSFER">העברה בנקאית</SelectItem>
                                    <SelectItem value="BIT">ביט/פייבוקס</SelectItem>
                                    <SelectItem value="CASH">מזומן</SelectItem>
                                    <SelectItem value="BARTER">ברטר (סחר חליפין)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-right block">חשיבות</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(val) => setFormData({ ...formData, priority: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent dir="rtl">
                                    <SelectItem value="LOW">נמוכה</SelectItem>
                                    <SelectItem value="MEDIUM">בינונית</SelectItem>
                                    <SelectItem value="HIGH">גבוהה</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-right block">הערות</Label>
                        <Textarea
                            placeholder="הערות נוספות, לינקים לדוגמה, פרטי קשר..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" disabled={loading} className="bg-pink-600 hover:bg-pink-700 w-full md:w-auto">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                            צור קמפיין והוסף להוצאות
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
