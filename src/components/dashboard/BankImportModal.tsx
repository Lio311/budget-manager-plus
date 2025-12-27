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

export function BankImportModal({ onImport }: BankImportModalProps) {
    const [open, setOpen] = useState(false)
    const [dragging, setDragging] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [previewData, setPreviewData] = useState<ParsedExpense[]>([])
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

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

        try {
            const data = await selectedFile.arrayBuffer()
            const workbook = XLSX.read(data, { type: 'array' })
            const firstSheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[firstSheetName]

            // Convert to array of arrays to find header
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

            // Find header row index
            let headerRowIndex = -1
            const requiredHeaders = ["תאריך עסקה", "שם בית עסק", "סכום חיוב"]

            console.log('Searching for headers in first 20 rows...')
            for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                const row = jsonData[i]
                if (Array.isArray(row)) {
                    // Check if row contains all required headers
                    // Normalize: replace newlines/tabs with space and trim
                    const rowStr = row.map(cell => String(cell).replace(/[\r\n]+/g, ' ').trim())
                    console.log(`Row ${i}:`, rowStr)
                    const matches = requiredHeaders.every(header => rowStr.includes(header))
                    if (matches) {
                        headerRowIndex = i
                        console.log('Found headers at row:', i)
                        break
                    }
                }
            }

            if (headerRowIndex === -1) {
                console.error('Headers not found. Required:', requiredHeaders)
                toast.error("מבנה קובץ לא תקין", {
                    description: "לא נמצאו הכותרות: תאריך עסקה, שם בית עסק, סכום חיוב (נא לוודא שאין ירידות שורה בכותרות)"
                })
                setFile(null)
                setLoading(false)
                return
            }

            // Parse data starting from the row after header
            // Normalize headers here too for indexing
            const headers = jsonData[headerRowIndex].map((h: any) => String(h).replace(/[\r\n]+/g, ' ').trim())
            const dateIdx = headers.indexOf("תאריך עסקה")
            const descIdx = headers.indexOf("שם בית עסק")
            const amountIdx = headers.indexOf("סכום עסקה")
            const billingIdx = headers.indexOf("סכום חיוב")

            const parsedRows: ParsedExpense[] = []

            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i]
                if (!row || row.length === 0) continue

                // Get values using indices
                const dateRaw = row[dateIdx]
                const descRaw = row[descIdx]
                const amountRaw = amountIdx !== -1 ? row[amountIdx] : 0
                const billingRaw = row[billingIdx]

                // Validation: Must have date and billing amount
                if (!dateRaw || !billingRaw) continue

                // Parse Date (Excel dates are sometimes numbers)
                let dateStr = ''
                if (typeof dateRaw === 'number') {
                    // Excel serial date
                    const dateObj = new Date(Math.round((dateRaw - 25569) * 86400 * 1000))
                    dateStr = format(dateObj, 'yyyy-MM-dd')
                } else {
                    // Try parsing string "DD/MM/YYYY" or similar
                    try {
                        const parts = String(dateRaw).split('/')
                        if (parts.length === 3) {
                            // Assuming DD/MM/YYYY or DD/MM/YY
                            const day = parts[0].padStart(2, '0')
                            const month = parts[1].padStart(2, '0')
                            let year = parts[2]
                            if (year.length === 2) year = '20' + year
                            dateStr = `${year}-${month}-${day}`
                        } else {
                            // Fallback
                            const d = new Date(dateRaw)
                            if (!isNaN(d.getTime())) dateStr = format(d, 'yyyy-MM-dd')
                        }
                    } catch (e) {
                        console.error("Date parse error", dateRaw)
                    }
                }

                // Parse Amount
                const parseAmount = (val: any) => {
                    if (typeof val === 'number') return val
                    const str = String(val).replace(/[₪,]/g, '').trim()
                    return parseFloat(str) || 0
                }

                const billingAmount = parseAmount(billingRaw)

                if (dateStr && billingAmount) {
                    parsedRows.push({
                        date: dateStr,
                        description: String(descRaw || 'ללא תיאור').trim(),
                        amount: parseAmount(amountRaw),
                        billingAmount: billingAmount,
                        paymentMethod: 'CREDIT_CARD' // Default assumption for bank import
                    })
                }
            }

            setPreviewData(parsedRows)

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
        try {
            await onImport(previewData)
            toast.success(`${previewData.length} הוצאות יובאו בהצלחה`)
            setOpen(false)
            setFile(null)
            setPreviewData([])
        } catch (error) {
            console.error(error)
            toast.error("שגיאה בשמירת הנתונים")
        } finally {
            setImporting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
