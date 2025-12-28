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
    branchName?: string
}

export function BankImportModal({ onImport }: BankImportModalProps) {
    const [open, setOpen] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<ParsedExpense[]>([])
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState<string | null>(null)

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = async (selectedFile: File) => {
        setFile(selectedFile)
        setLoading(true)
        setError(null)

        try {
            const data = await selectedFile.arrayBuffer()
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]

            // Convert to array of arrays to find header
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

            // AUTO FIX: Smart Header Detection
            let headerRowIndex = -1

            // Expanded keywords mapping
            const keywords = {
                date: ["תאריך", "date", "יום", "time", "תאריך רכישה", "תאריך עסקה"],
                desc: ["שם בית עסק", "שם בית העסק", "בית עסק", "תיאור", "desc", "merchant", "details", "פרטים", "שם", "שם העסק"],
                amount: ["סכום חיוב", "סכום עסקה", "סכום", "amount", "total", "מחיר", "debit", "חיוב", "סכום לחיוב", "סכום החיוב"],
                billingAmount: ["סכום חיוב", "חיוב בפועל", "billing", "charge", "סכום לחיוב בש\"ח"],
                branch: ["ענף", "קטגוריה", "category", "branch", "סוג"],
                paymentMethod: ["אמצעי תשלום", "card", "method", "type", "כרטיס", "פרטים נוספים"]
            }

            // Search for header row
            console.log('Searching for headers...')
            for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                const row = jsonData[i]
                if (Array.isArray(row)) {
                    const rowStr = row.map(cell => String(cell).toLowerCase().replace(/[\r\n]+/g, ' ').trim())

                    // Count matches for critical fields
                    const hasDate = keywords.date.some(k => rowStr.some(c => c.includes(k)))
                    const hasAmount = keywords.amount.some(k => rowStr.some(c => c.includes(k)))

                    // If we found at least date and amount headers, we assume this is the header row
                    if (hasDate && hasAmount) {
                        headerRowIndex = i
                        console.log('Found headers at row:', i)
                        break
                    }
                }
            }

            if (headerRowIndex === -1) {
                console.error('Headers not found')
                const msg = "מבנה הקובץ לא נתמך. המערכת לא הצליחה לזהות עמודות תאריך וסכום באופן אוטומטי."
                setError(msg)
                toast.error("ייבוא נכשל", { description: msg })
                setFile(null)
                setLoading(false)
                return
            }

            // Parse data starting from the row after header
            const headers = jsonData[headerRowIndex].map((h: any) => String(h).toLowerCase().replace(/[\r\n]+/g, ' ').trim())

            // Helper to find index using fuzzy search
            const findIdx = (keys: string[]) => headers.findIndex(h => keys.some(k => h.includes(k)))

            const dateIdx = findIdx(keywords.date)
            const descIdx = findIdx(keywords.desc) // Might be -1
            const amountIdx = findIdx(keywords.amount)
            const billingIdx = findIdx(keywords.billingAmount)
            const branchIdx = findIdx(keywords.branch)
            const methodIdx = findIdx(keywords.paymentMethod)

            const finalAmountIdx = billingIdx !== -1 ? billingIdx : amountIdx

            if (dateIdx === -1 || finalAmountIdx === -1) {
                const msg = "חסרות עמודות חובה (תאריך או סכום) בקובץ."
                setError(msg)
                setLoading(false)
                return
            }

            const parsedRows: ParsedExpense[] = []

            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i]
                if (!row || row.length === 0) continue

                // Get values
                const dateRaw = row[dateIdx]
                const descRaw = descIdx !== -1 ? row[descIdx] : 'הוצאה כללית'
                // Prefer billing amount, fallback to general amount
                const amountRaw = row[finalAmountIdx]
                const branchRaw = branchIdx !== -1 ? row[branchIdx] : ''
                const methodRaw = methodIdx !== -1 ? row[methodIdx] : ''

                // Skip empty rows
                if (!dateRaw && !amountRaw) continue

                // Parse Date
                let dateStr = ''
                if (typeof dateRaw === 'number') {
                    // Excel serial date
                    const dateObj = new Date(Math.round((dateRaw - 25569) * 86400 * 1000))
                    if (!isNaN(dateObj.getTime())) dateStr = format(dateObj, 'yyyy-MM-dd')
                } else {
                    const dStr = String(dateRaw).trim()
                    // Try simplistic parsing
                    try {
                        let d: Date | null = null
                        if (dStr.includes('/')) {
                            const [d1, m1, y1] = dStr.split('/')
                            if (y1?.length === 4) d = new Date(`${y1}-${m1}-${d1}`)
                            else if (y1?.length === 2) d = new Date(`20${y1}-${m1}-${d1}`)
                        } else if (dStr.includes('-')) {
                            const parts = dStr.split('-')
                            if (parts[0].length === 4) d = new Date(dStr) // YYYY-MM-DD
                            else if (parts[2].length === 4) d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`) // DD-MM-YYYY
                        } else {
                            d = new Date(dStr)
                        }

                        if (d && !isNaN(d.getTime())) dateStr = format(d, 'yyyy-MM-dd')
                    } catch (e) { console.log('Date parse failed', dStr) }
                }

                if (!dateStr) continue

                // Parse Amount
                const parseVal = (val: any) => {
                    if (typeof val === 'number') return val
                    if (!val) return 0
                    const clean = String(val).replace(/[₪,$\s]/g, '')
                    return parseFloat(clean) || 0
                }

                const amount = parseVal(amountRaw)
                if (amount === 0 && amountRaw !== 0) continue

                parsedRows.push({
                    date: dateStr,
                    description: String(descRaw).trim(),
                    amount: amount,
                    billingAmount: amount, // Normalize to same field
                    paymentMethod: methodRaw || 'כרטיס אשראי',
                    branchName: branchRaw ? String(branchRaw).trim() : undefined
                })
            }

            if (parsedRows.length === 0) {
                setError("לא נמצאו רשומות תקינות לייבוא.")
            } else {
                setPreviewData(parsedRows)
            }

        } catch (error) {
            console.error(error)
            toast.error("שגיאה בקריאת הקובץ")
            setFile(null)
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async () => {
        if (previewData.length === 0) return
        setImporting(true)
        setError(null)

        // Calculate distribution for feedback
        const monthCounts: Record<string, number> = {}
        previewData.forEach(row => {
            if (row.date) {
                const date = new Date(row.date)
                const key = `${date.getMonth() + 1}/${date.getFullYear()}`
                monthCounts[key] = (monthCounts[key] || 0) + 1
            }
        })
        const distributionStr = Object.entries(monthCounts)
            .map(([key, count]) => `${count} ב-${key}`)
            .join(', ')

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
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-dashed flex-row-reverse">
                    <Upload className="h-4 w-4" />
                    ייבוא
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl" dir="rtl">
                <DialogHeader className="text-right sm:text-right">
                    <DialogTitle className="text-xl font-bold text-gray-900">ייבוא נתונים</DialogTitle>
                    <DialogDescription>
                        טען קובץ Excel או CSV לייבוא הוצאות.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {!file ? (
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                                dragging ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-gray-300"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FileSpreadsheet className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                            <p className="text-sm font-medium text-gray-700">
                                לחץ לבחירת קובץ או גרור אותו לכאן
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                תומך בקבצי Excel (.xlsx, .xls) ו-CSV
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={onFileSelect}
                            />
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="text-sm">
                                    <div className="font-bold text-gray-800">{file.name}</div>
                                    <div className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => { setFile(null); setPreviewData([]) }}>
                                <X className="h-4 w-4 text-gray-500" />
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="py-10 flex flex-col items-center justify-center text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <span className="text-sm">קורא נתונים...</span>
                        </div>
                    )}

                    {previewData.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-700">תצוגה מקדימה ({previewData.length} רשומות)</h4>
                            </div>
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-xs text-right">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="p-2 border-b">תאריך</th>
                                            <th className="p-2 border-b">בית עסק</th>
                                            <th className="p-2 border-b">סכום חיוב</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.slice(0, 5).map((row, idx) => (
                                            <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                                                <td className="p-2 text-gray-600">{row.date}</td>
                                                <td className="p-2 font-medium">{row.description}</td>
                                                <td className="p-2 font-bold text-red-600">{formatCurrency(row.billingAmount)}</td>
                                            </tr>
                                        ))}
                                        {previewData.length > 5 && (
                                            <tr>
                                                <td colSpan={3} className="p-2 text-center text-gray-400 italic">
                                                    ועוד {previewData.length - 5} רשומות...
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2">
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
