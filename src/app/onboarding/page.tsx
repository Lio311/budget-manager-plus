import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getSubscriptionStatus, startTrial } from '@/lib/actions/subscription'

export default async function OnboardingPage() {
    const user = await currentUser()

    if (!user) {
        redirect('/sign-in')
    }

    try {
        // Check if user already has a subscription or used trial
        const personalStatus = await getSubscriptionStatus(user.id, 'PERSONAL')
        const businessStatus = await getSubscriptionStatus(user.id, 'BUSINESS')

        // If user has no access and no specific status (meaning they are new), start trial
        // logic: status 'none' means no record found.
        if (personalStatus.status === 'none' && businessStatus.status === 'none') {
            console.log('[Onboarding] Starting new trial for user:', user.id)
            await startTrial(user.id, user.emailAddresses[0].emailAddress, 'PERSONAL')
        } else {
            console.log('[Onboarding] User already has status:', { personal: personalStatus.status, business: businessStatus.status })
        }
    } catch (error) {
        console.error('[Onboarding] Error during onboarding:', error)
    }

    redirect('/dashboard')
}
