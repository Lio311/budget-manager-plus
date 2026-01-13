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
        // Check if user already has a subscription or used trial
        const personalStatus = await getSubscriptionStatus(user.id, 'PERSONAL')

        // Only start trial if requested and user has no previous status
        if (isTrialRequested && personalStatus.status === 'none') {
            console.log('[Onboarding] Starting new trial (PERSONAL) for user:', user.id)
            await startTrial(user.id, user.emailAddresses[0].emailAddress, 'PERSONAL')
        } else {
            console.log('[Onboarding] Skipping trial activation. Requested:', isTrialRequested, 'Status:', personalStatus.status)
        }
    } catch (error) {
        console.error('[Onboarding] Error during onboarding:', error)
    }

    redirect('/dashboard')
}
