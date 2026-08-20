'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Gift, Copy, Check, Share2, Loader2, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { optInToReferral, getReferralStats } from '@/lib/actions/referral'

interface ReferralDashboardProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ReferralDashboard({ open, onOpenChange }: ReferralDashboardProps) {
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [joining, setJoining] = useState(false)
    const [stats, setStats] = useState<{
        isActive: boolean
        code: string | null
        count: number
        coupons: any[]
    } | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (open) {
            loadStats()
        }
    }, [open])

    async function loadStats() {
        setLoading(true)
        try {
            const result = await getReferralStats()
            if (result.success) {
                // @ts-ignore
                setStats(result)
            }
        } catch (error) {
            console.error('Failed to load referral stats', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleJoin() {
        setJoining(true)
        try {
            const result = await optInToReferral()
            if (result.success) {
                toast({
                    title: 'ברוכים הבאים! 🎉',
                    description: 'הצטרפת לתוכנית "חבר מביא חבר". בהצלחה!',
                })
                await loadStats() // Reload to show dashboard
            } else {
                toast({
                    title: 'שגיאה',
                    description: 'לא ניתן להצטרף כרגע',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            console.error(error)
        } finally {
            setJoining(false)
        }
    }

    const copyToClipboard = () => {
        if (stats?.code) {
            navigator.clipboard.writeText(stats.code)
            setCopied(true)
            toast({ description: 'הקוד הועתק!' })
            setTimeout(() => setCopied(false), 2000)
        }
    }

    // Milestones definition
    const MILESTONES = [
        { count: 2, reward: 8 },
        { count: 4, reward: 17 },
        { count: 6, reward: 25 },
        { count: 8, reward: 40 },
        { count: 10, reward: 50 },
    ]

    const nextMilestone = stats ? MILESTONES.find(m => m.count > stats.count) : MILESTONES[0]
    const percent = nextMilestone && stats
        ? Math.min(100, Math.max(0, (stats.count / 10) * 100)) // Normalize to 10 for full bar? Or per milestone?
        // Let's make the bar 0 to 10 scale
        : 0

    // Better progress bar logic:
    // If count is 3, bar should be at 30% (assuming max 10 target for display)
    const progressValue = stats ? (stats.count / 10) * 100 : 0

    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md" dir="rtl">
                    <div className="flex justify-center p-10">
                        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // MODE 1: Not Active (Join Screen)
    if (stats && !stats.isActive) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md text-center" dir="rtl">
                    <DialogHeader>
                        <div className="mx-auto bg-green-100 p-4 rounded-full w-fit mb-4">
                            <Gift className="h-8 w-8 text-green-600" />
                        </div>
                        <DialogTitle className="text-xl text-center">להרוויח עד 50% הנחה?</DialogTitle>
                        <DialogDescription className="text-center text-base pt-2">
                            הצטרפו לתוכנית "חבר מביא חבר" שלנו!
                            <br />
                            על כל חבר שירשם דרככם, תתקדמו בדרגות ותקבלו קופונים שווים.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-2 text-sm text-gray-500">
                        <p>2 חברים = 8% הנחה 🎁</p>
                        <p>4 חברים = 17% הנחה 🎁</p>
                        <p>6 חברים = 25% הנחה 🎁</p>
                        <p>8 חברים = 40% הנחה 🎁</p>
                        <p>10 חברים = 50% הנחה! 🎁</p>
                    </div>

                    <Button
                        onClick={handleJoin}
                        disabled={joining}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg transition-all shadow-lg hover:shadow-xl"
                    >
                        {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : 'אני רוצה להצטרף'}
                    </Button>
                </DialogContent>
            </Dialog>
        )
    }

    // MODE 2: Active Dashboard
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-xl" dir="rtl">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl">
                            איזור השותפים שלך
                        </DialogTitle>

                    </div>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Code Section */}
                    <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                        <p className="text-sm text-muted-foreground mb-2">הקוד הייחודי שלך:</p>
                        <div className="flex items-center justify-center gap-3">
                            <code className="text-3xl font-black tracking-widest text-green-600 dark:text-green-400 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm">
                                {stats?.code}
                            </code>
                            <Button size="icon" variant="outline" onClick={copyToClipboard} className="h-12 w-12 rounded-xl">
                                {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">
                            שתף קוד זה. כל שימוש מזכה אותך בנקודה!
                        </p>
                    </div>

                    {/* Stats & Progress */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="font-bold text-lg">ההתקדמות שלך</h3>
                                <p className="text-sm text-muted-foreground">הבאת {stats?.count} חברים עד כה</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                    היעד הבא: {nextMilestone ? `${nextMilestone.reward}%` : 'MAX'}
                                </span>
                            </div>
                        </div>

                        <div className="relative pt-2">
                            <Progress
                                value={Math.min(100, (stats!.count / 10) * 100)}
                                className="h-3 bg-gray-100 [&>div]:bg-green-500" // Customizing progress bar color
                            />
                            {/* Milestone Markers */}
                            <div className="flex justify-between mt-2 px-1 text-[10px] text-gray-400 font-medium">
                                <span>0</span>
                                <span>2</span>
                                <span>4</span>
                                <span>6</span>
                                <span>8</span>
                                <span>10</span>
                            </div>
                        </div>
                    </div>

                    {/* Rewards List */}
                    <div className="space-y-3">
                        <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">הקופונים שלי</h3>
                        {stats?.coupons && stats.coupons.length > 0 ? (
                            <div className="grid gap-2">
                                {/* @ts-ignore */}
                                {stats.coupons.map((coupon) => (
                                    <div key={coupon.id} className="flex items-center justify-between p-3 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-100 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white p-2 rounded-full shadow-sm">
                                                <Sparkles className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-green-800 dark:text-green-300">{coupon.discountPercent}% הנחה</p>
                                                <p className="text-xs text-green-600/80 font-mono tracking-wider">{coupon.code}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-green-700 hover:text-green-800 hover:bg-green-100"
                                            onClick={() => {
                                                navigator.clipboard.writeText(coupon.code)
                                                toast({ description: 'קוד ההטבה הועתק' })
                                            }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                <p className="text-sm text-gray-500">טרם צברת קופונים. שתף את הקוד כדי להתחיל!</p>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
