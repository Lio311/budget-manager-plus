import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function OnboardingPage() {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
        redirect('/sign-in')
    }

    const user = await currentUser()

    if (!user || !user.emailAddresses[0]) {
        redirect('/sign-in')
    }

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
        where: { clerkId }
    })

    // If not, create the user
    if (!dbUser) {
        dbUser = await prisma.user.create({
            data: {
                clerkId,
                email: user.emailAddresses[0].emailAddress
            }
        })
        console.log('User created during onboarding:', clerkId)
    }

    // User is ready, redirect to dashboard
    redirect('/dashboard')
}
