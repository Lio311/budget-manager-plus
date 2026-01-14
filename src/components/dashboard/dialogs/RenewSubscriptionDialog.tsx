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
import { getClientPackages } from '@/lib/actions/packages'
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
    const [packageId, setPackageId] = useState<string>('')
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>('PAID')
    const [subscriptionPrice, setSubscriptionPrice] = useState('')
    const [packages, setPackages] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Fetch packages
    useEffect(() => {
        if (isOpen) {
            getClientPackages().then(result => {
                if (result.success) {
                    setPackages(result.data || [])
                }
            })
        }
    }, [isOpen])

    // Initialize state when dialog opens or client changes
    useEffect(() => {
        if (isOpen && client) {
            setSubscriptionType(client.subscriptionType || 'MONTHLY')
            setPackageName(client.packageName || '')
            setPackageId(client.packageId || '')
            setSubscriptionStatus(client.subscriptionStatus || 'PAID')
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
                    packageName: packageId ? undefined : packageName, // Only send name if no package ID is selected (custom)
                    packageId: packageId === 'custom' ? undefined : packageId,
                    subscriptionStatus,
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
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>סוג מנוי</Label>
                            <Select value={subscriptionType} onValueChange={setSubscriptionType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר סוג" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WEEKLY">שבועי</SelectItem>
                                    <SelectItem value="MONTHLY">חודשי</SelectItem>
                                    <SelectItem value="YEARLY">שנתי</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>חבילה</Label>
                            <Select
                                value={packageId}
                                onValueChange={(val) => {
                                    setPackageId(val)
                                    const pkg = packages.find(p => p.id === val)
                                    if (pkg) {
                                        setSubscriptionPrice(pkg.defaultPrice?.toString() || '')
                                        setPackageName(pkg.name)
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="בחר חבילה" />
                                </SelectTrigger>
                                <SelectContent>
                                    {packages.map(pkg => (
                                        <SelectItem key={pkg.id} value={pkg.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: pkg.color }}
                                                />
                                                {pkg.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>מחיר לחיוב</Label>
                            <Input
                                type="number"
                                value={subscriptionPrice}
                                onChange={(e) => setSubscriptionPrice(e.target.value)}
                                placeholder="0.00"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>סטטוס תשלום</Label>
                            <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="סטטוס" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PAID">שולם</SelectItem>
                                    <SelectItem value="UNPAID">לא שולם</SelectItem>
                                    <SelectItem value="PARTIAL">שולם חלקית</SelectItem>
                                    <SelectItem value="INSTALLMENTS">בתשלומים</SelectItem>
                                </SelectContent>
                            </Select>
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
