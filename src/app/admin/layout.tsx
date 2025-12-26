import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

const ADMIN_EMAILS = ['lior31197@gmail.com', 'ron.kor97@gmail.com']

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const user = await currentUser()

    if (!user) {
        redirect('/')
    }

    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        redirect('/dashboard')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col" dir="ltr">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">Admin Dashboard</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                            Super Admin
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
                            Back to App
                        </a>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                                A
                            </div>
                            <span className="text-sm font-medium text-gray-700">{userEmail}</span>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
                {children}
            </main>
        </div>
    )
}
