'use client'


import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, FileText, Download, CheckCircle, AlertTriangle, Table } from 'lucide-react'
import { generateOpenFormat } from '@/lib/actions/open-format'
import { getBusinessProfile } from '@/lib/actions/business-settings'
import { DatePicker } from '@/components/ui/date-picker'
import { toast } from 'sonner'
import { saveAs } from 'file-saver'
import useSWR from 'swr'

export function OpenFormatTab() {
    const { data: profile } = useSWR('business-profile', async () => {
        const res = await getBusinessProfile()
        return res.data
    })

    // Alias profile to businessProfile for compatibility with existing logic
    const businessProfile = profile

    const [mode, setMode] = useState<'year' | 'range'>('year')
    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)
    const [generating, setGenerating] = useState(false)
    const [lastResult, setLastResult] = useState<any>(null)

    const handleGenerate = async () => {
        if (!businessProfile?.companyId) {
            toast.error('חסר מספר עוסק מורשה (ח.פ) בהגדרות העסק')
            return
        }

        setGenerating(true)
        setLastResult(null)

        try {
            const result = await generateOpenFormat({
                year: mode === 'year' ? parseInt(year) : undefined,
                startDate: mode === 'range' && startDate ? startDate.toISOString() : undefined,
                endDate: mode === 'range' && endDate ? endDate.toISOString() : undefined
            })

            if (result.success && result.data) {
                toast.success('ממשק פתוח - התהליך הסתיים בהצלחה')
                setLastResult(result)

                const byteCharacters = atob(result.data)
                const byteNumbers = new Array(byteCharacters.length)
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i)
                }
                const byteArray = new Uint8Array(byteNumbers)
                const blob = new Blob([byteArray], { type: 'application/zip' })

                saveAs(blob, result.filename || 'OpenFormat.zip')

            } else {
                toast.error(result.error || 'שגיאה בהפקת הקבצים')
            }
        } catch (error) {
            toast.error('שגיאה בלתי צפויה')
            console.error(error)
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-6 text-right" dir="rtl">
            <Card>
                <CardHeader>
                    <CardTitle>ממשק לביקורת רשות המסים (מבנה אחיד)</CardTitle>
                    <CardDescription>
                        הפקת קבצים במבנה אחיד (BKMVDATA.TXT) לפי הוראות מס הכנסה (ניהול פנקסי חשבונות) - גרסה 1.31
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Business Entity Info */}
                    <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-lg flex justify-between items-center border border-gray-100 dark:border-slate-700">
                        <div>
                            <div className="font-bold text-lg">{businessProfile?.companyName || 'שם העסק לא מוגדר'}</div>
                            <div className="text-sm text-gray-500">ח.פ / ע.מ: {businessProfile?.companyId || 'חסר'}</div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 p-2 rounded-md shadow-sm">
                            <FileText className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>

                    {/* Selection Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b pb-6">
                        <div className="space-y-2 md:col-span-3">
                            <Label>סוג הפקה</Label>
                            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                                <SelectTrigger className="text-right">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="year">שנת מס מלאה</SelectItem>
                                    <SelectItem value="range">טווח תאריכים מותאם</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {mode === 'year' ? (
                            <div className="space-y-2 md:col-span-3">
                                <Label>שנת מס</Label>
                                <Select value={year} onValueChange={setYear}>
                                    <SelectTrigger className="text-right">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="2026">2026</SelectItem>
                                        <SelectItem value="2025">2025</SelectItem>
                                        <SelectItem value="2024">2024</SelectItem>
                                        <SelectItem value="2023">2023</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2 md:col-span-4">
                                    <Label>תאריך התחלה</Label>
                                    <DatePicker 
                                        date={startDate} 
                                        setDate={setStartDate} 
                                        className="text-right block w-full"
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-4">
                                    <Label>תאריך סיום</Label>
                                    <DatePicker 
                                        date={endDate} 
                                        setDate={setEndDate} 
                                        className="text-right block w-full"
                                    />
                                </div>
                            </>
                        )}

                        <div className="md:col-span-4 md:col-start-9 lg:col-span-4 lg:col-start-9 mt-4 md:mt-0">
                            <Button
                                onClick={handleGenerate}
                                disabled={generating || !businessProfile?.companyId || (mode === 'range' && (!startDate || !endDate))}
                                className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        מרכז נתונים...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" />
                                        הפק קובץ (ZIP)
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Validation Report / Result */}
                    {lastResult && (
                        <div className="mt-6 border rounded-lg overflow-hidden animate-in fade-in-50 bg-white dark:bg-slate-900 shadow-sm">
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 border-b border-green-100 dark:border-green-900/30 flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                                <div>
                                    <div className="font-bold text-green-800 dark:text-green-300 text-lg">
                                        ממשק פתוח - התהליך הסתיים בהצלחה
                                    </div>
                                    <div className="text-sm text-green-700/80 dark:text-green-400">
                                        קובץ ZIP הכולל BKMVDATA.TXT ואת דוח הביקורת ירד לדפדפן
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2">
                                        <FileText className="h-5 w-5 text-gray-400" />
                                        סיכום כללי
                                    </h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">מספר תעודות שנכללו:</span>
                                            <span className="font-mono font-bold bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">{lastResult.stats?.invoices}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">סה"כ סכום (כולל מע"מ):</span>
                                            <span className="font-mono font-bold">{lastResult.stats?.totalAmount?.toFixed(2)} ₪</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-dashed">
                                            <span className="text-gray-500">שם הקובץ שהופק:</span>
                                            <span dir="ltr" className="font-mono text-xs">{lastResult.filename}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg flex items-center gap-2 border-b pb-2">
                                        <Table className="h-5 w-5 text-gray-400" />
                                        פירוט רשומות (BKMVDATA.TXT)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm max-h-48 overflow-y-auto pr-2">
                                        {lastResult.stats?.counters && Object.entries(lastResult.stats.counters).map(([key, count]) => (
                                            <div key={key} className="flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 p-2 rounded border border-gray-100 dark:border-slate-700">
                                                <span className="font-mono text-gray-600 dark:text-gray-400">{key}</span>
                                                <span className="font-bold">{String(count)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {!businessProfile?.companyId && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md flex items-start gap-2 text-yellow-800 dark:text-yellow-200 text-sm">
                            <AlertTriangle className="h-5 w-5 shrink-0" />
                            <div>
                                <strong>שים לב:</strong> לא ניתן להפיק קבצים ללא הגדרת מספר עוסק מורשה.
                                אנא עבור ללשונית "פרטי העסק" ומלא את הפרטים החסרים.
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    )
}
