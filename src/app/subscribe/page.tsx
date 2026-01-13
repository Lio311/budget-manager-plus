import { Paywall } from '@/components/subscription/Paywall'
import { ForceLightMode } from '@/components/ForceLightMode'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSubscriptionStatus, startTrial } from '@/lib/actions/subscription'

export default async function SubscribePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const plan = typeof params.plan === 'string' ? params.plan : 'PERSONAL'
    const isTrialRequested = params.trial === 'true'

    // If trial is requested, attempt to activate it and redirect
    if (isTrialRequested) {
        const user = await currentUser()
        if (user) {
            console.log('[SubscribePage] Trial requested via URL, attempting background activation for:', user.id)
            try {
                const status = await getSubscriptionStatus(user.id, 'PERSONAL')
                if (status.status === 'none' && !status.hasAccess) {
                    await startTrial(user.id, user.emailAddresses[0].emailAddress, 'PERSONAL')
                    console.log('[SubscribePage] Trial activated, redirecting to dashboard')
                    redirect('/dashboard')
                } else if (status.hasAccess) {
                    console.log('[SubscribePage] User already has access, redirecting to dashboard')
                    redirect('/dashboard')
                }
            } catch (error) {
                console.error('[SubscribePage] Error in fail-safe trial activation:', error)
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <ForceLightMode />
            <Paywall initialPlan={plan} />
        </div>
    )
}
