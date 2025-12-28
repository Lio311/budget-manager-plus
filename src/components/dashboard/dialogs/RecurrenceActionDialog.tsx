import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { CalendarClock, CalendarDays } from "lucide-react"

interface RecurrenceActionDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (mode: 'SINGLE' | 'FUTURE') => void
    action: 'delete' | 'edit'
    entityName?: string // e.g. "הוצאה"
}

export function RecurrenceActionDialog({
    isOpen,
    onClose,
    onConfirm,
    action,
    entityName = "פריט"
}: RecurrenceActionDialogProps) {
    const [mode, setMode] = useState<'SINGLE' | 'FUTURE'>('SINGLE')

    const title = action === 'delete' ? `מחיקת ${entityName} קבוע` : `עריכת ${entityName} קבוע`
    const description = `זהו ${entityName} שמוגדר כחוזר. כיצד ברצונך להחיל את השינוי?`
    const confirmText = action === 'delete' ? 'מחק' : 'שמור שינויים'
    const confirmVariant = action === 'delete' ? 'destructive' : 'default'

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]" dir="rtl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'SINGLE' | 'FUTURE')} className="gap-4">
                        <div className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg border cursor-pointer hover:bg-gray-50 text-right justify-start ${mode === 'SINGLE' ? 'border-primary bg-primary/5' : 'border-gray-200'}`} onClick={() => setMode('SINGLE')}>
                            <RadioGroupItem value="SINGLE" id="single" className="mt-1" />
                            <Label htmlFor="single" className="flex items-start gap-3 cursor-pointer flex-1 justify-start w-full">
                                <CalendarDays className="h-5 w-5 text-gray-500 mt-1 shrink-0" />
                                <div className="flex flex-col gap-0.5 items-start text-right w-full">
                                    <span className="font-medium text-sm">חודש זה בלבד</span>
                                    <span className="text-xs text-gray-500">השינוי יחול רק על ה{entityName} של החודש הנוכחי</span>
                                </div>
                            </Label>
                        </div>

                        <div className={`flex items-center space-x-2 space-x-reverse p-3 rounded-lg border cursor-pointer hover:bg-gray-50 text-right justify-start ${mode === 'FUTURE' ? 'border-primary bg-primary/5' : 'border-gray-200'}`} onClick={() => setMode('FUTURE')}>
                            <RadioGroupItem value="FUTURE" id="future" className="mt-1" />
                            <Label htmlFor="future" className="flex items-start gap-3 cursor-pointer flex-1 justify-start w-full">
                                <CalendarClock className="h-5 w-5 text-gray-500 mt-1 shrink-0" />
                                <div className="flex flex-col gap-0.5 items-start text-right w-full">
                                    <span className="font-medium text-sm">חודש זה והלאה</span>
                                    <span className="text-xs text-gray-500">השינוי יחול על החודש הנוכחי וכל החודשים הבאים</span>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>ביטול</Button>
                    <Button variant={confirmVariant} onClick={() => onConfirm(mode)}>{confirmText}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
