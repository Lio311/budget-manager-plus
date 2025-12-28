'use client'

import { useState } from 'react'
import { Shield, X, Lock, Database, Eye, CheckCircle2, Server, Activity } from 'lucide-react'

export default function SecurityBadge() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            {/* Security Badge - Fixed position in top left */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-6 left-6 z-40 p-4 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-full shadow-2xl hover:shadow-green-500/50 hover:scale-110 transition-all duration-300 group"
                aria-label="אבטחת מידע"
            >
                <Shield className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        {/* Header */}
                        <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-green-800 p-8 text-white">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32" />

                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                                aria-label="סגור"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="relative z-10 flex items-center gap-4">
                                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <Shield className="w-12 h-12" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold mb-2">אבטחת המידע ב-Keseflow</h2>
                                    <p className="text-green-100">7 שכבות הגנה מתקדמות לנתונים הפיננסיים שלך</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
                            <div className="space-y-6">
                                {/* Security Layer 1 */}
                                <SecurityLayer
                                    icon={<Lock className="w-6 h-6" />}
                                    title="אימות משתמשים מתקדם (Clerk Authentication)"
                                    description="כל כניסה לאתר עוברת דרך מערכת אימות מתקדמת של Clerk. זה כולל אימות דו-שלבי (2FA), זיהוי פנים, וקוד SMS. המערכת מבטיחה שרק אתה יכול לגשת לחשבון שלך, גם אם מישהו ינסה לנחש את הסיסמה."
                                />

                                {/* Security Layer 2 */}
                                <SecurityLayer
                                    icon={<Database className="w-6 h-6" />}
                                    title="הפרדת נתונים מוחלטת (Row Level Security)"
                                    description="כל משתמש רואה רק את הנתונים שלו. המערכת משתמשת ב-RLS (Row Level Security) - טכנולוגיה שמבטיחה שגם אם מישהו יצליח לפרוץ לשרת, הוא יראה רק את הנתונים שלו ולא של אחרים. זה כמו כספת אישית בתוך כספת ענקית."
                                />

                                {/* Security Layer 3 */}
                                <SecurityLayer
                                    icon={<Lock className="w-6 h-6" />}
                                    title="הצפנת תעבורה (HTTPS/TLS 1.3)"
                                    description="כל המידע שעובר בין המחשב שלך לשרת מוצפן ב-TLS 1.3 - תקן ההצפנה המתקדם ביותר. גם אם מישהו מאזין לתעבורה ברשת (כמו ב-WiFi ציבורי), הוא יראה רק אותיות ומספרים מקודדים שאי אפשר לפענח."
                                />

                                {/* Security Layer 4 */}
                                <SecurityLayer
                                    icon={<CheckCircle2 className="w-6 h-6" />}
                                    title="בדיקת הרשאות בכל פעולה (Authorization Checks)"
                                    description="כל פעולה שאתה עושה - הוספת הוצאה, עריכת תקציב, מחיקת נתון - עוברת בדיקת הרשאות. המערכת בודקת בכל פעולה שאתה באמת המשתמש המורשה. אפילו אם מישהו יגנוב את ה-cookie שלך, הוא לא יוכל לעשות כלום."
                                />

                                {/* Security Layer 5 */}
                                <SecurityLayer
                                    icon={<Server className="w-6 h-6" />}
                                    title="מסד נתונים מאובטח (PostgreSQL on Neon)"
                                    description="הנתונים שלך מאוחסנים ב-Neon - שירות PostgreSQL מתקדם המספק גיבויים אוטומטיים כל 24 שעות, הצפנה במנוחה (Encryption at Rest), ובידוד גיאוגרפי. השרתים נמצאים באירופה (EU-Central) ועומדים בתקני GDPR המחמירים ביותר."
                                />

                                {/* Security Layer 6 */}
                                <SecurityLayer
                                    icon={<Eye className="w-6 h-6" />}
                                    title="הגנה מפני התקפות (Security Middleware)"
                                    description="Middleware מתקדם בודק כל בקשה לשרת ומזהה ומונע: SQL Injection (הזרקת קוד זדוני), XSS (הרצת JavaScript זדוני), CSRF (פעולות בשמך ללא ידיעתך), ו-Rate Limiting (הגבלת בקשות למניעת התקפות DDoS)."
                                />

                                {/* Security Layer 7 */}
                                <SecurityLayer
                                    icon={<Activity className="w-6 h-6" />}
                                    title="ניטור ולוגים (Monitoring & Audit Logs)"
                                    description="כל פעולה במערכת נרשמת: כל כניסה לחשבון (מתי, מאיפה, מאיזה מכשיר), כל שינוי בנתונים (מי שינה מה ומתי), וכל ניסיון כניסה כושל. אם יש חשד לפריצה, אנחנו יודעים בדיוק מה קרה ויכולים לחסום את התוקף מיידית."
                                />
                            </div>

                            {/* Summary */}
                            <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border-2 border-green-200">
                                <h3 className="text-xl font-bold mb-4 text-green-900">סיכום: למה הנתונים שלך בטוחים?</h3>
                                <div className="grid md:grid-cols-2 gap-3">
                                    <SummaryPoint text="אימות חזק - רק אתה יכול להיכנס" />
                                    <SummaryPoint text="הצפנה כפולה - בתעבורה ובאחסון" />
                                    <SummaryPoint text="הפרדת נתונים - כל משתמש רואה רק את הנתונים שלו" />
                                    <SummaryPoint text="בדיקות אבטחה - בכל פעולה ופעולה" />
                                    <SummaryPoint text="גיבויים אוטומטיים - הנתונים לא יאבדו" />
                                    <SummaryPoint text="ניטור 24/7 - אנחנו תמיד ערים" />
                                    <SummaryPoint text="תקני GDPR - עומדים בתקנים הגבוהים באירופה" />
                                </div>
                                <p className="mt-4 text-center text-green-900 font-bold">
                                    הנתונים הפיננסיים שלך מוגנים!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

function SecurityLayer({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="flex gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                {icon}
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-lg mb-2 text-gray-900">{title}</h3>
                <p className="text-gray-700 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}

function SummaryPoint({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <span className="text-sm font-medium text-green-900">{text}</span>
        </div>
    )
}
