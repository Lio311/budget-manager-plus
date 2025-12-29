import LandingPage from '@/components/home/LandingPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'דף הבית',
    description: 'התחל לנהל את התקציב האישי או המשפחתי שלך בצורה חכמה ויעילה. גרפים מתקדמים, לוח שנה חכם ותזכורות תשלומים אוטומטיות.',
    openGraph: {
        title: 'Keseflow - התחל לנהל את התקציב שלך',
        description: 'מערכת ניהול תקציב חכמה עם גרפים מתקדמים ולוח שנה אינטראקטיבי',
    },
}

export default function HomePage() {
    return <LandingPage />
}
