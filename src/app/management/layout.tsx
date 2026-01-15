import { ManagementLayout } from '@/components/management/ManagementLayout'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ADMIN_EMAILS } from '@/lib/constants'

export const metadata = {
    title: 'Management Dashboard',
    description: 'Project Management & KPIs',
}

export default async function Layout({ children }: { children: React.ReactNode }) {
    const user = await currentUser()

    if (!user) {
        redirect('/sign-in')
    }

    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        redirect('/')
    }

    return <ManagementLayout>{children}</ManagementLayout>
}
