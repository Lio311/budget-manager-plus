'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, ArrowLeft, Check, Menu, X, ChevronDown, LayoutDashboard, PieChart, Calendar, BarChart3, CreditCard, Receipt, Smartphone, Lock, Shield } from 'lucide-react'
import SecurityBadge from '@/components/SecurityBadge'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
    const [currentSection, setCurrentSection] = useState(0)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isScrolling, setIsScrolling] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const sections = [
        {
            id: 0,
            type: 'hero',
            title: 'KESEFly',
            subtitle: 'ניהול פיננסי אישי חכם',
            description: 'המערכת המתקדמת בישראל לניהול תקציב אישי. כל הכלים שצריך כדי לשלוט בכסף שלך, בממשק אחד יפהפה ונוח.',
            bgColor: 'from-slate-900 via-slate-800 to-slate-900',
            textColor: 'text-white',
            accentColor: 'emerald',
            image: '/images/marketing/dashboard_mockup.png'
        },
        {
            id: 1,
            type: 'personal',
            title: 'הממשק האישי',
            subtitle: 'כל הכסף של המשפחה במקום אחד',
            description: 'מערכת מקיפה וחכמה לניהול כל ההיבטים הפיננסיים של התא המשפחתי, המעניקה לכם שליטה מלאה, בקרה ושקט נפשי. עקבו בקלות אחר כל ההוצאות וההכנסות, נהלו תקציב חודשי מותאם אישית, וקבלו תובנות חכמות שיעזרו לכם לחסוך כסף ולשפר את ההתנהלות הכלכלית. הממשק הידידותי מרכז את כל המידע ממקום אחד, כולל ניהול חובות והלוואות, ומאפשר לכם לתכנן את העתיד הכלכלי של המשפחה בביטחון.',
            shortDescription: 'שליטה מלאה על כלכלת המשפחה: מעקב הוצאות, ניהול תקציב, חסכונות וחובות במקום אחד. קבלו תובנות חכמות ושקט נפשי לעתיד הכלכלי שלכם.',
            bgColor: 'from-blue-600 via-blue-700 to-blue-900',
            textColor: 'text-white',
            accentColor: 'blue',
            features: [
                { title: 'הכנסות', desc: 'מעקב אחר כל מקורות ההכנסה' },
                { title: 'הוצאות', desc: 'קטגוריזציה אוטומטית וניתוח הוצאות' },
                { title: 'חשבונות', desc: 'ניהול הוראות קבע ותשלומים קבועים' },
                { title: 'הלוואות', desc: 'מעקב אחר חובות ותכנון החזרים' },
                { title: 'חסכונות', desc: 'הגדרת יעדים ומעקב התקדמות' },
                { title: 'תקציבים', desc: 'תכנון חודשי והתראות חריגה' },
                { title: 'לוח שנה', desc: 'תצוגה כרונולוגית של אירועים פיננסיים' }
            ]
        },
        {
            id: 'business',
            type: 'business',
            title: 'הממשק העסקי',
            subtitle: 'המשרד הדיגיטלי שלך',
            description: 'פתרון מושלם לעצמאיים ועסקים קטנים המרכז את כל הכלים לניהול העסק במקום אחד, בצורה מסונכרנת ומסודרת. הפיקו חשבוניות דיגיטליות בקלות, נהלו מעקב מדויק אחר הוצאות והכנסות, וקבלו תמונת מצב פיננסית בזמן אמת עם דוחות מתקדמים. המערכת מייעלת את העבודה מול לקוחות וספקים, מאפשרת ניהול תזרים מזומנים חכם, ומעניקה לכם את השקט הנפשי להתמקד בצמיחת העסק.',
            shortDescription: 'המשרד הדיגיטלי לעצמאיים: חשבוניות דיגיטליות, ניהול תזרים, מעקב הוצאות ודוחות בזמן אמת. כל הכלים לניהול העסק וצמיחה כלכלית במקום אחד.',
            bgColor: 'from-green-600 to-emerald-800',
            textColor: 'text-white',
            accentColor: 'green',
            features: [
                { title: 'הכנסות והוצאות', desc: 'ניהול תזרים מלא לעסק' },
                { title: 'ספקים', desc: 'ניהול והתחשבנות מול ספקים' },
                { title: 'הוצאות מוכרות', desc: 'סיווג וניהול הוצאות לצרכי מס' },
                { title: 'דוח רווח והפסד', desc: 'תמונת מצב עסקית מדויקת בכל רגע' },
                { title: 'הצעות מחיר', desc: 'הפקה ושליחה של הצעות מחיר' },
                { title: 'חשבוניות', desc: 'הפקת מסמכים חשבונאיים דיגיטליים' },
                { title: 'זיכויים', desc: 'ניהול החזרים וזיכויים ללקוחות' },
                { title: 'יומן עבודה', desc: 'ניהול משימות ופרויקטים' },
                { title: 'לקוחות', desc: 'ניהול כרטסת לקוחות וגבייה' }
            ]
        },
        {
            id: 3,
            type: 'toolkit',
            title: 'ארגז הכלים להצלחה',
            subtitle: 'כל מה שאתם צריכים במקום אחד',
            bgColor: 'from-purple-600 via-purple-700 to-purple-900',
            textColor: 'text-white',
            accentColor: 'purple'
        },
        {
            id: 4,
            type: 'faq',
            title: 'שאלות ותשובות',
            bgColor: 'from-slate-900 via-slate-800 to-slate-900', // Dark theme for FAQ to match aesthetic
            textColor: 'text-white',
            accentColor: 'slate'
        }
    ]

    const handleWheel = (e: WheelEvent) => {
        if (isScrolling) return

        // Check if we are inside a scrollable container that has specialized scrolling needs
        const target = e.target as HTMLElement;

        // CRITICAL FIX: Ignore scrolling events from the Security Popup (or any element with stop-landing-scroll)
        if (target.closest('.stop-landing-scroll')) return;

        const scrollableContainer = target.closest('.custom-scrollbar');

        if (scrollableContainer) {
            const { scrollTop, scrollHeight, clientHeight } = scrollableContainer;
            // If scrolling up and not at top, or scrolling down and not at bottom, allow default scroll
            if ((e.deltaY < 0 && scrollTop > 0) || (e.deltaY > 0 && scrollTop + clientHeight < scrollHeight - 1)) {
                return; // Let the container scroll naturally
            }
        }

        e.preventDefault()
        setIsScrolling(true)

        if (e.deltaY > 0 && currentSection < sections.length - 1) {
            setCurrentSection(prev => prev + 1)
        } else if (e.deltaY < 0 && currentSection > 0) {
            setCurrentSection(prev => prev - 1)
        }

        setTimeout(() => setIsScrolling(false), 1000)
    }

    const touchStart = useRef<number | null>(null)
    const handleTouchStart = (e: TouchEvent) => {
        // CRITICAL FIX: Ignore scrolling events from the Security Popup on mobile
        if ((e.target as HTMLElement).closest('.stop-landing-scroll')) return;

        touchStart.current = e.touches[0].clientY
    }
    const handleTouchEnd = (e: TouchEvent) => {
        // CRITICAL FIX: Ignore scrolling events from the Security Popup on mobile
        if ((e.target as HTMLElement).closest('.stop-landing-scroll')) return;

        if (isScrolling || touchStart.current === null) return

        // Similar check for touch scrolling within containers could be added here if needed

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
                <div className="container mx-auto px-6 h-20 flex items-center justify-between relative">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
                        <Link href="/">
                            <Image src="/images/branding/K-LOGO2.png" alt="Kesefly" width={140} height={40} className="h-14 w-auto brightness-0 invert" />
                        </Link>
                    </motion.div>

                    {/* Centered Dynamic "Try for Free" Button */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-full flex justify-center pointer-events-none">
                        <AuthModalTrigger redirectUrl="/onboarding">
                            <Button className="pointer-events-auto bg-transparent border border-white text-white hover:bg-white hover:text-gray-900 rounded-full px-4 py-2 text-xs md:text-lg md:px-8 md:py-6 transition-all shadow-[0_0_10px_rgba(255,255,255,0.3)] md:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] animate-pulse whitespace-nowrap">
                                התנסות במערכת בחינם
                            </Button>
                        </AuthModalTrigger>
                    </div>

                    <div className="hidden md:flex items-center gap-6">
                        <AuthModalTrigger><Button variant="ghost" className="text-white hover:bg-white/10 rounded-full px-6">כניסה</Button></AuthModalTrigger>
                        <AuthModalTrigger><Button className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-8 shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-0">התחל עכשיו</Button></AuthModalTrigger>
                    </div>
                    {/* Replaced Menu with Login button for mobile */}
                    <div className="md:hidden">
                        <AuthModalTrigger>
                            <Button variant="ghost" className="text-white hover:bg-white/10 rounded-full">כניסה</Button>
                        </AuthModalTrigger>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Removed/Disabled as requested */}

            {/* Section Indicators */}
            <div className="fixed left-8 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-3">
                {sections.map((section, index) => (
                    <button key={section.id} onClick={() => setCurrentSection(index)} className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSection === index ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50'}`} />
                ))}
            </div>

            {/* Sections Container */}
            <div className="h-full transition-transform duration-1000 ease-in-out" style={{ transform: `translateY(-${currentSection * 100}vh)` }}>
                {sections.map((section, index) => (
                    <Section key={section.id} section={section} isActive={currentSection === index} index={index} />
                ))}
            </div>

            {/* Scroll Indicator */}
            {currentSection < sections.length - 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed bottom-8 right-1/2 translate-x-1/2 z-50 flex flex-col items-center gap-2">
                    <span className="text-white/60 text-sm">גלול למטה</span>
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <ChevronDown className="text-white/60" size={24} />
                    </motion.div>
                </motion.div>
            )}

            {/* Security Badge */}
            <SecurityBadge className="bottom-4 right-4" />

            {/* Custom Footer */}
            {currentSection === sections.length - 1 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10 py-6 z-40">
                    <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-white/60 text-sm">
                        <p>© 2026 Kesefly. כל הזכויות שמורות.</p>
                        <div className="flex gap-6">
                            <Link href="/terms" className="hover:text-white transition">תנאי שימוש</Link>
                            <Link href="/security" className="hover:text-white transition">אבטחת מידע</Link>
                            <Link href="/accessibility" className="hover:text-white transition">הצהרת נגישות</Link>

                        </div>
                    </div>
                </motion.div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .custom-scrollbar {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
            `}} />
        </div>
    )
}

function Section({ section, isActive, index }: { section: any, isActive: boolean, index: number }) {
    return (
        <div className={`h-screen w-full relative overflow-hidden bg-gradient-to-br ${section.bgColor} flex items-center justify-center`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="container mx-auto px-6 h-full flex items-center relative z-10">
                {section.type === 'hero' && (
                    <div className="grid md:grid-cols-2 gap-12 items-center w-full">
                        <div className="text-right">
                            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.1 }} className="text-6xl md:text-8xl font-black text-white mb-4 leading-none font-noto">Kesefly</motion.h1>
                            <motion.h2 initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }} className="text-2xl md:text-4xl font-bold text-white/80 mb-6">{section.subtitle}</motion.h2>
                            <motion.p initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 0.3 }} className="text-lg md:text-xl text-white/70 mb-8 max-w-xl leading-relaxed">{section.description}</motion.p>
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }}>
                                <AuthModalTrigger>
                                    <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-10 py-7 text-xl shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 border-0">
                                        התחל עכשיו
                                        <ArrowLeft className="mr-3" size={24} />
                                    </Button>
                                </AuthModalTrigger>
                                <div className="mt-4">
                                    <Link href="/demo">
                                        <Button variant="link" className="text-white/70 hover:text-white transition-colors text-sm">
                                            התנסות במערכת כאורח
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        </div>
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={isActive ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="hidden md:flex justify-end relative h-[500px]">
                            <Image src="/images/marketing/dashboard_mockup.png" alt="Hero" fill className="object-contain" priority sizes="(max-width: 768px) 100vw, 50vw" />
                        </motion.div>
                    </div>
                )}

                {(section.type === 'personal' || section.type === 'business') && (
                    <div className="grid md:grid-cols-2 gap-2 md:gap-12 items-center content-center w-full h-full pt-20 pb-10 md:pb-20">
                        <div className="text-center md:text-right flex flex-col justify-end md:justify-center items-center md:items-start">
                            <motion.h2 initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.4 }} className="text-4xl md:text-6xl font-black text-white mb-1 md:mb-4">{section.title}</motion.h2>
                            <motion.h3 initial={{ opacity: 0, y: 30 }} animate={isActive ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.5 }} className="text-2xl text-white/80 mb-2 md:mb-6">{section.subtitle}</motion.h3>
                            <motion.div initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} transition={{ delay: 0.6 }} className="text-lg text-white/70 mb-2 md:mb-8 max-w-xl">
                                <p className="hidden md:block">{section.description}</p>
                                <p className="md:hidden">{section.shortDescription || section.description}</p>
                            </motion.div>
                        </div>

                        {/* Grid: 3 columns on mobile, 3 on large screens. Restored desktop padding/sizing. */}
                        <div className="grid grid-cols-3 lg:grid-cols-3 gap-2 md:gap-6 overflow-y-auto max-h-[70vh] p-1 custom-scrollbar content-start">
                            {section.features.map((feature: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isActive ? { opacity: 1, y: 0 } : {}}
                                    transition={{ delay: 0.4 + idx * 0.1 }}
                                    className="bg-white/10 backdrop-blur-md p-2 md:p-6 rounded-xl md:rounded-2xl border border-white/10 hover:bg-white/20 transition-colors flex flex-col items-center text-center shadow-lg"
                                >
                                    <h4 className="text-xs md:text-lg font-bold text-white mb-1 md:mb-3 leading-tight">{feature.title}</h4>
                                    <p className="text-white/60 text-[10px] md:text-sm leading-tight block">{feature.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {section.type === 'toolkit' && (
                    <div className="w-full h-full flex flex-col justify-center pt-24 pb-10 md:pt-20 md:pb-20">
                        <div className="text-center mb-2 md:mb-10">
                            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} className="text-4xl md:text-5xl font-black text-white mb-2 md:mb-4">{section.title}</motion.h2>
                            <motion.p initial={{ opacity: 0 }} animate={isActive ? { opacity: 1 } : {}} className="text-xl text-white/70">{section.subtitle}</motion.p>
                        </div>
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6 overflow-y-auto max-h-[65vh] p-1 md:p-4 custom-scrollbar">
                            <FeatureCard icon={<LayoutDashboard />} title="ממשק חכם" desc="חווית משתמש פשוטה ונוחה" delay={0.1} isActive={isActive} />
                            <FeatureCard icon={<PieChart />} title="מעקב הוצאות" desc="ניתוח מעמיק של הרגלי צריכה" delay={0.2} isActive={isActive} />
                            <FeatureCard icon={<Calendar />} title="לוח שנה" desc="תזכורות תשלום חכמות" delay={0.3} isActive={isActive} />
                            <FeatureCard icon={<BarChart3 />} title="גרפים ודוחות" desc="ויזואליזציה של המצב הפיננסי" delay={0.4} isActive={isActive} />
                            <FeatureCard icon={<CreditCard />} title="חשבונות קבועים" desc="ניהול הוראות קבע ומנויים" delay={0.5} isActive={isActive} />
                            <FeatureCard icon={<Receipt />} title="ניהול חובות" desc="תוכנית יציאה מהמינוס" delay={0.6} isActive={isActive} />
                            <FeatureCard icon={<ShieldCheck />} title="אבטחה מתקדמת" desc="הצפנה ברמה בנקאית" delay={0.7} isActive={isActive} />
                            <FeatureCard icon={<Smartphone />} title="נגישות מכל מקום" desc="גישה מהנייד ומהמחשב" delay={0.8} isActive={isActive} />
                        </div>
                    </div>
                )}

                {section.type === 'faq' && (
                    <div className="w-full h-full flex flex-col justify-center pt-20 pb-32">
                        <div className="text-center mb-10">
                            <motion.h2 initial={{ opacity: 0, y: -20 }} animate={isActive ? { opacity: 1, y: 0 } : {}} className="text-5xl font-black text-white mb-4">{section.title}</motion.h2>
                        </div>
                        <div className="max-w-4xl mx-auto w-full overflow-y-auto max-h-[60vh] p-4 custom-scrollbar bg-white/5 rounded-3xl backdrop-blur-sm border border-white/10">
                            <FAQContent />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function FeatureCard({ icon, title, desc, delay, isActive }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isActive ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.4 + delay }}
            className="bg-white/10 backdrop-blur-md p-2 md:p-6 rounded-xl md:rounded-2xl border border-white/10 text-center hover:bg-white/20 transition-all hover:-translate-y-1 flex flex-col items-center justify-center h-full"
        >
            <div className="bg-white/20 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center mb-2 md:mb-4 text-white">
                {/* Scale icon down for mobile */}
                <div className="scale-75 md:scale-100">
                    {icon}
                </div>
            </div>
            <h3 className="text-xs md:text-lg font-bold text-white mb-1 md:mb-2 leading-tight">{title}</h3>
            <p className="text-white/60 text-[10px] md:text-sm leading-tight block">{desc}</p>
        </motion.div>
    )
}

function FAQContent() {
    const faqData = [
        { q: "למי המערכת מתאימה?", a: "לכולם - מיחידים, משפחות ועד עסקים קטנים. המערכת גמישה ומאפשרת התאמה אישית לכל צורך." },
        { q: "האם המידע מאובטח?", a: "כן, אנו משתמשים בהצפנה מתקדמת (SSL/TLS) ולא שומרים פרטי אשראי בשרתים שלנו. אבטחת המידע היא בראש סדר העדיפויות שלנו." },
        { q: "האם יש תקופת ניסיון?", a: "כן, אנחנו מציעים חודשיים ראשונים חינם ללא התחייבות, כדי שתוכלו להתנסות במערכת ולוודא שהיא מתאימה לכם." },
        { q: "האם ניתן להפיק חשבוניות?", a: "כן, המנוי העסקי כולל מערכת מלאה להפקת חשבוניות ירוקות (דיגיטליות), קבלות, הצעות מחיר ועוד, הכל מוכר לצרכי מס." },
        { q: "האם ניתן לנהל תקציב משותף?", a: "כן, ניתן לצרף בני זוג ושותפים לחשבון בקלות, ולנהל את התקציב או העסק ביחד בשקיפות מלאה." }
    ]

    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <div className="space-y-4">
            {faqData.map((item, idx) => (
                <motion.div
                    key={idx}
                    initial={false}
                    className={`bg-white/5 rounded-xl border border-white/10 overflow-hidden transition-colors ${openIndex === idx ? 'bg-white/10' : 'hover:bg-white/10'}`}
                >
                    <button
                        onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                        className="w-full text-right p-4 flex items-center justify-between gap-4"
                    >
                        <span className="font-bold text-white text-lg">{item.q}</span>
                        <ChevronDown className={`text-white/60 transition-transform duration-300 ${openIndex === idx ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {openIndex === idx && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="p-4 pt-0 text-white/70 leading-relaxed border-t border-white/10">
                                    {item.a}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>
    )
}

function AuthModalTrigger({ children, redirectUrl }: { children: React.ReactNode, redirectUrl?: string }) {
    const { openModal } = useAuthModal()
    return (
        <span onClick={() => openModal(redirectUrl)} className="cursor-pointer inline-block">
            {children}
        </span>
    )
}
