import './globals.css'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { heIL } from '@clerk/localizations'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { Rubik, Montserrat } from 'next/font/google'
import { WebApplicationJsonLd } from '@/components/seo/JsonLd'
import { ReactivationPopup } from '@/components/promo/ReactivationPopup'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { getSubscriptionStatus } from '@/lib/actions/subscription'
import { differenceInDays } from 'date-fns'
import AccessibilityWidget from '@/components/accessibility/AccessibilityWidget'
import { ConfirmDialogProvider } from '@/hooks/useConfirm'

const rubik = Rubik({
    subsets: ['hebrew', 'latin'],
    display: 'swap',
    variable: '--font-rubik'
})

const montserrat = Montserrat({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-montserrat'
})

export const viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#22c55e' },
        { media: '(prefers-color-scheme: dark)', color: '#16a34a' },
    ],
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
}

export const metadata: Metadata = {
    title: {
        default: 'Kesefly - ניהול תקציב אישי ומשפחתי חכם',
        template: '%s | Kesefly'
    },
    description: 'מערכת ניהול תקציב חכמה לניהול הכנסות, הוצאות, חשבונות וחיסכונות. לוח שנה אינטראקטיבי, תזכורות תשלומים וניתוח פיננסי מתקדם.',
    keywords: ['ניהול תקציב', 'תקציב אישי', 'תקציב משפחתי', 'ניהול כספים', 'חיסכון', 'הוצאות', 'הכנסות', 'תזכורות תשלומים', 'לוח שנה פיננסי'],
    authors: [{ name: 'Kesefly' }],
    creator: 'Kesefly',
    publisher: 'Kesefly',
    applicationName: 'Kesefly',
    metadataBase: new URL('https://keseflow.vercel.app'),
    manifest: '/manifest.json',
    alternates: {
        canonical: '/',
        languages: {
            'he': '/',
        },
    },
    openGraph: {
        title: 'Keseflow - ניהול תקציב אישי ומשפחתי חכם',
        description: 'מערכת ניהול תקציב חכמה לניהול הכנסות, הוצאות, חשבונות וחיסכונות',
        url: 'https://keseflow.vercel.app',
        siteName: 'Kesefly',
        locale: 'he_IL',
        type: 'website',
        images: [
            {
                url: '/images/marketing/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Kesefly - ניהול תקציב חכם',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Keseflow - ניהול תקציב אישי ומשפחתי חכם',
        description: 'מערכת ניהול תקציב חכמה לניהול הכנסות, הוצאות, חשבונות וחיסכונות',
        images: ['/images/marketing/og-image.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/images/branding/K-ICON.png',
        apple: '/images/branding/apple-touch-icon.png',
        shortcut: '/images/branding/K-ICON.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Kesefly',
    },
    formatDetection: {
        telephone: false,
    },
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Logic for Reactivation Popup
    let shouldShowReactivation = false
    try {
        // We catch everything here to be 100% safe.
        // On 404 pages of static files (like /favicon.ico), currentUser() might throw 
        // if the middleware didn't run for that specific path.
        const user = await currentUser().catch(() => null)

        if (!user) {
            // Guest user - Show popup (targeting users who are not connected)
            shouldShowReactivation = true
        } else {
            // Logged in user - Check last active in DB
            const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: { updatedAt: true }
            })

            if (dbUser?.updatedAt) {
                const daysInactive = differenceInDays(new Date(), dbUser.updatedAt)

                // If inactive for more than 30 days, check subscription
                if (daysInactive > 30) {
                    const personalStatus = await getSubscriptionStatus(user.id, 'PERSONAL').catch(() => ({ hasAccess: false }))
                    const businessStatus = await getSubscriptionStatus(user.id, 'BUSINESS').catch(() => ({ hasAccess: false }))

                    const hasActiveSubscription = personalStatus.hasAccess || businessStatus.hasAccess

                    if (!hasActiveSubscription) {
                        shouldShowReactivation = true
                    }
                }
            }
        }
    } catch (error) {
        // Log sparingly as this can happen for every static asset 404
        // console.error('Error checking reactivation status:', error)
        shouldShowReactivation = false
    }

    return (
        <ClerkProvider
            localization={{
                ...heIL,
                unstable__errors: {
                    ...heIL.unstable__errors,
                    // Email deletion errors
                    "This email address is linked to one or more Connected Accounts. Remove the Connected Account before deleting this email address": "לא ניתן להסיר כתובת אימייל זו מכיוון שאין כתובת אימייל נוספת שמקושרת לחשבון.",
                    resource_linked_to_connected_account: "לא ניתן להסיר כתובת אימייל זו מכיוון שאין כתובת אימייל נוספת שמקושרת לחשבון.",
                    delete_primary_email_address_is_not_allowed: "לא ניתן להסיר את כתובת האימייל הראשי.",
                    form_identifier_not_found: "לא ניתן למחוק את כתובת האימייל היחידה בחשבון.",
                    form_param_nil: "לא ניתן למחוק את כתובת האימייל היחידה בחשבון."
                } as any
            }}
            appearance={{
                elements: {
                    logoImage: "/images/branding/K-LOGO.png",
                    logoBox: {
                        height: "3rem",
                        justifyContent: "center"
                    }
                }
            }}
        >
            <html lang="he" dir="rtl" className={`${rubik.variable} ${montserrat.variable}`}>
                <head>
                    {/* Performance Hints */}
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://vercel.live" />
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
                </head>
                <body>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <WebApplicationJsonLd />
                        <div id="site-content">
                            {children}
                        </div>
                        <ReactivationPopup shouldShow={shouldShowReactivation} />
                        <AccessibilityWidget />
                        <Toaster />
                        <SonnerToaster />
                        <ConfirmDialogProvider />
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    )
}
