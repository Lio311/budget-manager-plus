import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, Check, AlertCircle, X, Loader2, ArrowRight } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'

interface BankImportModalProps {
    onImport: (data: any[]) => Promise<void>
}

interface ParsedExpense {
    date: string
    description: string
    amount: number
    billingAmount: number
    paymentMethod?: string
}

const [error, setError] = useState<string | null>(null)

const handleFile = async (selectedFile: File) => {
    setFile(selectedFile)
    setLoading(true)
    setError(null) // Clear previous errors

    try {
        // ... (existing logic) ...
        // If headers found etc.
    } catch (e) {
        // ...
    }
}

// ... handleImport ...
const handleImport = async () => {
    if (previewData.length === 0) return
    setImporting(true)
    setError(null)

    // ... distribution calculation ...

    try {
        await onImport(previewData)

        toast.success(`יובאו בהצלחה ${previewData.length} הוצאות`, {
            description: `פירוט לפי חודשים: ${distributionStr}. (הערה: הוצאות מחודשים אחרים לא יוצגו במסך הנוכחי)`
        })

        setOpen(false)
        setFile(null)
        setPreviewData([])
    } catch (error: any) {
        console.error(error)
        const msg = error.message || "שגיאה בשמירת הנתונים"
        setError(msg)
        toast.error(msg)
    } finally {
        setImporting(false)
    }
}

return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) { setFile(null); setPreviewData([]); setError(null) } }}>
        {/* ... trigger ... */}
        <DialogContent className="sm:max-w-2xl" dir="rtl">
            {/* ... header ... */}

            <div className="space-y-4">
                {/* ... file input ... */}

                {/* ... loading ... */}

                {/* ... preview ... */}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    {/* ... buttons ... */}
                    <Button
                        onClick={handleImport}
                        disabled={previewData.length === 0 || importing}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        ייבוא
                    </Button>
                    <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                </div>
            </div>
        </DialogContent>
    </Dialog>
)
}
