'use client'

import Link from 'next/link'
import { SignInButton, SignUpButton, SignedIn, SignedOut } from '@clerk/nextjs'
import { ArrowLeft, Calendar, PieChart, TrendingUp, Wallet, ShieldCheck, Smartphone, Bell, BarChart3, Receipt, CreditCard, LayoutDashboard } from 'lucide-react'
import Image from 'next/image'
import SecurityBadge from '@/components/SecurityBadge'
import { motion } from 'framer-motion'

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5
        }
    }
}

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 font-sans" dir="rtl">
            <div className="container mx-auto px-4 py-16">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16"
                >
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Image
                                src="/K-LOGO.png"
                                alt="Keseflow"
                                width={600}
                                height={180}
                                className="h-20 md:h-32 w-auto"
                                priority
                            />
                        </motion.div>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="text-xl text-muted-foreground max-w-2xl mx-auto"
                    >
                        שליטה מלאה בתזרים המזומנים שלך – כל הכלים לצמיחה כלכלית במקום אחד.
                        מערכת מקיפה לניהול תקציב, מעקב הוצאות, תכנון חובות וחיסכון.
                    </motion.p>
                </motion.div>

                {/* Personal Solution Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={itemVariants}
                    className="mb-20 bg-blue-50 p-8 md:p-12 rounded-3xl border border-blue-200 relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500"
                >
                    <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20 -ml-32 -mt-32 animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-200 rounded-full blur-3xl opacity-20 -mr-32 -mb-32 animate-pulse"></div>

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        {/* Visual Side */}
                        <motion.div
                            variants={itemVariants}
                            className="order-2 md:order-1 bg-white p-6 rounded-2xl shadow-xl border border-gray-100 transform -rotate-1 hover:rotate-0 transition-transform duration-500"
                        >
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <div className="flex gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-400">PERSONAL DASHBOARD</div>
                                </div>

                                {/* Main Balance Card */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-2xl border border-blue-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="text-right flex-1">
                                            <div className="text-sm text-blue-700 font-medium mb-1">הוצאות החודש</div>
                                            <div className="text-3xl font-bold text-gray-900">₪12,450</div>
                                        </div>
                                        <div className="p-2.5 bg-blue-200/50 rounded-xl">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                    </div>
                                </div>

                                {/* Income and Savings Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-2xl border border-purple-200 text-right">
                                        <div className="text-purple-700 text-sm font-bold mb-2">חסכונות</div>
                                        <div className="text-2xl font-bold text-gray-900">₪45,000</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-2xl border border-orange-200 text-right">
                                        <div className="text-orange-700 text-sm font-bold mb-2">הכנסות</div>
                                        <div className="text-2xl font-bold text-gray-900">₪12,000</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Text Side */}
                        <motion.div variants={itemVariants} className="order-1 md:order-2">
                            <span className="inline-block px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-full mb-4">
                                הפתרון המושלם למשק הבית
                            </span>
                            <h2 className="text-3xl font-bold mb-4 text-gray-900">
                                כל הכסף של המשפחה במקום אחד
                            </h2>
                            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                                לא עוד אקסלים מסובכים. קבלו שליטה מלאה על ההוצאות, נהלו תקציב משותף,
                                וצפו בעתיד הכלכלי שלכם בבהירות.
                            </p>

                            <ul className="space-y-3 mb-8">
                                <BusinessFeature text="סנכרון אוטומטי של כל בני המשפחה" />
                                <BusinessFeature text="התראות חכמות על חריגה מהתקציב" />
                                <BusinessFeature text="ניהול חובות והלוואות חכם" />
                            </ul>

                            <SignedOut>
                                <SignUpButton mode="modal">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-xl font-bold hover:bg-blue-50 transition-all"
                                    >
                                        התחל בחינם
                                    </motion.button>
                                </SignUpButton>
                            </SignedOut>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Business Solution Section */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={itemVariants}
                    className="mb-20 bg-green-50 p-8 md:p-12 rounded-3xl border border-green-200 relative overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-500"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-green-200 rounded-full blur-3xl opacity-20 -mr-32 -mt-32 animate-pulse duration-1000"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20 -ml-32 -mb-32 animate-pulse duration-1000"></div>

                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                        <motion.div variants={itemVariants}>
                            <span className="inline-block px-4 py-1.5 bg-green-600 text-white text-sm font-bold rounded-full mb-4">
                                חדש! לבעלי עסקים ועצמאיים
                            </span>
                            <h2 className="text-3xl font-bold mb-4 text-gray-900">
                                המשרד הדיגיטלי שלך לניהול העסק
                            </h2>
                            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                                שליטה מלאה על הפיננסים של העסק שלך. כלי ניהול מתקדמים,
                                דוחות מע"מ אוטומטיים, וחישוב הוצאות מוכרות.
                            </p>

                            <ul className="space-y-3 mb-8">
                                <BusinessFeature text="ניהול מלא של כספי העסק באתר" />
                                <BusinessFeature text="חישובי מע״מ ודוחות בזמן אמת" />
                                <BusinessFeature text="ניהול תזרים מזומנים (כולל שוטף+)" />
                            </ul>

                            <motion.div whileHover={{ scale: 1.02 }}>
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
                            </motion.div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100"
                        >
                            {/* Visual representation of business dashboard */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center border-b pb-4">
                                    <div className="text-xs font-bold text-gray-400">BUSINESS DASHBOARD</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                                        <div className="text-green-700 text-xs font-bold mb-1">הכנסות החודש</div>
                                        <div className="text-xl font-bold text-gray-900">₪42,500</div>
                                    </div>
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                                        <div className="text-blue-700 text-xs font-bold mb-1">מע״מ לדיווח</div>
                                        <div className="text-xl font-bold text-gray-900">₪6,120</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>


                {/* Features List - REDESIGNED */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={containerVariants}
                    className="mt-32 max-w-6xl mx-auto"
                >
                    <motion.h3 variants={itemVariants} className="text-3xl font-bold text-center mb-16 text-gray-900">
                        כל מה שאתם צריכים כדי להצליח
                    </motion.h3>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <FeatureCard
                            icon={<LayoutDashboard className="w-8 h-8 text-blue-500" />}
                            title="ממשק חכם ובעברית"
                            description="חווית משתמש פשוטה ונוחה, מותאמת במיוחד לקהל הישראלי"
                        />
                        <FeatureCard
                            icon={<PieChart className="w-8 h-8 text-purple-500" />}
                            title="מעקב הכנסות והוצאות"
                            description="שיוך קטגוריות אוטומטי וניתוח מעמיק של הרגלי הצריכה"
                        />
                        <FeatureCard
                            icon={<Calendar className="w-8 h-8 text-green-500" />}
                            title="לוח שנה ותזכורות"
                            description="לא מפספסים תשלומים עם התראות חכמות ותצוגת לוח שנה"
                        />
                        <FeatureCard
                            icon={<BarChart3 className="w-8 h-8 text-orange-500" />}
                            title="גרפים ודוחות"
                            description="ויזואליזציה צבעונית וברורה של המצב הפיננסי בזמן אמת"
                        />
                        <FeatureCard
                            icon={<CreditCard className="w-8 h-8 text-indigo-500" />}
                            title="חשבונות קבועים"
                            description="ניהול הוראות קבע ומנויים בצורה מרוכזת ומסודרת"
                        />
                        <FeatureCard
                            icon={<Receipt className="w-8 h-8 text-red-500" />}
                            title="ניהול חובות"
                            description="בניית תוכנית להחזרת חובות יציאה מהמינוס"
                        />
                        <FeatureCard
                            icon={<ShieldCheck className="w-8 h-8 text-teal-500" />}
                            title="אבטחה מתקדמת"
                            description="הצפנה ברמה בנקאית לשמירה על הפרטיות והמידע שלכם"
                        />
                        <FeatureCard
                            icon={<Smartphone className="w-8 h-8 text-gray-700" />}
                            title="נגישות מכל מקום"
                            description="גישה מלאה לנתונים מהמחשב, מהטאבלט ומהנייד"
                        />
                    </div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mt-12"
                >
                    <SignedOut>
                        <div className="space-y-6">
                            <h2 className="text-4xl font-bold mb-2">מוכן להתחיל?</h2>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                הצטרפו לאלפי משתמשים שכבר לקחו שליטה על העתיד הכלכלי שלהם
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <SignUpButton mode="modal">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xl hover:opacity-90 transition-all shadow-xl hover:shadow-2xl"
                                    >
                                        הרשמה חינם
                                    </motion.button>
                                </SignUpButton>
                                <SignInButton mode="modal">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="px-10 py-4 bg-white border-2 border-primary text-primary rounded-2xl font-bold text-xl hover:bg-green-50 transition-all"
                                    >
                                        כניסה למערכת
                                    </motion.button>
                                </SignInButton>
                            </div>
                        </div>
                    </SignedOut>

                    <SignedIn>
                        <Link href="/dashboard">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-10 py-5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl font-bold text-xl hover:shadow-2xl transition-all shadow-xl inline-flex items-center gap-3"
                            >
                                כניסה לדשבורד
                                <ArrowLeft className="w-6 h-6" />
                            </motion.button>
                        </Link>
                    </SignedIn>
                </motion.div>

            </div>
            <SecurityBadge />
        </div>
    )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 text-center group cursor-pointer"
        >
            <div className="mb-4 inline-flex p-3 rounded-2xl bg-gray-50 group-hover:bg-green-50 transition-colors">
                {icon}
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-green-600 transition-colors">{title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        </motion.div>
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
