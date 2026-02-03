'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OpenFormatTab } from '@/components/settings/tabs/OpenFormatTab'
import { LegalComplianceTab } from '@/components/settings/tabs/LegalComplianceTab'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OpenFormatPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
            <h1 className="text-2xl font-bold mb-6 text-right">ממשק מתקדם - מבנה אחיד (נסתר)</h1>

            <Tabs defaultValue="generate" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generate">הפקת קבצים</TabsTrigger>
                    <TabsTrigger value="legal">רגולציה ורישום</TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="mt-6">
                    <OpenFormatTab />
                </TabsContent>

                <TabsContent value="legal" className="mt-6">
                    <LegalComplianceTab />
                </TabsContent>
            </Tabs>

            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm text-gray-500 text-right">
                <p>עמוד זה אינו מופיע בתפריט הראשי. שמור את הקישור לשימוש עתידי.</p>
            </div>
        </div>
    )
}
