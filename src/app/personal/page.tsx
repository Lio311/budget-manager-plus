'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Menu, X, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PersonalLandingPage() {
    const [currentSection, setCurrentSection] = useState(0)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolling, setIsScrolling] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const sections = [
        {
            id: 0,
            title: 'KESEFLOW',
            subtitle: 'ניהול פיננסי אישי חכם',
            description: 'המערכת המתקדמת בישראל לניהול תקציב אישי. כל הכלים שצריך כדי לשלוט בכסף שלך, בממשק אחד יפהפה ונוח.',
            bgColor: 'from-slate-900 via-slate-800 to-slate-900',
            textColor: 'text-white',
            accentColor: 'emerald',
            image: '/screenshots/personal/home.png'
        },
        {
            id: 1,
            number: '01',
            title: 'הכנסות',
            subtitle: 'עקוב אחר כל שקל',
            description: 'רשום ועקוב אחר כל מקורות ההכנסה שלך - משכורת, פרילנס, השקעות ועוד. המערכת תעזור לך להבין מאיפה הכסף מגיע ולזהות הזדמנויות לגידול. קבל תובנות על מגמות ההכנסה שלך לאורך זמן ותכנן את העתיד בביטחון.',
            bgColor: 'from-green-600 via-green-700 to-green-900',
            textColor: 'text-white',
            accentColor: 'green',
            tag: 'מעקב | ניתוח | תובנות',
            image: '/screenshots/personal/income.png'
        },
        {
            id: 2,
            number: '02',
            title: 'הוצאות',
            subtitle: 'שליטה מלאה בהוצאות',
            description: 'עקוב אחר כל הוצאה קטנה וגדולה עם קטגוריזציה אוטומטית חכמה. המערכת מנתחת את הרגלי ההוצאה שלך, מזהה דפוסים ומציעה דרכים לחסוך. קבל התראות כשאתה מתקרב לגבול התקציב ותראה בדיוק לאן הכסף הולך עם גרפים ויזואליים ברורים.',
            bgColor: 'from-red-600 via-red-700 to-red-900',
            textColor: 'text-white',
            accentColor: 'red',
            tag: 'מעקב | קטגוריזציה | ניתוח',
            image: '/screenshots/personal/expenses.png'
        },
        {
            id: 3,
            number: '03',
            title: 'חשבונות קבועים',
            subtitle: 'אף פעם לא תפספס תשלום',
            description: 'נהל את כל החשבונות החודשיים שלך במקום אחד - חשמל, מים, ארנונה, ביטוחים ועוד. קבל תזכורות חכמות לפני מועד התשלום, עקוב אחר היסטוריית התשלומים וזהה שינויים חריגים בסכומים. המערכת תעזור לך לתכנן את תזרים המזומנים ולהימנע מקנסות איחור.',
            bgColor: 'from-orange-600 via-orange-700 to-orange-900',
            textColor: 'text-white',
            accentColor: 'orange',
            tag: 'תזכורות | מעקב | תזרים',
            image: '/screenshots/personal/bills.png'
        },
        {
            id: 4,
            number: '04',
            title: 'הלוואות',
            subtitle: 'נהל חובות בחוכמה',
            description: 'עקוב אחר כל ההלוואות והחובות שלך - משכנתא, הלוואות בנק, כרטיסי אשראי ועוד. ראה בבירור כמה נשאר לשלם, מתי מועד התשלום הבא וכמה ריבית אתה משלם. המערכת תעזור לך לתכנן אסטרטגיית פירעון חכמה ולחסוך בריבית.',
            bgColor: 'from-purple-600 via-purple-700 to-purple-900',
            textColor: 'text-white',
            accentColor: 'purple',
            tag: 'מעקב | תכנון | חיסכון',
            image: '/screenshots/personal/loans.png'
        },
        {
            id: 5,
            number: '05',
            title: 'חסכונות',
            subtitle: 'בנה את העתיד שלך',
            description: 'הגדר יעדי חיסכון ברורים - קרן חירום, חופשה, דירה חדשה או כל מטרה אחרת. עקוב אחר ההתקדמות שלך עם גרפים מעוצבים, קבל המלצות חכמות להגדלת החיסכון וחגוג כל אבן דרך. המערכת תעזור לך להפוך חלומות למציאות עם תכנון פיננסי נכון.',
            bgColor: 'from-blue-600 via-blue-700 to-blue-900',
            textColor: 'text-white',
            accentColor: 'blue',
            tag: 'יעדים | מעקב | המלצות',
            image: '/screenshots/personal/savings.png'
        },
        {
            id: 6,
            number: '06',
            title: 'תקציבים',
            subtitle: 'תכנן חודש מושלם',
            description: 'צור תקציב חודשי מפורט לכל קטגוריה - מזון, בילויים, תחבורה ועוד. המערכת תעקוב אחר ההוצאות שלך בזמן אמת ותתריע כשאתה מתקרב לגבול. קבל תובנות על איפה אתה חורג ואיפה אתה חוסך, והתאם את התקציב בהתאם להרגלים שלך.',
            bgColor: 'from-yellow-500 via-yellow-600 to-yellow-700',
            textColor: 'text-white',
            accentColor: 'yellow',
            tag: 'תכנון | מעקב | התראות',
            image: '/screenshots/personal/budget.png'
        },
        {
            id: 7,
            number: '07',
            title: 'לוח שנה',
            subtitle: 'ראה את התמונה המלאה',
            description: 'צפה בכל האירועים הפיננסיים שלך בלוח שנה אינטראקטיבי - תשלומים צפויים, הכנסות, יעדי חיסכון ועוד. תכנן מראש, זהה חודשים כבדים והיערך בהתאם. הלוח מסונכרן עם כל המערכת ומעודכן אוטומטית, כך שתמיד תדע מה מחכה לך.',
            bgColor: 'from-teal-600 via-teal-700 to-teal-900',
            textColor: 'text-white',
            accentColor: 'teal',
            tag: 'תכנון | סנכרון | תצוגה',
            image: '/screenshots/personal/calendar.png'
        }
    ]

    const touchStart = useRef<number | null>(null)

    const handleWheel = (e: WheelEvent) => {
        if (isScrolling) return

        e.preventDefault()
        setIsScrolling(true)

        if (e.deltaY > 0 && currentSection < sections.length - 1) {
            setCurrentSection(prev => prev + 1)
        } else if (e.deltaY < 0 && currentSection > 0) {
            setCurrentSection(prev => prev - 1)
        }

        setTimeout(() => setIsScrolling(false), 1000)
    }

    const handleTouchStart = (e: TouchEvent) => {
        touchStart.current = e.touches[0].clientY
    }

    const handleTouchEnd = (e: TouchEvent) => {
        if (isScrolling || touchStart.current === null) return

        const touchEnd = e.changedTouches[0].clientY
        const deltaY = touchStart.current - touchEnd

        if (Math.abs(deltaY) > 50) {
            setIsScrolling(true)
            if (deltaY > 0 && currentSection < sections.length - 1) {
                setCurrentSection(prev => prev + 1)
            } else if (deltaY < 0 && currentSection > 0) {
                setCurrentSection(prev => prev - 1)
            }
            setTimeout(() => setIsScrolling(false), 1000)
        }
        touchStart.current = null
    }

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        container.addEventListener('wheel', handleWheel, { passive: false })
        container.addEventListener('touchstart', handleTouchStart, { passive: true })
        container.addEventListener('touchend', handleTouchEnd, { passive: true })

        return () => {
            container.removeEventListener('wheel', handleWheel)
            container.removeEventListener('touchstart', handleTouchStart)
            container.removeEventListener('touchend', handleTouchEnd)
        }
    }, [currentSection, isScrolling])

    return (
        <div ref={containerRef} className="h-screen w-full overflow-hidden relative selection:bg-emerald-500/30" dir="rtl">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2"
                    >
                        <Link href="/">
                            <Image src="/K-LOGO2.png" alt="Keseflow" width={140} height={40} className="h-10 w-auto brightness-0 invert" />
                        </Link>
                    </motion.div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link href="/sign-in">
                            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full px-6">
                                כניסה
                            </Button>
                        </Link>
                        <Link href="/sign-up">
                            <Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-0">
                                התחל עכשיו
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden text-white p-2"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-40 md:hidden flex flex-col items-center justify-center gap-8"
                    >
                        <Link href="/sign-in" onClick={() => setIsMenuOpen(false)}>
                            <Button variant="ghost" size="lg" className="text-white text-2xl rounded-2xl">
                                כניסה
                            </Button>
                        </Link>
                        <Link href="/sign-up" onClick={() => setIsMenuOpen(false)}>
                            <Button size="lg" className="bg-white text-gray-900 text-2xl px-12 rounded-2xl shadow-2xl">
                                התחל עכשיו
                            </Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Section Indicators */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
                {sections.map((section, index) => (
                    <button
                        key={section.id}
                        onClick={() => setCurrentSection(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSection === index ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'
                            }`}
                    />
                ))}
            </div>

            {/* Sections */}
            <div
                className="h-full transition-transform duration-1000 ease-in-out"
                style={{ transform: `translateY(-${currentSection * 100}vh)` }}
            >
                {sections.map((section, index) => (
                    <Section
                        key={section.id}
                        section={section}
                        isActive={currentSection === index}
                        index={index}
                    />
                ))}
            </div>

            {/* Scroll Indicator */}
            {currentSection < sections.length - 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed bottom-8 right-1/2 translate-x-1/2 z-50 flex flex-col items-center gap-2"
                >
                    <span className="text-white/60 text-sm">גלול למטה</span>
                    <motion.div
                        animate={{ y: [0, 10, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <ChevronDown className="text-white/60" size={24} />
                    </motion.div>
                </motion.div>
            )}

            {/* Footer on Last Section */}
            {currentSection === sections.length - 1 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10 py-6 z-40"
                >
                    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white/60 text-sm">
                        <p>© 2026 Keseflow. כל הזכויות שמורות.</p>
                        <div className="flex gap-6">
                            <Link href="/terms" className="hover:text-white transition">תנאי שימוש</Link>
                            <Link href="/privacy" className="hover:text-white transition">פרטיות</Link>
                            <Link href="/contact" className="hover:text-white transition">צור קשר</Link>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    )
}

function Section({ section, isActive, index }: { section: any, isActive: boolean, index: number }) {
    return (
        <div className={`h-screen w-full relative overflow-hidden bg-gradient-to-br ${section.bgColor}`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 h-full flex items-center relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center w-full">
                    {/* Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-right"
                    >
                        {section.number && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-white/30 text-8xl font-black mb-4"
                            >
                                {section.number}
                            </motion.div>
                        )}

                        {section.tag && (
                            <motion.span
                                initial={{ opacity: 0, y: 20 }}
                                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                transition={{ delay: 0.4 }}
                                className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/80 text-sm mb-6 border border-white/20"
                            >
                                {section.tag}
                            </motion.span>
                        )}

                        <motion.h1
                            initial={{ opacity: 0, y: 30 }}
                            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ delay: 0.5 }}
                            className={`text-6xl md:text-8xl font-black ${section.textColor} mb-4 leading-none`}
                        >
                            {section.title}
                        </motion.h1>

                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                            transition={{ delay: 0.6 }}
                            className="text-2xl md:text-4xl font-bold text-white/80 mb-6"
                        >
                            {section.subtitle}
                        </motion.h2>

                        <motion.hr
                            initial={{ width: 0 }}
                            animate={isActive ? { width: '100px' } : { width: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="border-t-4 border-white/50 mb-8"
                        />

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={isActive ? { opacity: 1 } : { opacity: 0 }}
                            transition={{ delay: 0.8 }}
                            className="text-lg md:text-xl text-white/70 mb-8 max-w-xl leading-relaxed"
                        >
                            {section.description}
                        </motion.p>

                        {index === 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                                transition={{ delay: 0.9 }}
                                className="flex gap-4"
                            >
                                <Link href="/sign-up">
                                    <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-10 py-7 text-xl shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-0">
                                        התחל עכשיו
                                        <ArrowLeft className="mr-3" size={24} />
                                    </Button>
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Image/Animation Area */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative h-[400px] md:h-[600px] hidden md:flex items-center justify-center p-4"
                    >
                        {section.image ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                    src={section.image}
                                    alt={section.title}
                                    width={1000}
                                    height={800}
                                    className="w-full h-auto rounded-2xl shadow-2xl"
                                    priority={index === 0}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <motion.div
                                    animate={isActive ? {
                                        rotate: [0, 5, -5, 0],
                                        scale: [1, 1.05, 0.95, 1]
                                    } : {}}
                                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-64 h-64 md:w-96 md:h-96 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl flex items-center justify-center"
                                >
                                    <div className={`w-32 h-32 rounded-full bg-${section.accentColor}-500/20 blur-xl animate-pulse`} />
                                </motion.div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
