'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, FileSignature } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SignaturePad } from '@/components/settings/SignaturePad'
import { AgreementContent, AGREEMENT_VERSION } from '@/components/management/agreement/AgreementContent'
import { signAgreement, getAgreementStatus } from '@/lib/actions/agreement'
import { format } from 'date-fns'

export default function AgreementPage() {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    // Status
    const [status, setStatus] = useState<'NOT_SIGNED' | 'SIGNED'>('NOT_SIGNED')
    const [signedInfo, setSignedInfo] = useState<any>(null)

    // Form State
    const [filledValues, setFilledValues] = useState<any>({
        // Default values can be set here or derived dynamically
        signedYear: new Date().getFullYear().toString(),
        signedMonth: (new Date().getMonth() + 1).toString(),
        signedDay: new Date().getDate().toString()
    })
    const [signature, setSignature] = useState('')

    const [userEmail, setUserEmail] = useState<string | undefined>(undefined)

    useEffect(() => {
        loadStatus()
    }, [])

    async function loadStatus() {
        try {
            const res = await getAgreementStatus()
            if (res.success && res.data) {
                if (res.data.email) setUserEmail(res.data.email)

                setStatus(res.data.status as any)
                if (res.data.status === 'SIGNED') {
                    setSignedInfo(res.data)
                    // Populate fields with saved values for Read-Only view
                    if (res.data.filledValues) {
                        setFilledValues(res.data.filledValues)
                    }
                }
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleFieldChange = (key: string, value: string) => {
        setFilledValues((prev: any) => ({ ...prev, [key]: value }))
    }

    const handleSubmit = async () => {
        if (!signature) {
            toast({ title: 'שגיאה', description: 'אנא חתום על המסמך', variant: 'destructive' })
            return
        }

        // Allow partial filling as per user request

        setSubmitting(true)
        try {
            const res = await signAgreement(signature, AGREEMENT_VERSION, filledValues)
            if (res.success) {
                toast({ title: 'הצלחה', description: 'החוזה נחתם בהצלחה' })
                await loadStatus()
            } else {
                toast({ title: 'שגיאה', description: 'אירעה שגיאה בשמירת החוזה', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'שגיאה', description: 'שגיאת תקשורת', variant: 'destructive' })
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>
    }

    if (status === 'SIGNED') {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card className="p-8 bg-white shadow-lg border-t-4 border-green-500">
                    <div className="flex items-center justify-between mb-8 pb-6 border-b">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">הסכם העסקה</h1>
                            <p className="text-green-600 font-medium flex items-center gap-2 mt-2">
                                <CheckCircle2 className="h-5 w-5" />
                                נחתם דיגיטלית בתאריך {format(new Date(signedInfo.signedAt), 'dd/MM/yyyy HH:mm')}
                            </p>
                        </div>
                        <FileSignature className="h-12 w-12 text-gray-300" />
                    </div>

                    <div className="bg-gray-50 p-8 rounded-lg mb-8 border border-gray-100">
                        {/* Read Only View */}
                        <AgreementContent
                            values={filledValues}
                            onChange={() => { }}
                            readOnly={true}
                            userEmail={userEmail}
                            signature={signedInfo.signature}
                        />
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">חתימה על הסכם העסקה</h1>
                <p className="text-gray-500">אנא קרא/י את ההסכם בעיון, מלא/י את הפרטים החסרים וחתום/י בתחתית העמוד.</p>
            </div>

            <Card className="p-8 bg-white shadow-lg">
                {/* Editable View - Pass signature to show it live in the box */}
                <AgreementContent
                    values={filledValues}
                    onChange={handleFieldChange}
                    readOnly={false}
                    userEmail={userEmail}
                    signature={signature}
                />

                <div className="mt-12 bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h3 className="font-bold text-lg mb-4 text-blue-900">חתימה דיגיטלית</h3>
                    <div className="bg-white rounded-lg border shadow-sm">
                        <SignaturePad
                            onChange={setSignature}
                            onClear={() => setSignature('')}
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            {submitting ? <Loader2 className="animate-spin ml-2" /> : <FileSignature className="ml-2 h-5 w-5" />}
                            אשר וחתום על ההסכם
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
