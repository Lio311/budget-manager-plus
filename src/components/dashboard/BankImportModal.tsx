import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Upload, FileSpreadsheet, Check, AlertCircle, X, Loader2, ArrowRight, Camera, Image as ImageIcon } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'
import { scanInvoiceImage } from '@/lib/actions/scan-invoice'

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
    const imageInputRef = useRef<HTMLInputElement>(null)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("file")

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
            const droppedFile = e.dataTransfer.files[0]
            if (activeTab === 'scan' && !droppedFile.type.startsWith('image/')) {
                toast.error("נא להעלות קובץ תמונה בלבד")
                return
            }
            if (activeTab === 'file' && !droppedFile.name.match(/\.(xlsx|xls|csv)$/)) {
                toast.error("נא להעלות קובץ Excel או CSV בלבד")
                return
            }
            handleFile(droppedFile)
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
        setPreviewData([])

        if (activeTab === 'scan') {
            // Handle Image Scan
            try {
                const formData = new FormData()
                formData.append('file', selectedFile)

                const result = await scanInvoiceImage(formData)

                if (result.success && result.data) {
                    const scannedExpense: ParsedExpense = {
                        date: result.data.date || format(new Date(), 'yyyy-MM-dd'),
                        description: result.data.businessName,
                        amount: result.data.amount,
                        billingAmount: result.data.amount,
                        paymentMethod: 'כרטיס אשראי',
                        branchName: 'חשבוניות סרוקות' // As requested
                    }
                    setPreviewData([scannedExpense])
                } else {
                    setError(result.error || 'סריקת החשבונית נכשלה')
                    toast.error("שגיאה בסריקה", { description: result.error })
                    setFile(null)
                }
            } catch (err) {
                console.error(err)
                setError('שגיאה לא צפויה בעת הסריקה')
                setFile(null)
            } finally {
                setLoading(false)
            }
            return
        }

        // Handle Excel/CSV Import (Existing Logic)
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
                branch: ["ענף", "קטגוריה", "category", "branch"],
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

            console.log('Detected headers:', headers)
            console.log('Date index:', dateIdx, 'Amount index:', amountIdx, 'Billing index:', billingIdx)

            const finalAmountIdx = billingIdx !== -1 ? billingIdx : amountIdx

            if (dateIdx === -1 || finalAmountIdx === -1) {
                const msg = `חסרות עמודות חובה בקובץ.\n\nעמודות שזוהו: ${headers.join(', ')}\n\nהמערכת מחפשת עמודות עם המילים: תאריך, date, סכום, amount, חיוב`
                console.error('Column detection failed:', { dateIdx, finalAmountIdx, headers })
                setError(msg)
                setLoading(false)
                return
            }

            const parsedRows: ParsedExpense[] = []

            console.log('Starting to parse rows from index:', headerRowIndex + 1, 'to', jsonData.length)

            for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                const row = jsonData[i]
                if (!row || row.length === 0) {
                    console.log(`Row ${i}: Empty, skipping`)
                    continue
                }

                // Get values
                const dateRaw = row[dateIdx]
                const descRaw = descIdx !== -1 ? row[descIdx] : 'הוצאה כללית'
                // Prefer billing amount, fallback to general amount
                const amountRaw = row[finalAmountIdx]
                const branchRaw = branchIdx !== -1 ? row[branchIdx] : ''
                const methodRaw = methodIdx !== -1 ? row[methodIdx] : ''

                console.log(`Row ${i}:`, { dateRaw, descRaw, amountRaw, branchRaw })

                // Skip empty rows
                if (!dateRaw && !amountRaw) {
                    console.log(`Row ${i}: No date and no amount, skipping`)
                    continue
                }

                // Parse Date
                let dateStr = ''
                console.log(`Row ${i}: dateRaw value:`, dateRaw, 'type:', typeof dateRaw)

                if (typeof dateRaw === 'number') {
                    // Excel serial date
                    const dateObj = new Date(Math.round((dateRaw - 25569) * 86400 * 1000))
                    if (!isNaN(dateObj.getTime())) dateStr = format(dateObj, 'yyyy-MM-dd')
                    console.log(`Row ${i}: Parsed Excel date ${dateRaw} to ${dateStr}`)
                } else {
                    let dStr = String(dateRaw).trim()
                    console.log(`Row ${i}: Trying to parse date string:`, dStr)

                    // Try to extract date from text using regex
                    // Match DD.MM.YY, DD.MM.YYYY, DD/MM/YY, DD/MM/YYYY, DD-MM-YY, DD-MM-YYYY
                    const datePattern = /(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/
                    const match = dStr.match(datePattern)
                    if (match) {
                        dStr = match[0] // Extract just the date part
                        console.log(`Row ${i}: Extracted date from text:`, dStr)
                    }

                    // Try simplistic parsing
                    try {
                        let d: Date | null = null
                        if (dStr.includes('.')) {
                            // DD.MM.YY or DD.MM.YYYY format (Isracard)
                            const [d1, m1, y1] = dStr.split('.')
                            if (y1?.length === 2) {
                                // YY format - assume 20YY
                                d = new Date(`20${y1}-${m1.padStart(2, '0')}-${d1.padStart(2, '0')}`)
                            } else if (y1?.length === 4) {
                                // YYYY format
                                d = new Date(`${y1}-${m1.padStart(2, '0')}-${d1.padStart(2, '0')}`)
                            }
                        } else if (dStr.includes('/')) {
                            const [d1, m1, y1] = dStr.split('/')
                            if (y1?.length === 4) d = new Date(`${y1}-${m1.padStart(2, '0')}-${d1.padStart(2, '0')}`)
                            else if (y1?.length === 2) d = new Date(`20${y1}-${m1.padStart(2, '0')}-${d1.padStart(2, '0')}`)
                        } else if (dStr.includes('-')) {
                            const parts = dStr.split('-')
                            if (parts[0].length === 4) d = new Date(dStr) // YYYY-MM-DD
                            else if (parts[2].length === 4) d = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`) // DD-MM-YYYY
                            else if (parts[2].length === 2) d = new Date(`20${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`) // DD-MM-YY
                        } else {
                            d = new Date(dStr)
                        }

                        if (d && !isNaN(d.getTime())) {
                            dateStr = format(d, 'yyyy-MM-dd')
                            console.log(`Row ${i}: Successfully parsed to ${dateStr}`)
                        } else {
                            console.log(`Row ${i}: Date parsing resulted in invalid date`)
                        }
                    } catch (e) {
                        console.log(`Row ${i}: Date parse exception:`, e, 'for value:', dStr)
                    }
                }

                if (!dateStr) {
                    console.log(`Row ${i}: Failed to parse date, skipping`)
                    continue
                }

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

            console.log('Parsed rows count:', parsedRows.length)
            console.log('Sample parsed row:', parsedRows[0])

            if (parsedRows.length === 0) {
                const msg = "לא נמצאו רשומות תקינות לייבוא.\n\nנמצאו כותרות אבל לא נמצאו שורות עם נתונים תקינים."
                setError(msg)
                toast.error("ייבוא נכשל", { description: msg })
            } else {
                setPreviewData(parsedRows)
                console.log('Preview data set successfully')
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

        try {
            await onImport(previewData)

            setOpen(false)
            setFile(null)
            setPreviewData([])
            toast.success("הנתונים נשמרו בהצלחה")
        } catch (error: any) {
            console.error(error)
            const msg = error.message || "שגיאה בשמירת הנתונים"
            setError(msg)
            toast.error(msg)
        } finally {
            setImporting(false)
        }
    }

    const resetModal = () => {
        setFile(null)
        setPreviewData([])
        setError(null)
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetModal(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-dashed flex-row-reverse">
                    <Upload className="h-4 w-4" />
                    ייבוא
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl px-6" dir="rtl">
                <DialogHeader className="text-right sm:text-right pb-2">
                    <DialogTitle className="text-xl font-bold text-gray-900">ייבוא / סריקה</DialogTitle>
                    <DialogDescription>
                        ייבוא הוצאות מקובץ Excel/CSV או סריקת חשבונית
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); resetModal(); }} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="file" className="flex items-center justify-center gap-2 flex-row" dir="ltr">
                            <span className="font-sans">Excel/CSV</span>
                            <span>קובץ</span>
                        </TabsTrigger>
                        <TabsTrigger value="scan" className="flex items-center justify-center gap-2 flex-row" dir="ltr">
                            <span className="font-sans">(AI)</span>
                            <span>סריקת חשבוניות</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="file" className="space-y-4">
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
                                <p className="text-xs text-gray-500 mt-1 flex flex-row-reverse justify-center gap-1">
                                    <span>תומך בקבצי</span>
                                    <span className="font-sans">Excel (.xlsx, .xls)</span>
                                    <span>ו-</span>
                                    <span className="font-sans">CSV</span>
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={onFileSelect}
                                />
                            </div>
                        ) : null}
                    </TabsContent>

                    <TabsContent value="scan" className="space-y-4">
                        {!file ? (
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
                                    dragging ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                                )}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => imageInputRef.current?.click()}
                            >
                                <div className="flex justify-center gap-4 mb-3">
                                    <Camera className="h-10 w-10 text-gray-400" />
                                    <ImageIcon className="h-10 w-10 text-gray-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                    לחץ להעלאת צילום חשבונית
                                </p>
                                <p className="text-xs text-gray-500 mt-1 flex flex-row-reverse justify-center gap-1">
                                    <span>תומך בקבצי</span>
                                    <span className="font-sans">JPG, PNG, WEBP</span>
                                </p>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={onFileSelect}
                                />
                            </div>
                        ) : null}
                    </TabsContent>
                </Tabs>


                {/* Shared Preview / Loading UI */}
                <div className="space-y-4 mt-2">
                    {file && (
                        <div className="border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-lg", activeTab === 'scan' ? "bg-blue-100" : "bg-green-100")}>
                                    {activeTab === 'scan' ? <ImageIcon className="h-5 w-5 text-blue-600" /> : <FileSpreadsheet className="h-5 w-5 text-green-600" />}
                                </div>
                                <div className="text-sm">
                                    <div className="font-bold text-gray-800">{file.name}</div>
                                    <div className="text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={resetModal} disabled={loading}>
                                <X className="h-4 w-4 text-gray-500" />
                            </Button>
                        </div>
                    )}

                    {loading && (
                        <div className="py-8 flex flex-col items-center justify-center text-gray-500 animate-in fade-in zoom-in duration-300">
                            <Loader2 className="h-8 w-8 animate-spin mb-3 text-blue-600" />
                            <span className="text-sm font-medium">{activeTab === 'scan' ? 'מפענח חשבונית באמצעות AI...' : 'וקורא נתונים...'}</span>
                        </div>
                    )}

                    {previewData.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-700">
                                    {activeTab === 'scan' ? 'תוצאות סריקה' : `תצוגה מקדימה (${previewData.length} רשומות)`}
                                </h4>
                            </div>

                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                                <table className="w-full text-xs text-right">
                                    <thead className="bg-gray-50 sticky top-0 text-gray-500">
                                        <tr>
                                            <th className="p-2 border-b text-right">תאריך</th>
                                            <th className="p-2 border-b text-right">תיאור / עסק</th>
                                            <th className="p-2 border-b text-right">קטגוריה</th>
                                            <th className="p-2 border-b text-right">סכום</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {previewData.slice(0, 50).map((row, idx) => (
                                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                                <td className="p-2 text-gray-600 font-mono text-right">{format(new Date(row.date), 'dd/MM/yyyy')}</td>
                                                <td className="p-2 font-medium text-right">{row.description}</td>
                                                <td className="p-2 text-gray-500 text-right">{row.branchName || '-'}</td>
                                                <td className="p-2 font-bold text-red-600 text-right" dir="ltr">₪{row.billingAmount?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {activeTab === 'scan' && (
                                <p className="text-xs text-gray-400 text-center pt-1">
                                    * הנתונים הופקו באמצעות בינה מלאכותית, מומלץ לוודא את נכונותם.
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                        <Button variant="outline" onClick={() => setOpen(false)}>ביטול</Button>
                        <Button
                            onClick={handleImport}
                            disabled={previewData.length === 0 || importing || loading}
                            className={cn(
                                "text-white gap-2",
                                activeTab === 'scan' ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                            )}
                        >
                            {importing && <Loader2 className="h-4 w-4 animate-spin" />}
                            {activeTab === 'scan' ? 'שמור חשבונית' : 'ייבוא נתונים'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
