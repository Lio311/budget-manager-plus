'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion'
import { Check, ChevronDown, Shield, TrendingUp, Smartphone, PieChart, Star, ArrowLeft, Building2, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PremiumLandingPage() {
    const targetRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    })

    const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.9])
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.5])

    // Smooth scroll physics
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })

    return (
        <div ref={targetRef} className="min-h-screen bg-white font-sans overflow-x-hidden selection:bg-green-100 selection:text-green-900" dir="rtl">

            {/* Navbar Placeholder */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100/50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Image src="/K-LOGO.png" alt="Logo" width={120} height={40} className="h-8 w-auto" />
                    </div>
                    <div className="flex gap-4">
                        <Link href="/sign-in">
                            <Button variant="ghost" className="hover:bg-gray-100/50 rounded-full font-medium">כניסה</Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button className="bg-gray-900 text-white hover:bg-black rounded-full px-6 font-medium shadow-lg hover:shadow-xl transition-all">הצטרפות</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-100/40 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                        {/* Hero Text */}
                        <motion.div
                            style={{ opacity: heroOpacity, scale: heroScale }}
                            className="flex-1 text-center lg:text-right"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="inline-block py-1 px-3 rounded-full bg-green-50 border border-green-100 text-green-700 text-sm font-bold mb-6">
                                    ✨ המהפכה בניהול הפיננסי כבר כאן
                                </span>
                                <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-6 tracking-tight">
                                    לשלוט בכסף שלך, <br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-l from-green-600 to-emerald-400">
                                        בסטייל.
                                    </span>
                                </h1>
                                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                    המערכת המתקדמת בישראל לניהול תקציב אישי ועסקי.
                                    כל הכלים שצריך כדי לצמוח, בממשק אחד יפהפה ונוח.
                                </p>

                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-gray-900 hover:bg-black shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                                        להתחיל חינם עכשיו
                                    </Button>
                                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-2 hover:bg-gray-50">
                                        איך זה עובד?
                                    </Button>
                                </div>

                                <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500 font-medium">
                                    <div className="flex -space-x-2 space-x-reverse">
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200" />
                                        ))}
                                    </div>
                                    <p>הצטרפו ל-5,000+ משתמשים מרוצים</p>
                                </div>
                            </motion.div>
                        </motion.div>

                        {/* Hero Image - Phone */}
                        <motion.div
                            initial={{ opacity: 0, x: 50, rotate: -5 }}
                            animate={{ opacity: 1, x: 0, rotate: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                            className="flex-1 relative"
                        >
                            <div className="relative z-10 transform hover:scale-[1.02] transition-transform duration-500">
                                <Image
                                    src="/assets/hero-phone.png"
                                    alt="App Interface"
                                    width={600}
                                    height={1200}
                                    className="w-full max-w-[400px] mx-auto drop-shadow-2xl"
                                    priority
                                />

                                {/* Floating Elements */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute top-[20%] -left-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden md:block" // Removed small devices
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-lg text-green-600"><TrendingUp size={20} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold">חיסכון החודש</p>
                                            <p className="text-lg font-bold text-gray-900">+₪2,450</p>
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                    className="absolute bottom-[20%] -right-4 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden md:block"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Shield size={20} /></div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-bold">סטטוס אבטחה</p>
                                            <p className="text-lg font-bold text-gray-900">מוגן 100%</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* FEATURES SCROLL SECTION */}
            <section className="py-24 bg-gray-50/50">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-bold mb-4">יותר מסתם מעקב הוצאות</h2>
                        <p className="text-xl text-gray-600 text-center">בנינו מערכת שמבינה את הצרכים שלך, בין אם אתה סטודנט, משפחה או בעל עסק.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <ScrollRevealCard
                            icon={<PieChart className="w-8 h-8 text-purple-500" />}
                            title="ניתוח חכם"
                            description="דוחות שמסבירים לך בדיוק לאן הכסף הולך, בצורה ויזואלית ופשוטה להבנה."
                            delay={0}
                        />
                        <ScrollRevealCard
                            icon={<Smartphone className="w-8 h-8 text-blue-500" />}
                            title="תמיד איתך"
                            description="גישה מלאה מכל מקום - מהנייד, מהמחשב או מהטאבלט. הנתונים תמיד מסונכרנים."
                            delay={0.2}
                        />
                        <ScrollRevealCard
                            icon={<Building2 className="w-8 h-8 text-orange-500" />}
                            title="תמיכה עסקית"
                            description="מודול מיוחד לעסקים קטנים - מעקב מע״מ, הפקת קבלות וניהול תזרים מזומנים."
                            delay={0.4}
                        />
                    </div>
                </div>
            </section>


            {/* PRICING SECTION */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/30 to-white" />
                <div className="container mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">מחיר שקוף, תמורה מלאה</h2>
                        <p className="text-xl text-gray-600">בחרו את המסלול המתאים ביותר עבורכם</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                        {/* Personal Plan */}
                        <PricingCard
                            title="מנוי אישי"
                            price="₪89"
                            period="לשנה"
                            features={[
                                "ניהול תקציב חודשי",
                                "מעקב הכנסות והוצאות",
                                "ניהול חובות וחסכונות",
                                "דוחות מתקדמים"
                            ]}
                            highlight={false}
                        />

                        {/* Combined Plan - Highlighted */}
                        <div className="relative transform md:-translate-y-4">
                            <div className="absolute -inset-1 bg-gradient-to-r from-green-400 to-emerald-600 rounded-3xl blur opacity-30" />
                            <PricingCard
                                title="משולב (מומלץ)"
                                price="₪169"
                                period="לשנה"
                                description="הטוב משני העולמות"
                                features={[
                                    "כל הפיצ'רים של האישי",
                                    "כל הפיצ'רים של העסקי",
                                    "מעבר מהיר בין המצבים",
                                    "חיסכון של 49 ₪"
                                ]}
                                highlight={true}
                                badge="פופולרי בטירוף 🔥"
                            />
                        </div>

                        {/* Business Plan */}
                        <PricingCard
                            title="עסקי (SMB)"
                            price="₪129"
                            period="לשנה"
                            features={[
                                "ניהול מע״מ ודיווחים",
                                "תזרים מזומנים עסקי",
                                "פרופיל עסקי מלא",
                                "ניהול נכסים ופחת"
                            ]}
                            highlight={false}
                        />
                    </div>
                </div>
            </section>

            {/* FAQ SECTION */}
            <section className="py-24 bg-gray-50">
                <div className="container mx-auto px-6 max-w-3xl">
                    <h2 className="text-4xl font-bold mb-12 text-center">שאלות נפוצות</h2>
                    <div className="w-full space-y-4">
                        <FAQItem
                            question="האם המידע שלי מאובטח?"
                            answer="כן, לחלוטין. אנחנו משתמשים בהצפנה ברמת הבנקים (SSL/TLS) כדי להגן על כל המידע שעובר במערכת. הנתונים נשמרים בשרתים מאובטחים ואינם משותפים עם אף גורם צד שלישי."
                        />
                        <FAQItem
                            question="האם יש תקופת ניסיון?"
                            answer="בוודאי! כל משתמש חדש מקבל חודש ניסיון חינם לכל המסלולים, ללא צורך בהזנת פרטי אשראי. תנסו, תאהבו - תישארו."
                        />
                        <FAQItem
                            question="האם אפשר לבטל את המנוי?"
                            answer="ניתן לבטל את החידוש האוטומטי בכל רגע נתון דרך הגדרות החשבון. המנוי יישאר פעיל עד סוף התקופה ששולמה."
                        />
                        <FAQItem
                            question="האם המערכת מתאימה לעוסק מורשה?"
                            answer="כן! המסלול העסקי והמשולב נבנו במיוחד עבור עוסקים פטורים ומורשים, וכוללים חישובי מע״מ, דוחות מס והכרה בהוצאות."
                        />
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-gray-900 text-white py-16">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div>
                            <Image src="/K-LOGO.png" alt="Logo" width={150} height={50} className="h-10 w-auto brightness-0 invert opacity-80" />
                            <p className="text-gray-400 mt-4 text-sm">הבית הפיננסי החדש שלך.</p>
                        </div>
                        <div className="flex gap-8 text-sm text-gray-400">
                            <Link href="/terms" className="hover:text-white transition">תנאי שימוש</Link>
                            <Link href="/privacy" className="hover:text-white transition">מדיניות פרטיות</Link>
                            <Link href="/contact" className="hover:text-white transition">צור קשר</Link>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs text-gray-500">
                        © {new Date().getFullYear()} Keseflow. כל הזכויות שמורות.
                    </div>
                </div>
            </footer>
        </div>
    )
}

function ScrollRevealCard({ icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay, ease: "easeOut" }}
            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-shadow text-center group"
        >
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
            <p className="text-gray-500 leading-relaxed font-medium">{description}</p>
        </motion.div>
    )
}

