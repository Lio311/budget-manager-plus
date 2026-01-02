import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'מדיניות אבטחת מידע | Keseflow',
    description: 'מדיניות אבטחת מידע, פרטיות וארכיטקטורה',
    robots: {
        index: false,
        follow: false,
    },
}

export default function SecurityPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50/50 font-sans" dir="rtl">

            {/* Header / Hero */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-blue-100/50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                <span className="text-white font-bold text-lg">K</span>
                            </div>
                            <span className="font-bold text-xl text-gray-800 tracking-tight">Keseflow</span>
                        </div>
                        <a href="/" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                            חזרה לדף הבית
                        </a>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-800 to-blue-600 pb-2">
                        מדיניות אבטחת מידע
                    </h1>
                    <p className="text-lg text-gray-500 font-medium">
                        הסטנדרט שלנו לביטחון ופרטיות
                    </p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-1 shadow-xl border border-white/50 ring-1 ring-blue-100">
                    <div className="bg-white rounded-[1.4rem] p-8 md:p-12 shadow-sm">
                        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-800 prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-700">

                            <p className="lead text-xl md:text-2xl font-medium text-gray-700 leading-relaxed mb-10">
                                ב-Keseflow, אבטחת המידע שלכם היא בראש סדר העדיפויות שלנו.
                                <br />
                                <span className="text-base text-gray-500 font-normal mt-2 block">
                                    מסמך זה מפרט את הארכיטקטורה הטכנולוגית, מנגנוני ההגנה, והאופן בו אנו שומרים על פרטיות הנתונים הפיננסיים שלכם.
                                </span>
                            </p>

                            <div className="grid gap-12">
                                <Section title="1. ארכיטקטורת המערכת והגנה" number="01">
                                    <p>
                                        המערכת בנויה בטכנולוגיות ענן מתקדמות ומאובטחות (Enterprise Grade Security):
                                    </p>
                                    <ul className="list-none space-y-3 p-0 m-0 mt-4">
                                        <Definition term="אימות וזהויות" desc="אנו משתמשים בשירותי Clerk, פלטפורמה מובילה לניהול זהויות, המבטיחה אימות דו-שלבי (2FA) והגנה מפני פריצות לחשבונות." />
                                        <Definition term="בסיס הנתונים" desc="המידע נשמר על גבי תשתית Neon (Serverless Postgres), המבטיחה הפרדה לוגית בין לקוחות, גיבויים אוטומטיים והצפנה במנוחה (Encryption at Rest)." />
                                        <Definition term="תקשורת מוצפנת" desc="כל תעבורת הנתונים בין המכשיר שלכם לשרתים מוצפנת באמצעות פרוטוקול TLS 1.3/HTTPS, בסטנדרט הבנקאי המחמיר ביותר." />
                                    </ul>
                                </Section>

                                <Section title="2. פרטיות המידע הפיננסי" number="02">
                                    <p>
                                        אנו מאמינים שהמידע הפיננסי שייך אך ורק לכם.
                                    </p>
                                    <ul className="list-disc pr-5 mt-2 space-y-2">
                                        <li><strong>ללא גישה לחשבון הבנק:</strong> המערכת אינה דורשת את סיסמת הבנק שלכם ואינה מתחברת ישירות לחשבונו, מה שמונע סיכוני חשיפה של הרשאות בנקאיות.</li>
                                        <li><strong>מזעור נתונים:</strong> המערכת שומרת רק את המידע שהוזן אליה ישירות (הוצאות, הכנסות, קטגוריות). איננו אוספים מידע עודף שאינו נדרש לתפעול המערכת.</li>
                                        <li><strong>ללא מסחר במידע:</strong> המידע שלכם אינו נמכר למפרסמים או לצדדים שלישיים לעולם.</li>
                                    </ul>
                                </Section>

                                <Section title="3. מנגנון Smart Links ו-Shortcuts" number="03">
                                    <p>
                                        הפיצ'ר לתיעוד מהיר מ-Apple Pay / Google Pay פועל בארכיטקטורה השומרת על פרטיות (Privacy-First):
                                    </p>
                                    <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 my-4">
                                        <ol className="list-decimal pr-5 space-y-2 m-0">
                                            <li>בעת תשלום, ה-Shortcut רץ <strong>מקומית</strong> על המכשיר שלכם.</li>
                                            <li>הנתונים (סכום ושם עסק) מועברים ישירות לאפליקציית Keseflow בדפדפן שלכם דרך Deep Link.</li>
                                            <li><strong>השרתים שלנו אינם חשופים</strong> לפרטי כרטיס האשראי שלכם או לנתוני הארנק הדיגיטלי (Apple Wallet), אלא רק לטקסט הסופי שאתם מאשרים לשמירה.</li>
                                        </ol>
                                    </div>
                                </Section>

                                <Section title="4. גישה והרשאות" number="04">
                                    <p>
                                        4.1 הגישה למערכת מוגבלת אך ורק למשתמש המורשה (ולמשתמשים נוספים שהוגדרו על ידו, כגון בן/בת זוג).
                                    </p>
                                    <p>
                                        4.2 צוות הפיתוח והתמיכה של Keseflow אינו ניגש לנתונים הפיננסיים שלכם באופן שוטף. גישה כזו תתבצע רק במקרים חריגים של תמיכה טכנית מורכבת, ורק לאחר קבלת אישור מפורש וזמני מכם.
                                    </p>
                                </Section>

                                <Section title="5. גיבוי ושרידות" number="05">
                                    <p>
                                        הנתונים מגובים באופן אוטומטי על בסיס יומי במספר אזורי זמינות (Availability Zones) בענן, כדי להבטיח שרידות מלאה גם במקרה של תקלות תשתית קיצוניות.
                                    </p>
                                </Section>

                                <Section title="6. שקיפות ומחיקת מידע" number="06">
                                    <p>
                                        בהתאם לדיני הגנת הפרטיות, עומדת לרשותכם הזכות הבלעדית על המידע:
                                    </p>
                                    <ul className="list-disc pr-5 mt-2 space-y-2">
                                        <li>ניתן לייצא את כל המידע לקובץ Excel/CSV בכל עת.</li>
                                        <li>ניתן לבקש מחיקה מלאה של החשבון והנתונים ("הזכות להישכח") דרך אזור ההגדרות או בפנייה לתמיכה.</li>
                                    </ul>
                                </Section>
                            </div>

                            <div className="mt-16 pt-10 border-t border-gray-100 text-center">
                                <p className="font-medium text-gray-500 mb-2">מצאתם חולשת אבטחה? יש לכם שאלה?</p>
                                <a href="mailto:security@keseflow.com" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors px-6 py-3 bg-blue-50 hover:bg-blue-100 rounded-full">
                                    דווחו לצוות האבטחה
                                </a>
                                <p className="text-sm text-gray-400 mt-8">
                                    Keseflow Security Team
                                </p>
                            </div>

                        </article>
                    </div>
                </div>
            </main>
        </div>
    )
}

function Section({ title, children, number }: { title: string, children: React.ReactNode, number: string }) {
    return (
        <section className="relative group">
            <div className="absolute -right-12 top-0 text-6xl font-black text-gray-50 opacity-0 lg:group-hover:opacity-100 transition-opacity select-none hidden lg:block">
                {number}
            </div>
            <h2 className="flex items-center gap-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-l from-gray-900 to-gray-600 mb-6">
                <span className="w-8 h-1 rounded-full bg-blue-500 block"></span>
                {title}
            </h2>
            <div className="text-gray-600 leading-relaxed space-y-4">
                {children}
            </div>
        </section>
    )
}

function Definition({ term, desc }: { term: string, desc: string }) {
    return (
        <li className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors">
            <span className="font-bold text-gray-900 shrink-0 min-w-[140px]">{term}:</span>
            <span className="text-gray-600">{desc}</span>
        </li>
    )
}
