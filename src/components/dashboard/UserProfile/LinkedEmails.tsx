'use client'

import { useUser, useClerk } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2, Mail, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export function LinkedEmails() {
    const { user, isLoaded } = useUser()
    const { signOut } = useClerk()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [reLoginRequired, setReLoginRequired] = useState(false)

    // Force reload user data when this component mounts to ensure we show the latest emails
    // This is critical after returning from a Google OAuth redirect
    useEffect(() => {
        if (user) {
            user.reload().catch(console.error)
        }
    }, [])

    if (!isLoaded || !user) return null

    const handleDeleteEmail = async (emailId: string) => {
        if (!confirm('האם אתה בטוח שברצונך להסיר מייל זה?')) return

        try {
            const emailToDelete = user.emailAddresses.find(e => e.id === emailId)
            if (emailToDelete) {
                await emailToDelete.destroy()
                toast.success('המייל הוסר בהצלחה')
            }
        } catch (err: any) {
            console.error('Delete Email Error:', err)
            if (err.errors?.[0]?.code === 'resource_associated_with_external_account') {
                toast.error('לא ניתן למחוק מייל זה משום שהוא מקושר לחשבון Google. יש לנתק את חשבון ה-Google קודם לכן.')
            } else if (err.errors?.[0]?.message?.includes('Connected Accounts') || err.message?.includes('Connected Accounts')) {
                toast.error('המייל הזה מקושר לחשבון Google המופיע ברשימה למעלה. יש לנתק את חשבון ה-Google קודם לכן.')
            } else if (err.errors?.[0]?.message?.includes('last')) {
                toast.error('לא ניתן למחוק את אמצעי ההתחברות האחרון.')
            } else if (err.errors?.[0]?.code === 'session_step_up_verification_required' || err.message?.includes('verification')) {
                setError('למען אבטחת חשבונך, נדרשת התחברות מחדש לפני מחיקת פרטי זיהוי.')
                setReLoginRequired(true)
            } else {
                toast.error('שגיאה בהסרת המייל: ' + (err.errors?.[0]?.message || 'שגיאה לא ידועה'))
            }
        }
    }

    const handleDisconnectExternal = async (accountId: string) => {
        if (!confirm('האם אתה בטוח שברצונך לנתק חשבון זה?')) return

        try {
            const accountToDelete = user.externalAccounts.find(a => a.id === accountId)
            if (accountToDelete) {
                await accountToDelete.destroy()
                toast.success('החשבון נותק בהצלחה')
                // Refresh to ensure email list state is consistent (sometimes email remains as distinct resource)
                user.reload()
            }
        } catch (err: any) {
            console.error('Disconnect Error:', err)
            if (err.errors?.[0]?.code === 'session_step_up_verification_required' || err.message?.includes('verification')) {
                setError('למען אבטחת חשבונך, נדרשת התחברות מחדש לפני מחיקת חשבון מקושר.')
                setReLoginRequired(true)
            } else {
                toast.error('שגיאה בניתוק החשבון')
            }
        }
    }

    return (
        <Card className="border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    מיילים מקושרים
                </CardTitle>
                <CardDescription>
                    נהל את כתובות המייל המקושרות לחשבון שלך.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-6">

                {/* Error Alert */}
                {error && (
                    <Alert variant="destructive" className="py-2 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">{error}</AlertDescription>
                        </div>
                        {reLoginRequired && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-xs h-7"
                                onClick={() => signOut(() => router.push('/sign-in'))}
                            >
                                התחבר מחדש לאימות
                            </Button>
                        )}
                    </Alert>
                )}

                {/* Email List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">כתובות מייל</h3>
                    {user.emailAddresses.map((email) => {
                        // Check if this email is linked to a Google account
                        const linkedGoogleAccount = user.externalAccounts.find(
                            acc => acc.provider === 'google' &&
                                acc.emailAddress === email.emailAddress
                        )

                        return (
                            <div key={email.id} className="flex items-center justify-between p-3 rounded-lg bg-card transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-2 rounded-full border shadow-sm">
                                        {linkedGoogleAccount ? (
                                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                            </svg>
                                        ) : (
                                            <Mail className="w-4 h-4 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm">{email.emailAddress}</span>
                                            {linkedGoogleAccount && (
                                                <Badge variant="secondary" className="text-[10px]">Google</Badge>
                                            )}
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
                                        onClick={() => {
                                            if (linkedGoogleAccount) {
                                                handleDisconnectExternal(linkedGoogleAccount.id)
                                            } else {
                                                handleDeleteEmail(email.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Add New Email Options */}
                <div className="space-y-3">


                    <Button
                        variant="outline"
                        className="w-full py-6 gap-3 bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-sm transition-all hover:shadow-md"
                        disabled={isLoading}
                        onClick={async () => {
                            setError(null)
                            setReLoginRequired(false)
                            setIsLoading(true)
                            try {
                                const res = await user.createExternalAccount({
                                    strategy: 'oauth_google',
                                    redirectUrl: '/dashboard?tab=overview&openProfile=true'
                                })

                                if (res.verification?.externalVerificationRedirectURL) {
                                    window.location.href = res.verification.externalVerificationRedirectURL.toString()
                                } else {
                                    setIsLoading(false)
                                    toast.error('לא התקבל קישור לאימות. נסה שנית.')
                                }
                            } catch (err: any) {
                                setIsLoading(false)
                                console.error('Google Link Error:', err)
                                if (err.errors?.[0]?.code === 'session_step_up_verification_required' ||
                                    err.message?.includes('verification') ||
                                    err.toString().includes('verification')) {
                                    setError('למען אבטחת חשבונך, נדרשת התחברות מחדש לפני ביצוע פעולה זו.')
                                    setReLoginRequired(true)
                                } else if (
                                    err.errors?.[0]?.code === 'identifier_already_exists' ||
                                    err.errors?.[0]?.code === 'verification_strategy_forbidden' ||
                                    err.message?.includes('already claimed')
                                ) {
                                    setError('חשבון Google זה כבר מקושר למשתמש אחר במערכת.')
                                } else {
                                    toast.error('שגיאה בחיבור חשבון גוגל')
                                }
                            }
                        }}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                        )}
                        חבר חשבון Google
                    </Button>
                </div>

            </CardContent>
        </Card>
    )
}
