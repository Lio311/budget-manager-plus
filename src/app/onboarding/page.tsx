import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSubscriptionStatus, startTrial } from '@/lib/actions/subscription'

export default async function OnboardingPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const user = await currentUser()
    const { trial } = await searchParams
    const isTrialRequested = trial === 'true'

    if (!user) {
        redirect('/sign-in')
    }

    try {
        console.log('[Onboarding] Processing user:', user.id, 'Requested trial:', isTrialRequested)

        // Check if user already has a subscription or used trial
        const personalStatus = await getSubscriptionStatus(user.id, 'PERSONAL')
        console.log('[Onboarding] Current status:', personalStatus.status, 'Has access:', personalStatus.hasAccess)

        // Only start trial if requested AND user has no previous status AND doesn't already have access
        if (isTrialRequested && personalStatus.status === 'none' && !personalStatus.hasAccess) {
            console.log('[Onboarding] Activating new trial (PERSONAL) for user:', user.id)
            const result = await startTrial(user.id, user.emailAddresses[0].emailAddress, 'PERSONAL')
            if (result.success) {
                console.log('[Onboarding] Trial activation successful')
            } else {
                console.error('[Onboarding] Trial activation failed:', result.reason)
            }
        } else {
            console.log('[Onboarding] Skipping trial activation. Requested:', isTrialRequested, 'Status:', personalStatus.status)
        }
    } catch (error) {
        console.error('[Onboarding] Error during onboarding:', error)
    }

    console.log('[Onboarding] Onboarding complete, redirecting to dashboard')
    redirect('/dashboard')
}
