import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { ArrowLeft, Calendar, PieChart, TrendingUp, Wallet } from 'lucide-react'
import Image from 'next/image'
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
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
            <div className="container mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Image
                            src="/K-LOGO.png"
                            alt="Keseflow"
                            width={600}
                            height={180}
                            className="h-32 w-auto"
                            priority
                        />
                    </div>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        המיטב משני העולמות – תקציב ולוח שנה! נהל את הכספים שלך בקלות עם גרפים מתקדמים ותזכורות תשלומים חכמות
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    <FeatureCard
                        icon={<PieChart className="w-8 h-8" />}
                        title="גרפים מתקדמים"
                        description="ויזואליזציה ברורה של ההכנסות וההוצאות שלך"
                    />
                    <FeatureCard
                        icon={<Calendar className="w-8 h-8" />}
                        title="לוח שנה חכם"
                        description="תזכורות אוטומטיות לכל התשלומים והחשבונות"
                    />
                    <FeatureCard
                        icon={<TrendingUp className="w-8 h-8" />}
                        title="מעקב בזמן אמת"
                        description="עדכון מיידי של המצב הפיננסי שלך"
                    />
                    <FeatureCard
                        icon={<Wallet className="w-8 h-8" />}
                        title="ניהול מלא"
                        description="הכנסות, הוצאות, חשבונות וחובות במקום אחד"
                    />
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    <SignedOut>
                        <div className="space-y-4">
                            <h2 className="text-3xl font-bold mb-6">מוכן להתחיל?</h2>
                            <div className="flex gap-4 justify-center">
                                <SignUpButton mode="modal">
                                    <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl">
                                        הרשמה חינם
                                    </button>
                                </SignUpButton>
                                <SignInButton mode="modal">
                                    <button className="px-8 py-4 bg-white border-2 border-primary text-primary rounded-lg font-semibold text-lg hover:bg-green-50 transition-all">
                                        כניסה למערכת
                                    </button>
                                </SignInButton>
                            </div>
                        </div>
                    </SignedOut>

                    <SignedIn>
                        <Link href="/dashboard">
                            <button className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2">
                                כניסה לדשבורד
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        </Link>
                    </SignedIn>
                </div>

                {/* Features List */}
                <div className="mt-20 max-w-4xl mx-auto">
                    <h3 className="text-2xl font-bold text-center mb-10">מה כוללת המערכת?</h3>
                    <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                        <BenefitItem text="מעקב אחר הכנסות והוצאות לפי קטגוריות" />
                        <BenefitItem text="ניהול חשבונות קבועים ומנויים" />
                        <BenefitItem text="מעקב חובות ותשלומים חודשיים" />
                        <BenefitItem text="לוח שנה עם תזכורות אוטומטיות" />
                        <BenefitItem text="גרפים צבעוניים וברורים" />
                        <BenefitItem text="ממשק בעברית וידידותי" />
                        <BenefitItem text="גישה ממכשיר, טלפון וטאבלט" />
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="budget-card text-center hover:scale-105 transition-transform">
            <div className="text-primary mb-4 flex justify-center">{icon}</div>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    )
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <p className="text-lg font-medium">{text}</p>
        </div>
    )
}
