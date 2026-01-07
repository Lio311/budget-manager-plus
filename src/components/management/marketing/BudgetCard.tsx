'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { DollarSign, Settings, Loader2 } from "lucide-react"
import { updateMarketingBudget } from '@/lib/actions/business-expenses'
import { toast } from 'sonner'

export function BudgetCard({ initialBudget = 0 }: { initialBudget: number }) {
    const [budget, setBudget] = useState(initialBudget)
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [tempBudget, setTempBudget] = useState(initialBudget.toString())

    const handleSave = async () => {
        setLoading(true)
        try {
            const val = parseFloat(tempBudget)
            if (isNaN(val)) return

            const res = await updateMarketingBudget(val)
            if (res.success) {
                setBudget(val)
                setIsOpen(false)
                toast.success('תקציב עודכן בהצלחה')
            } else {
                toast.error('שגיאה בעדכון התקציב')
            }
        } catch (error) {
            toast.error('שגיאה לא צפויה')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">תקציב כולל</CardTitle>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-black">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                        <DialogHeader className="text-right">
                            <DialogTitle>הגדרת תקציב שיווק כולל</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-right block">סכום התקציב (₪)</label>
                                <Input
                                    type="number"
                                    value={tempBudget}
                                    onChange={(e) => setTempBudget(e.target.value)}
                                    className="text-right"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex sm:justify-start">
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>ביטול</Button>
                            <Button onClick={handleSave} disabled={loading} className="bg-pink-600">
                                {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                                שמור
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">₪{budget.toLocaleString()}</div>
            </CardContent>
        </Card>
    )
}
