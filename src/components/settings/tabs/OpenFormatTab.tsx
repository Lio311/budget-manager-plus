'use client'


import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, FileText, Download, CheckCircle, AlertTriangle } from 'lucide-react'
import { generateOpenFormat } from '@/lib/actions/open-format'
import { getBusinessProfile } from '@/lib/actions/business-settings'
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

    const [year, setYear] = useState<string>(new Date().getFullYear().toString())
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
            const result = await generateOpenFormat(parseInt(year))

            if (result.success && result.data) {
                toast.success('הקבצים הופקו בהצלחה')
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">שנת מס</label>
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
                        <div className="flex items-end">
                            <Button
                                onClick={handleGenerate}
                                disabled={generating || !businessProfile?.companyId}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        מפיק קבצים...
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
                        <div className="mt-6 border rounded-lg overflow-hidden animate-in fade-in-50">
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 border-b border-green-100 dark:border-green-900/30 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-semibold text-green-700 dark:text-green-300">דוח הפקה תקין</span>
                            </div>
                            <div className="p-4 bg-white dark:bg-slate-800 space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2 border-dashed">
                                    <span className="text-gray-500">מספר חשבוניות שנכללו:</span>
                                    <span className="font-mono font-bold">{lastResult.stats?.invoices}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2 border-dashed">
                                    <span className="text-gray-500">סה"כ סכום (כולל מע"מ):</span>
                                    <span className="font-mono font-bold">{lastResult.stats?.totalAmount?.toFixed(2)} ₪</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-400 pt-2">
                                    <span>שם קובץ:</span>
                                    <span dir="ltr">{lastResult.filename}</span>
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
