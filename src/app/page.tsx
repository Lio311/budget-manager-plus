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
                            className="h-20 md:h-32 w-auto"
                            priority
                        />
                    </div>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        שליטה מלאה בתזרים המזומנים שלך – כל הכלים לצמיחה כלכלית במקום אחד.
                        מערכת מקיפה לניהול תקציב, מעקב הוצאות, תכנון חובות וחיסכון. קבל תמונת מצב מדויקת וכלים חכמים לקבלת החלטות נכונות.
                    </p>
                </div>

            </div>

            {/* Personal Solution Section */}
            <div className="mb-20 bg-blue-50 p-8 md:p-12 rounded-3xl border border-blue-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20 -ml-32 -mt-32"></div>
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-20 -mr-32 -mb-32"></div>

                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    {/* Visual Side (Appears Right in RTL due to order, Wait... Primary Column is Right in RTL. So this is Right Column) */}
                    {/* Actually in RTL Grid: Col 1 is Right, Col 2 is Left. */}
                    {/* We want Zig-Zag: 
                            Business: [Text] [Visual] -> Text(R), Visual(L)
                            Personal: [Visual] [Text] -> Visual(R), Text(L)
                        */}

                    {/* Visual representation of personal dashboard */}
                    <div className="order-2 md:order-1 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="text-xs font-bold text-gray-400">PERSONAL DASHBOARD</div>
                            </div>
                            <div className="space-y-3">
                                <div className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                                            <PieChart className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-gray-700">הוצאות החודש</span>
                                    </div>
                                    <span className="font-bold text-lg">₪12,450</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                                        <div className="text-purple-600 text-xs font-bold mb-1">חסכונות</div>
                                        <div className="text-xl font-bold text-gray-800">₪45k</div>
                                    </div>
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                                        <div className="text-orange-600 text-xs font-bold mb-1">חובות</div>
                                        <div className="text-xl font-bold text-gray-800">₪12k</div>
                                    </div>
                                </div>

                                <div className="bg-white border rounded-xl p-3">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-gray-500">תקציב סופר ופארם</span>
                                        <span className="font-bold text-red-500">חרגת ב-₪200</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                        <div className="bg-red-500 w-[110%] h-full rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Text Side */}
                    <div className="order-1 md:order-2">
                        <span className="inline-block px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-full mb-4">
                            הפתרון המושלם למשק הבית
                        </span>
                        <h2 className="text-3xl font-bold mb-4 text-gray-900">
                            כל הכסף של המשפחה במקום אחד
                        </h2>
                        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                            לא עוד אקסלים מסובכים. קבלו שליטה מלאה על ההוצאות, נהלו תקציב משותף,
                            וצפו בעתיד הכלכלי שלכם בבהירות. המערכת עוזרת לכם לחסוך יותר ולצאת מהמינוס.
                        </p>

                        <ul className="space-y-3 mb-8">
                            <BusinessFeature text="סנכרון אוטומטי של כל בני המשפחה" />
                            <BusinessFeature text="התראות חכמות על חריגה מהתקציב" />
                            <BusinessFeature text="ניהול חובות והלוואות חכם" />
                            <BusinessFeature text="תכנון יעדי חיסכון לעתיד" />
                        </ul>

                        <SignedOut>
                            <SignUpButton mode="modal">
                                <button className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all">
                                    התחל בחינם
                                </button>
                            </SignUpButton>
                        </SignedOut>
                    </div>

                </div>
            </div>

            {/* Business Solution Section */}
            <div className="mb-20 bg-green-50 p-8 md:p-12 rounded-3xl border border-green-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20 -ml-32 -mb-32"></div>

                <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <span className="inline-block px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded-full mb-4">
                            חדש! לבעלי עסקים ועצמאיים
                        </span>
                        <h2 className="text-3xl font-bold mb-4 text-gray-900">
                            המשרד הדיגיטלי שלך לניהול העסק
                        </h2>
                        <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                            אל תיתן לכספי העסק והבית להתערבב. ב-Business Plan אתה מקבל הפרדה מלאה,
                            דוחות מע"מ אוטומטיים, חישוב הוצאות מוכרות, ותמונת מצב עסקית בזמן אמת.
                        </p>

                        <ul className="space-y-3 mb-8">
                            <BusinessFeature text="הפרדה מוחלטת בין פרופיל אישי לעסקי" />
                            <BusinessFeature text="חישובי מע״מ (כולל פטור ומעורב) והכנה לדיווח" />
                            <BusinessFeature text="ניהול תזרים מזומנים (כולל שוטף+)" />
                            <BusinessFeature text="דוחות רווח והפסד בזמן אמת" />
                        </ul>

                        <SignedOut>
                            <SignUpButton mode="modal">
                                <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg">
                                    התנסות חינם בתוכנית העסקית
                                </button>
                            </SignUpButton>
                        </SignedOut>
                        <SignedIn>
                            <Link href="/subscribe/plans">
                                <button className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg">
                                    שדרג לתוכנית עסקית
                                </button>
                            </Link>
                        </SignedIn>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                        {/* Visual representation of business dashboard */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                </div>
                                <div className="text-xs font-bold text-gray-400">BUSINESS DASHBOARD</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <div className="text-green-600 text-xs font-bold mb-1">הכנסות החודש</div>
                                    <div className="text-2xl font-bold text-gray-800">₪42,500</div>
                                    <div className="text-xs text-green-600 mt-1 flex items-center justify-end gap-1">
                                        מחודש שעבר
                                        <span dir="ltr" className="font-bold">+12%</span>
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <div className="text-blue-600 text-xs font-bold mb-1">מע"מ לתשלום</div>
                                    <div className="text-2xl font-bold text-gray-800">₪6,120</div>
                                    <div className="text-xs text-blue-600 mt-1">עד ה-15 לחודש</div>
                                </div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">הוצאות מוכרות</span>
                                    <span className="font-bold">₪12,800</span>
                                </div>
                                <div className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">רווח נקי משוער</span>
                                    <span className="font-bold text-green-600">₪23,580</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
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
                    <BenefitItem text="ממשק ידידותי ובעברית" />
                    <BenefitItem text="גישה מכל מכשיר ומכל מקום" />
                </div>
            </div>
        </div>
        </div >
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

function BusinessFeature({ text }: { text: string }) {
    return (
        <li className="flex items-center gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-200 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-green-600"></div>
            </div>
            <span className="font-medium text-gray-800">{text}</span>
        </li>
    )
}
