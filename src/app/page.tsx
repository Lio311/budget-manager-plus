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

            {/* Live App Showcase (Bento Grid) */}
            <div className="mb-24">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">ניהול חכם, פשוט וויזואלי</h2>
                    <p className="text-lg text-muted-foreground">כל מה שצריך כדי לקבל החלטות פיננסיות נכונות - במבט אחד</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Card 1: Budget Control */}
                    <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <PieChart className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl">תקציב חודשי חי</h3>
                        </div>
                        <div className="space-y-4">
                            <MockProgressBar category="מזון וסופר" spent={2400} limit={3000} color="bg-blue-500" />
                            <MockProgressBar category="דלק ותחבורה" spent={850} limit={800} color="bg-red-500" warning />
                            <MockProgressBar category="בילויים ומסעדות" spent={400} limit={1200} color="bg-green-500" />
                        </div>
                    </div>

                    {/* Card 2: Upcoming Bills */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl">תשלומים קרובים</h3>
                        </div>
                        <div className="space-y-3">
                            <MockBillItem name="חשמל" date="15/11" amount={450} />
                            <MockBillItem name="ארנונה" date="20/11" amount={780} />
                            <MockBillItem name="נטפליקס" date="28/11" amount={60} isAuto />
                        </div>
                        <div className="mt-4 pt-4 border-t text-center text-sm text-gray-500">
                            סה"כ לתשלום החודש: ₪1,290
                        </div>
                    </div>

                    {/* Card 3: Savings Goals */}
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-xl">יעדי חיסכון</h3>
                        </div>
                        <div className="flex items-end gap-4 justify-between px-2">
                            <MockSavingsBar label="חופשה" percent={70} />
                            <MockSavingsBar label="רכב חדש" percent={45} />
                            <MockSavingsBar label="דירה" percent={20} />
                            <MockSavingsBar label="חירום" percent={90} />
                        </div>
                    </div>

                    {/* Card 4: Debts & Loans */}
                    <div className="col-span-1 md:col-span-2 bg-white p-6 rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-red-50 rounded-full blur-2xl -ml-10 -mt-10"></div>

                        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <h3 className="font-bold text-xl">ניהול חובות</h3>
                                </div>
                                <p className="text-gray-600">
                                    קבל תמונת מצב מדויקת על כל ההלוואות והחובות שלך.
                                    המערכת תעזור לך לתכנן את ההחזר האופטימלי ולצאת מהמינוס.
                                </p>
                                <div className="flex gap-4 mt-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-800">12</div>
                                        <div className="text-xs text-gray-500">תשלומים נותרו</div>
                                    </div>
                                    <div className="w-px bg-gray-200"></div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-800">₪1,450</div>
                                        <div className="text-xs text-gray-500">החזר חודשי</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl w-full md:w-auto min-w-[200px]">
                                <div className="text-sm text-red-600 font-bold mb-1">יתרה לסיום</div>
                                <div className="text-3xl font-bold text-gray-900">₪15,200</div>
                                <div className="w-full bg-red-200 h-2 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-red-500 h-full w-[65%] rounded-full"></div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 text-left" dir="ltr">65% Paid</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legacy Mobile Features (Hidden on MD+, visible only if needed layout adjustment) - Actually we replaced them entirely. */}
            <div className="hidden">

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

// Mock UI Components for Landing Page
function MockProgressBar({ category, spent, limit, color, warning }: { category: string, spent: number, limit: number, color: string, warning?: boolean }) {
    const percent = Math.min((spent / limit) * 100, 100)
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{category}</span>
                <span className={`font-bold ${warning ? 'text-red-500' : 'text-gray-500'}`}>
                    {spent}/{limit}
                </span>
            </div>
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }}></div>
            </div>
        </div>
    )
}

function MockBillItem({ name, date, amount, isAuto }: { name: string, date: string, amount: number, isAuto?: boolean }) {
    return (
        <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
            <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${isAuto ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                <span className="text-gray-700 font-medium">{name}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className="font-bold text-gray-900">₪{amount}</span>
                <span className="text-[10px] text-gray-400">{date}</span>
            </div>
        </div>
    )
}

function MockSavingsBar({ label, percent }: { label: string, percent: number }) {
    return (
        <div className="flex flex-col items-center gap-2 group cursor-pointer w-full">
            <div className="w-full bg-gray-100 rounded-t-lg relative h-24 flex items-end overflow-hidden">
                <div
                    className="w-full bg-green-400 opacity-80 group-hover:opacity-100 transition-all duration-500"
                    style={{ height: `${percent}%` }}
                ></div>
            </div>
            <span className="text-xs font-medium text-gray-600">{label}</span>
        </div>
    )
}