function PricingCard({ title, price, period, features = [], highlight, description, badge }: any) {
    return (
        <motion.div className={`
            relative p-8 rounded-3xl border 
            ${highlight ? 'bg-gray-900 text-white border-gray-900 z-10 shadow-2xl' : 'bg-white text-gray-900 border-gray-200 shadow-xl'}
            flex flex-col
        `}>
            {badge && (
                <div className="absolute -top-4 right-0 left-0 flex justify-center">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                        {badge}
                    </span>
                </div>
            )}

            <div className="mb-8">
                <h3 className={`text-xl font-bold mb-2 ${highlight ? 'text-gray-100' : 'text-gray-800'}`}>{title}</h3>
                {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
                <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black">{price}</span>
                    <span className={`text-sm ${highlight ? 'text-gray-400' : 'text-gray-500'}`}>{period}</span>
                </div>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {(features || []).map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm font-medium opacity-90">
                        <Check size={20} className={highlight ? 'text-green-400' : 'text-green-600'} />
                        {feature}
                    </li>
                ))}
            </ul>

            <Button className={`w-full py-6 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all ${highlight ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                בחר מסלול
            </Button>
        </motion.div>
    )
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-right"
            >
                <span className="text-lg font-bold text-gray-900">{question}</span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-6 text-gray-600 leading-relaxed text-right">
                            {answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
