'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    const [subscriptionType, setSubscriptionType] = useState<string>('MONTHLY')
    const [packageName, setPackageName] = useState('')
    const [subscriptionPrice, setSubscriptionPrice] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    // Initialize state when dialog opens or client changes
    useEffect(() => {
        if (isOpen && client) {
            setSubscriptionType(client.subscriptionType || 'MONTHLY')
            setPackageName(client.packageName || client.package?.name || '')
            setSubscriptionPrice(client.subscriptionPrice?.toString() || '')
        }
    }, [isOpen, client])

    const handleSubmit = async () => {
        if (!startDate) {
            toast.error('נא לבחור תאריך התחלה')
            return
        }
        if (!subscriptionPrice) {
            toast.error('נא להזין מחיר מנוי')
            return
        }

        setIsLoading(true)
        try {
            const result = await renewSubscription(
                client.id,
                startDate,
                endDate,
                {
                    subscriptionType,
                    packageName,
                    subscriptionPrice: parseFloat(subscriptionPrice)
                }
            )
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
                        <Label>סוג מנוי</Label>
                        <Select value={subscriptionType} onValueChange={setSubscriptionType}>
                            <SelectTrigger>
                                <SelectValue placeholder="בחר סוג מנוי" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="WEEKLY">שבועי</SelectItem>
                                <SelectItem value="MONTHLY">חודשי</SelectItem>
                                <SelectItem value="YEARLY">שנתי</SelectItem>
                                <SelectItem value="PROJECT">פרויקט חד פעמי</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>שם חבילה (אופציונלי)</Label>
                            <Input
                                value={packageName}
                                onChange={(e) => setPackageName(e.target.value)}
                                placeholder="לדוגמה: ליווי עסקי"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>מחיר לחיוב</Label>
                            <Input
                                type="number"
                                value={subscriptionPrice}
                                onChange={(e) => setSubscriptionPrice(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>
                    </div>

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
