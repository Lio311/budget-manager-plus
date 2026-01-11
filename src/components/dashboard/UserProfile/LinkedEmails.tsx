'use client'

import { useUser } from '@clerk/nextjs'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Mail, Check, AlertCircle, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function LinkedEmails() {
    const { user, isLoaded } = useUser()
    const [isAdding, setIsAdding] = useState(false)
    const [emailAddress, setEmailAddress] = useState('')
    const [verifying, setVerifying] = useState(false)
    const [code, setCode] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [pendingEmailObj, setPendingEmailObj] = useState<any>(null)

    if (!isLoaded || !user) return null

    const handleAddEmail = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            // Create the email address on Clerk
            const emailObj = await user.createEmailAddress({ email: emailAddress })

            // Initiate verification
            await emailObj.prepareVerification({ strategy: 'email_code' })

            setPendingEmailObj(emailObj)
            setVerifying(true)
            toast.success('קוד אימות נשלח למייל זה')
        } catch (err: any) {
            console.error(err)
            // Handle specific Clerk errors
            if (err.errors && err.errors[0]?.code === 'form_identifier_exists') {
                setError('כתובת המייל הזו כבר רשומה במערכת לחשבון אחר')
            } else if (err.errors && err.errors[0]?.code === 'form_param_format_invalid') {
                setError('כתובת מייל לא תקינה')
            } else {
                setError('אירעה שגיאה בוספת המייל. נסה שנית.')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            if (!pendingEmailObj) return

            const attempt = await pendingEmailObj.attemptVerification({ code })

            if (attempt.verification.status === 'verified') {
                toast.success('המייל נוסף בהצלחה!')
                resetForm()
            } else {
                setError('קוד אימות שגוי')
            }
        } catch (err: any) {
            console.error(err)
            setError('שגיאה באימות הקוד')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (emailId: string) => {
        if (!confirm('האם אתה בטוח שברצונך להסיר מייל זה? הגישה לחשבון תחסם עבורו.')) return

        try {
            const emailToDelete = user.emailAddresses.find(e => e.id === emailId)
            if (emailToDelete) {
                await emailToDelete.destroy()
                toast.success('המייל הוסר בהצלחה')
            }
        } catch (err) {
            toast.error('שגיאה בהסרת המייל')
        }
    }

    const resetForm = () => {
        setIsAdding(false)
        setVerifying(false)
        setEmailAddress('')
        setCode('')
        setError(null)
        setPendingEmailObj(null)
    }

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    מיילים מקושרים
                </CardTitle>
                <CardDescription>
                    נהל את כתובות המייל המקושרות לחשבון שלך. כל מייל המופיע כאן יוכל להתחבר לחשבון זה ולקבל גישה מלאה לכל הנתונים.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">

                {/* Email List */}
                <div className="space-y-3">
                    {user.emailAddresses.map((email) => (
                        <div key={email.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <Mail className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{email.emailAddress}</span>
                                        {user.primaryEmailAddressId === email.id && (
                                            <Badge variant="secondary" className="text-[10px]">ראשי</Badge>
                                        )}
                                        {email.verification.status !== 'verified' && (
                                            <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">לא מאומת</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {user.primaryEmailAddressId !== email.id && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(email.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add New Email */}
                {!isAdding && !verifying && (
                    <Button
                        variant="outline"
                        className="w-full border-dashed py-6 gap-2 text-muted-foreground hover:text-primary hover:border-primary/50"
                        onClick={() => setIsAdding(true)}
                    >
                        <Plus className="w-4 h-4" />
                        הוסף מייל חדש
                    </Button>
                )}

                {/* Add Form */}
                {isAdding && !verifying && (
                    <div className="bg-muted/30 p-4 rounded-lg border space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-sm">הוספת מייל חדש</h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <form onSubmit={handleAddEmail} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">כתובת מייל</label>
                                <Input
                                    value={emailAddress}
                                    onChange={(e) => setEmailAddress(e.target.value)}
                                    placeholder="example@email.com"
                                    dir="ltr"
                                    className="text-right"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>ביטול</Button>
                                <Button type="submit" size="sm" disabled={isLoading || !emailAddress}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שלח קוד אימות'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Verification Form */}
                {verifying && (
                    <div className="bg-muted/30 p-4 rounded-lg border space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-sm">אימות כתובת מייל</h3>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={resetForm}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            קוד אימות נשלח לכתובת <strong>{emailAddress}</strong>.
                            אנא הזן אותו כאן כדי לאשר את הגישה.
                        </div>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">קוד אימות</label>
                                <Input
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="123456"
                                    dir="ltr"
                                    className="text-center tracking-widest text-lg font-mono"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive" className="py-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs">{error}</AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="ghost" size="sm" onClick={() => setVerifying(false)}>חזור</Button>
                                <Button type="submit" size="sm" disabled={isLoading || code.length < 4}>
                                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'אמת והוסף'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
