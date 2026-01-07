'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Menu, X, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BusinessLandingPage() {
    const [currentSection, setCurrentSection] = useState(0)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolling, setIsScrolling] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const sections = [
        {
            id: 0,
            title: 'KESEFLOW',
            subtitle: 'ניהול פיננסי עסקי מתקדם',
            description: 'המערכת המקצועית לניהול פיננסי של עסקים קטנים ובינוניים. כל הכלים שצריך כדי לנהל את העסק בצורה חכמה ויעילה.',
            bgColor: 'from-slate-900 via-slate-800 to-slate-900',
            textColor: 'text-white',
            accentColor: 'emerald',
            image: '/assets/dashboard_mockup.png'
        },
        {
            id: 1,
            number: '01',
            title: 'לקוחות',
            subtitle: 'נהל את הלקוחות שלך',
            description: 'מערכת ניהול לקוחות מקיפה שמאפשרת לך לעקוב אחר כל פרטי הלקוח, היסטוריית עסקאות, חשבוניות והצעות מחיר. שמור מידע חשוב כמו פרטי קשר, תנאי תשלום ומועדים. המערכת תזכיר לך מתי לחדש הצעות, לשלוח תזכורות תשלום ולעקוב אחר חובות. בנה קשרי לקוחות חזקים עם ניהול מקצועי ומסודר.',
            bgColor: 'from-green-600 via-green-700 to-green-900',
            textColor: 'text-white',
            accentColor: 'green',
            tag: 'ניהול | מעקב | קשרי לקוחות',
            image: '/screenshots/clients.png'
        },
        {
            id: 2,
            number: '02',
            title: 'ספקים',
            subtitle: 'שלוט בשרשרת האספקה',
            description: 'נהל את כל הספקים שלך במקום אחד - עקוב אחר הזמנות, חשבוניות, תנאי תשלום ומועדים. המערכת תעזור לך לנהל את תזרים המזומנים, לתכנן תשלומים ולשמור על קשרים טובים עם הספקים. קבל תזכורות לפני מועדי תשלום, עקוב אחר היסטוריית רכישות וזהה הזדמנויות למשא ומתן על מחירים טובים יותר.',
            bgColor: 'from-blue-600 via-blue-700 to-blue-900',
            textColor: 'text-white',
            accentColor: 'blue',
            tag: 'ניהול | תזרים | תשלומים',
            image: '/screenshots/suppliers.png'
        },
        {
            id: 3,
            number: '03',
            title: 'הצעות מחיר',
            subtitle: 'צור הצעות מקצועיות',
            description: 'צור הצעות מחיר מעוצבות ומקצועיות בקלות עם הלוגו והפרטים העסקיים שלך. המערכת תעזור לך לעקוב אחר סטטוס כל הצעה - נשלחה, נקראה, אושרה או נדחתה. המר הצעות מחיר לחשבוניות בקליק אחד, שלח תזכורות אוטומטיות ללקוחות ונתח את שיעור ההמרה שלך. חסוך זמן יקר והצג מקצועיות מירבית.',
            bgColor: 'from-yellow-500 via-yellow-600 to-yellow-700',
            textColor: 'text-white',
            accentColor: 'yellow',
            tag: 'יצירה | מעקב | המרה',
            image: '/screenshots/quotes.png'
        },
        {
            id: 4,
            number: '04',
            title: 'חשבוניות',
            subtitle: 'חשבוניות חכמות ומסודרות',
            description: 'הפק חשבוניות מס ו/או קבלות בהתאם לדרישות החוק הישראלי. המערכת תחשב אוטומטית מע"מ, תעקוב אחר תשלומים ותזכיר ללקוחות על חובות פתוחים. ייצא דוחות למס הכנסה, עקוב אחר תזרים מזומנים וקבל תובנות על מצב העסק. הכל מסודר, מאורגן ומוכן לביקורת.',
            bgColor: 'from-purple-600 via-purple-700 to-purple-900',
            textColor: 'text-white',
            accentColor: 'purple',
            tag: 'הפקה | מעמ | דוחות',
            image: '/screenshots/invoices.png'
        },
        {
            id: 5,
            number: '05',
            title: 'חשבוניות זיכוי',
            subtitle: 'נהל החזרים וזיכויים',
            description: 'הפק חשבוניות זיכוי מקצועיות עבור החזרים ללקוחות. המערכת תעדכן אוטומטית את ההכנסות, תקשר את הזיכוי לחשבונית המקורית ותשמור על סדר בחשבון הלקוח. נהל בקרת החזרים יעילה ושמור על שקיפות מלאה מול הלקוחות והשלטונות.',
            bgColor: 'from-orange-500 via-orange-600 to-orange-700',
            textColor: 'text-white',
            accentColor: 'orange',
            tag: 'החזרים | זיכויים | ניהול',
            image: '/screenshots/credit-notes.png'
        },
        {
            id: 6,
            number: '06',
            title: 'מכירות',
            subtitle: 'עקוב אחר ההכנסות',
            description: 'נתח את כל מקורות ההכנסה של העסק - מכירות מוצרים, שירותים, פרויקטים ועוד. המערכת תציג לך גרפים ברורים של מגמות המכירות, תזהה עונתיות ותעזור לך לתכנן צמיחה. עקוב אחר ביצועי מוצרים שונים, זהה לקוחות מובילים וקבל תובנות לשיפור האסטרטגיה העסקית שלך.',
            bgColor: 'from-emerald-600 via-emerald-700 to-emerald-900',
            textColor: 'text-white',
            accentColor: 'emerald',
            tag: 'ניתוח | מגמות | תובנות',
            image: '/screenshots/revenue.png'
        },
        {
            id: 7,
            number: '07',
            title: 'עלויות',
            subtitle: 'שלוט בהוצאות העסק',
            description: 'עקוב אחר כל עלויות העסק - שכר עובדים, חומרי גלם, שכירות, שיווק ועוד. המערכת תקטלג אוטומטית את ההוצאות, תזהה חריגות ותעזור לך למצוא הזדמנויות לחיסכון. קבל דוחות מפורטים לכל קטגוריה, השווה בין תקופות וקבל החלטות מושכלות על בסיס נתונים אמיתיים. הפוך את העסק לרווחי יותר.',
            bgColor: 'from-red-600 via-red-700 to-red-900',
            textColor: 'text-white',
            accentColor: 'red',
            tag: 'מעקב | ניתוח | חיסכון',
            image: '/screenshots/expenses.png'
        },
        {
            id: 8,
            number: '08',
            title: 'לוח שנה',
            subtitle: 'תכנן את העסק מראש',
            description: 'ראה את כל האירועים העסקיים בלוח שנה מרכזי - תשלומים ללקוחות וספקים, מועדי דיווח למס, פגישות חשובות ועוד. המערכת תסנכרן אוטומטית את כל הנתונים מהמודולים השונים ותתריע לך על מועדים קריטיים. תכנן את תזרים המזומנים, היערך לעונות עמוסות והישאר תמיד צעד אחד לפני.',
            bgColor: 'from-teal-600 via-teal-700 to-teal-900',
            textColor: 'text-white',
            accentColor: 'teal',
            tag: 'תכנון | סנכרון | התראות',
            image: '/screenshots/calendar.png'
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
                            <Link href="/security" className="hover:text-white transition">אבטחת מידע</Link>
                            <Link href="/accessibility" className="hover:text-white transition">הצהרת נגישות</Link>
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

                    {/* Image Area */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={isActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="relative h-[400px] md:h-[600px] hidden md:flex items-center justify-center"
                    >
                        {section.image ? (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                    src={section.image}
                                    alt={section.title}
                                    width={index === 0 ? 800 : 1200}
                                    height={index === 0 ? 600 : 800}
                                    className={`w-full h-auto drop-shadow-2xl ${index === 0 ? '' : 'rounded-2xl border border-white/20'}`}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-96 h-96 bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl" />
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
