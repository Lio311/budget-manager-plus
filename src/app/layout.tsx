import './globals.css'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { heIL } from '@clerk/localizations'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
    title: 'מערכת ניהול תקציב חודשי+',
    description: 'נהל את התקציב האישי או המשפחתי שלך בקלות עם לוח שנה חכם ותזכורות תשלומים',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ClerkProvider localization={heIL}>
            <html lang="he" dir="rtl">
                <body>
                    {children}
                    <Toaster />
                </body>
            </html>
        </ClerkProvider>
    )
}
