import './globals.css'
import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { heIL } from '@clerk/localizations'
import { Toaster } from '@/components/ui/toaster'
import { Rubik } from 'next/font/google'
import { WebApplicationJsonLd } from '@/components/seo/JsonLd'

const rubik = Rubik({
    subsets: ['hebrew', 'latin'],
    display: 'swap',
    variable: '--font-rubik'
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
        default: 'Keseflow - ניהול תקציב אישי ומשפחתי חכם',
        template: '%s | Keseflow'
    },
    description: 'מערכת ניהול תקציב חכמה לניהול הכנסות, הוצאות, חשבונות וחיסכונות. לוח שנה אינטראקטיבי, תזכורות תשלומים וניתוח פיננסי מתקדם.',
    keywords: ['ניהול תקציב', 'תקציב אישי', 'תקציב משפחתי', 'ניהול כספים', 'חיסכון', 'הוצאות', 'הכנסות', 'תזכורות תשלומים', 'לוח שנה פיננסי'],
    authors: [{ name: 'Keseflow' }],
    creator: 'Keseflow',
    publisher: 'Keseflow',
    applicationName: 'Keseflow',
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
        siteName: 'Keseflow',
        locale: 'he_IL',
        type: 'website',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Keseflow - ניהול תקציב חכם',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Keseflow - ניהול תקציב אישי ומשפחתי חכם',
        description: 'מערכת ניהול תקציב חכמה לניהול הכנסות, הוצאות, חשבונות וחיסכונות',
        images: ['/og-image.png'],
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
        icon: '/K-ICON.png',
        apple: '/K-ICON.png',
        shortcut: '/K-ICON.png',
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'Keseflow',
    },
    formatDetection: {
        telephone: false,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ClerkProvider
            localization={heIL}
            appearance={{
                elements: {
                    logoImage: "/K-LOGO.png",
                    logoBox: {
                        height: "3rem",
                        justifyContent: "center"
                    }
                }
            }}
        >
            <html lang="he" dir="rtl" className={rubik.variable}>
                <head>
                    {/* Performance Hints */}
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://vercel.live" />
                    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
                </head>
                <body>
                    <WebApplicationJsonLd />
                    {children}
                    <Toaster />
                </body>
            </html>
        </ClerkProvider>
    )
}
