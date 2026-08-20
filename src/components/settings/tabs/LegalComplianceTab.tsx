'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Shield, FileText, ClipboardList } from 'lucide-react'
import { getAuditLogs } from '@/lib/actions/audit'
import useSWR from 'swr'
import { format } from 'date-fns'

/*
  Form 6502 Helper Data
  These are static or semi-static details about the software that the user needs for registration.
*/
const SOFTWARE_DETAILS = {
    name: 'Kesefly',
    version: '1.0.0', // This should match package.json or system config
    manufacturer: 'Independent Developer',
    // In a real scenario, this might need to be dynamic or editable if white-labeled
}

export function LegalComplianceTab() {
    const { data: auditLogs, isLoading } = useSWR('audit-logs', async () => {
        const res = await getAuditLogs()
        return res.data || []
    })

    return (
        <div className="space-y-6 text-right" dir="rtl">
            <Tabs defaultValue="registration" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="registration">רישום תוכנה (טופס 6502)</TabsTrigger>
                    <TabsTrigger value="audit">יומן אירועים (Audit Log)</TabsTrigger>
                </TabsList>

                {/* Registration Helper Tab */}
                <TabsContent value="registration" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex flex-row-reverse items-center justify-start gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                פרטי תוכנה לרישום
                            </CardTitle>
                            <CardDescription>
                                הנתונים הבאים נדרשים למילוי טופס 6502 (בקשה לרישום תוכנה לניהול מערכת חשבונות)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md border">
                                    <div className="text-xs text-gray-500 mb-1">שם התוכנה</div>
                                    <div className="font-semibold select-all text-right">{SOFTWARE_DETAILS.name}</div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md border">
                                    <div className="text-xs text-gray-500 mb-1">גרסה</div>
                                    <div className="font-semibold select-all" dir="ltr">{SOFTWARE_DETAILS.version}</div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md border">
                                    <div className="text-xs text-gray-500 mb-1">סוג תוכנה</div>
                                    <div className="font-semibold">מערכת הנהלת חשבונות משולבת (ERP)</div>
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-md border">
                                    <div className="text-xs text-gray-500 mb-1">שפת פיתוח / בסיס נתונים</div>
                                    <div className="font-semibold" dir="ltr">SaaS / PostgreSQL</div>
                                </div>
                            </div>

                            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-100 text-blue-800 dark:text-blue-200 text-sm">
                                <strong>הצהרת יצרן:</strong> המערכת פועלת בהתאם להוראות מס הכנסה (ניהול פנקסי חשבונות) - התשל"ג 1973, כולל תיקון כללי מס הכנסה (הוראות ניהול פנקסי חשבונות) התשפ"א-2021 (מבנה אחיד).
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Audit Logs Tab */}
                <TabsContent value="audit" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex flex-row-reverse items-center justify-start gap-2">
                                <Shield className="h-5 w-5 text-purple-600" />
                                יומן אירועים קריטיים
                            </CardTitle>
                            <CardDescription>
                                תיעוד פעולות רגישות במערכת (התחברות, שינוי הגדרות עסק, הפקת מסמכים)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-md overflow-hidden">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-100 dark:bg-slate-700">
                                        <tr>
                                            <th className="p-3 font-medium">תאריך</th>
                                            <th className="p-3 font-medium">פעולה</th>
                                            <th className="p-3 font-medium">ישות</th>
                                            <th className="p-3 font-medium">פרטים</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                        {isLoading ? (
                                            <tr><td colSpan={4} className="p-4 text-center text-gray-500">טוען נתונים...</td></tr>
                                        ) : auditLogs && auditLogs.length > 0 ? (
                                            auditLogs.map((log: any) => (
                                                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                                    <td className="p-3 whitespace-nowrap text-gray-600 dark:text-gray-400">
                                                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                                                    </td>
                                                    <td className="p-3 font-medium">{log.action}</td>
                                                    <td className="p-3 text-gray-600">{log.entity}</td>
                                                    <td className="p-3 text-gray-500 max-w-xs truncate" title={log.details}>
                                                        {log.details || '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={4} className="p-4 text-center text-gray-500">אין רישומים להצגה</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
