'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Copy, RefreshCw, Key, Download, ArrowRight, ExternalLink, Camera } from 'lucide-react'
import { generateShortcutApiKey, getShortcutApiKey } from '@/lib/actions/user'
import Image from 'next/image'

export function IntegrationsSettings() {
    const [loading, setLoading] = useState(false)
    const [apiKey, setApiKey] = useState<string | null>(null)

    useEffect(() => {
        loadKey()
    }, [])

    async function loadKey() {
        setLoading(true)
        try {
            const result = await getShortcutApiKey()
            if (result.success) {
                setApiKey(result.key || null)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleGenerate() {
        setLoading(true)
        try {
            const result = await generateShortcutApiKey()
            if (result.success && result.key) {
                setApiKey(result.key)
                toast.success('מפתח API חדש נוצר בהצלחה')
            } else {
                toast.error('שגיאה ביצירת מפתח')
            }
        } catch (error) {
            toast.error('שגיאה לא צפויה')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey)
            toast.success('המפתח הועתק ללוח')
        }
    }

    return (
        <div className="space-y-8" dir="rtl">

            {/* Step 1: API Key */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-lg">1</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">העתק את מפתח ה-API האישי</h3>
                </div>

                <Card className="border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10">
                    <CardContent className="pt-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-right block">מפתח API אישי</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={apiKey || ''}
                                            readOnly
                                            placeholder="טרם נוצר מפתח..."
                                            className="font-mono text-center bg-white dark:bg-slate-950"
                                            type="text"
                                        />
                                    </div>
                                    <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!apiKey} title="העתק">
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button onClick={handleGenerate} disabled={loading} variant={apiKey ? "ghost" : "default"} size="sm">
                                    {apiKey ? 'צור מפתח חדש' : 'צור מפתח ראשוני'}
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Step 2: Choose Automation */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold text-lg">2</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">בחר והורד אוטומציה</h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <a
                        href="https://www.icloud.com/shortcuts/3aa1f450bb2b40ed8f1b44b4dd595f2c"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <Card className="bg-emerald-500 hover:bg-emerald-600 border-0 transition-colors cursor-pointer text-white">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-full">
                                        <span className="text-2xl font-bold">$</span>
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-lg font-bold">המצב הכספי שלי</h4>
                                        <p className="text-emerald-100 text-sm">קבלת תמונת מצב מהירה</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </CardContent>
                        </Card>
                    </a>

                    <a
                        href="https://www.icloud.com/shortcuts/f0243411e3e94f1ebfaaa940ce486387"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <Card className="bg-rose-500 hover:bg-rose-600 border-0 transition-colors cursor-pointer text-white">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-full">
                                        <Download className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-lg font-bold">הוספת הוצאה חדשה</h4>
                                        <p className="text-rose-100 text-sm">תיעוד הוצאה בקליק</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </CardContent>
                        </Card>
                    </a>

                    <a
                        href="https://www.icloud.com/shortcuts/ce0592b919a6403ea223182f7ae7aee9"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <Card className="bg-blue-500 hover:bg-blue-600 border-0 transition-colors cursor-pointer text-white">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-full">
                                        <Camera className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <h4 className="text-lg font-bold">סריקת חשבונית (AI)</h4>
                                        <p className="text-blue-100 text-sm">צילום וניתוח אוטומטי</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </CardContent>
                        </Card>
                    </a>
                </div>
            </div>

            {/* Step 3: Setup Guide */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-lg">3</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">הגדרת האוטומציה</h3>
                </div>

                <div className="space-y-8 relative border-r-2 border-gray-100 dark:border-gray-800 mr-4 pr-8">
                    {/* Guide Step 1 */}
                    <div className="relative">
                        <div className="absolute top-0 -right-[41px] w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-slate-900" />
                        <h4 className="font-bold text-lg mb-2">עריכת הקיצור</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            לאחר ההוספה, לחץ על ה-3 נקודות (...) בפינה של הקיצור שהתווסף.
                        </p>
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-sm">
                            <img
                                src="/images/shortcuts/shortcut_step_2.jpg"
                                alt="Click the 3 dots"
                                className="w-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Guide Step 2 */}
                    <div className="relative">
                        <div className="absolute top-0 -right-[41px] w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-slate-900" />
                        <h4 className="font-bold text-lg mb-2">הגדרת מפתח ה-API</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            גלול למטה ומצא את שדה הטקסט מתחת לכותרת "x-api-key". הדבק שם את המפתח שהעתקת בשלב 1.
                        </p>
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-sm mb-4">
                            <img
                                src="/images/shortcuts/shortcut_step_4.png"
                                alt="Find Key Field"
                                className="w-full object-cover"
                            />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-sm">
                            <img
                                src="/images/shortcuts/shortcut_step_3.png"
                                alt="Paste API Key"
                                className="w-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Guide Step 3 */}
                    <div className="relative">
                        <div className="absolute top-0 -right-[41px] w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-4 border-white dark:border-slate-900" />
                        <h4 className="font-bold text-lg mb-2">הוספה למסך הבית</h4>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            לסיום, לחץ על שם הקיצור בראש המסך, ובחר ב "Add to Home Screen" לגישה מהירה.
                        </p>
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-sm mb-4">
                            <img
                                src="/images/shortcuts/shortcut_step_5a.png"
                                alt="Open Menu"
                                className="w-full object-cover"
                            />
                        </div>
                        <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm max-w-sm">
                            <img
                                src="/images/shortcuts/shortcut_step_5.png"
                                alt="Add to Home Screen"
                                className="w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
