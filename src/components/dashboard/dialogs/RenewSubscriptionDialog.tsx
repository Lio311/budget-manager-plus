'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from "@/components/ui/label"
import { toast } from 'sonner'
import { renewSubscription } from '@/lib/actions/clients'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

interface RenewSubscriptionDialogProps {
    isOpen: boolean
    onClose: () => void
    client: any
    onSuccess?: () => void
}

export function RenewSubscriptionDialog({ isOpen, onClose, client, onSuccess }: RenewSubscriptionDialogProps) {
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async () => {
        if (!startDate) {
            toast.error('נא לבחור תאריך התחלה')
            return
        }

        setIsLoading(true)
        try {
            const result = await renewSubscription(client.id, startDate, endDate)
            if (result.success) {
                toast.success('מנוי חודש בהצלחה')
                onSuccess?.()
                onClose()
            } else {
                toast.error('שגיאה בחידוש המנוי')
            }
        } catch (error) {
            toast.error('שגיאה בחידוש המנוי')
        } finally {
            setIsLoading(false)
        }
    }

    if (!client) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>חידוש מנוי - {client.name}</DialogTitle>
                    <DialogDescription>
                        בחר תאריכים חדשים למנוי. המערכת תיצור תשלומי עתידיים חדשים אך לא תמחק היסטוריה קיימת.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4" dir="rtl">
                    <div className="space-y-2">
                        <Label>תאריך התחלה חדש</Label>
                        <DatePicker
                            date={startDate}
                            setDate={setStartDate}
                            placeholder="בחר תאריך התחלה"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>תאריך סיום חדש (אופציונלי)</Label>
                        <DatePicker
                            date={endDate}
                            setDate={setEndDate}
                            placeholder="בחר תאריך סיום"
                        />
                    </div>
                    {client.subscriptionEnd && (
                        <div className="text-sm text-gray-500 mt-2">
                            סיום מנוי נוכחי: {format(new Date(client.subscriptionEnd), 'dd/MM/yyyy')}
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-start">
                    <div className="flex w-full gap-2">
                        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
                            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            חדש מנוי
                        </Button>
                        <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                            ביטול
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
