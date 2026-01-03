'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqData = [
    {
        question: "למי המערכת מתאימה?",
        answer: "המערכת מותאמת לכולם - מיחידים שרוצים לעקוב אחרי ההוצאות היומיומיות, דרך משפחות המנהלות תקציב משותף, ועד לעסקים קטנים ועצמאיים הזקוקים לכלים מתקדמים לניהול עסק."
    },
    {
        question: "האם המידע שלי מאובטח?",
        answer: "כן, אבטחת המידע היא בראש סדר העדיפויות שלנו. אנו משתמשים בהצפנה מתקדמת (SSL/TLS), לא שומרים פרטי כרטיסי אשראי בשרתים שלנו, ומבצעים גיבויים יומיים לנתונים."
    },
    {
        question: "האם יש תקופת ניסיון בחינם?",
        answer: "בוודאי. ניתן להירשם ולהשתמש בממשק האישי והעסקי ללא התחייבות וללא תשלום לחודשיים."
    },
    {
        question: "האם ניתן להפיק חשבוניות ירוקות?",
        answer: "כן! מנויי התוכנית העסקית נהנים ממערכת הפקת חשבוניות ירוקות מלאה. ניתן להפיק חשבוניות מס, קבלות ודרישות תשלום, להחתים לקוחות דיגיטלית ולשלוח בוואטסאפ או במייל."
    },
    {
        question: "האם ניתן לנהל תקציב משותף?",
        answer: "כן, המערכת מאפשרת לצרף בני זוג או שותפים לניהול התקציב, כך שכולם מעודכנים במצב הפיננסי בזמן אמת ולקבל החלטות כלכליות משותפות."
    }
]

export default function FAQ() {
    return (
        <section className="pt-20 pb-10 bg-green-50/50">
            <div className="container mx-auto px-4 max-w-4xl">
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6"
                    >
                        <HelpCircle className="w-8 h-8" />
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl font-bold text-gray-900 mb-4"
                    >
                        שאלות ותשובות
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-gray-600"
                    >
                        ריכזנו עבורכם את השאלות הנפוצות ביותר כדי לעזור לכם להבין איך המערכת יכולה לעזור לכם
                    </motion.p>
                </div>

                <div className="space-y-4">
                    {faqData.map((item, index) => (
                        <AccordionItem key={index} item={item} index={index} />
                    ))}
                </div>
            </div>
        </section>
    )
}

function AccordionItem({ item, index }: { item: any, index: number }) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: index * 0.1 }}
            className={cn(
                "bg-white rounded-2xl border transition-all duration-300 overflow-hidden",
                isOpen ? "border-green-500 shadow-lg ring-1 ring-green-500/20" : "border-gray-100 hover:border-green-200 shadow-sm"
            )}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 text-right focus:outline-none"
            >
                <span className={cn("text-lg font-bold transition-colors", isOpen ? "text-green-700" : "text-gray-900")}>
                    {item.question}
                </span>
                <span className={cn(
                    "p-2 rounded-full transition-all duration-300",
                    isOpen ? "bg-green-100 text-green-600 rotate-180" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                )}>
                    <ChevronDown className="w-5 h-5" />
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                            {item.answer}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
