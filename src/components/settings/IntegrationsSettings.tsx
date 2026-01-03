'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, Copy, RefreshCw, Key } from 'lucide-react'
import { generateShortcutApiKey, getShortcutApiKey } from '@/lib/actions/user'

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
        <div className="space-y-6" dir="rtl">
            <Card>
                <CardHeader>
                    <CardTitle className="text-right flex items-center gap-2">
                        <Key className="w-5 h-5" />
                        ממשק קיצורי דרך (Shortcuts)
                    </CardTitle>
                    <CardDescription className="text-right">
                        צור מפתח גישה אישי כדי לאפשר הוספת הוצאות ברקע דרך אפליקציית Shortcuts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-right block">מפתח API אישי</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Input
                                    value={apiKey || ''}
                                    readOnly
                                    placeholder="טרם נוצר מפתח..."
                                    className="font-mono text-center bg-gray-50 dark:bg-slate-900"
                                    type="text"
                                />
                            </div>
                            <Button variant="outline" size="icon" onClick={copyToClipboard} disabled={!apiKey} title="העתק">
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground text-right">
                            השתמש במפתח זה בתוך ה-Shortcut תחת כותרת <code>x-api-key</code>
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button onClick={handleGenerate} disabled={loading} variant={apiKey ? "secondary" : "default"}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <RefreshCw className="w-4 h-4 ml-2" />}
                            {apiKey ? 'צור מפתח חדש' : 'צור מפתח ראשוני'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold mb-2">כיצד להגדיר באייפון?</h4>
                <ol className="list-decimal list-inside space-y-1">
                    <li>העתק את המפתח הנ"ל.</li>
                    <li>פתח את הקיצור (Shortcut).</li>
                    <li>הדבק את המפתח בשדה המתאים (Text) בראש הקיצור.</li>
                </ol>
            </div>
        </div>
    )
}
