import { Metadata } from 'next'


export const metadata: Metadata = {
    title: 'תקנון ומדיניות פרטיות | Kesefly',
    description: 'תקנון ומדיניות שימוש באתר ובמוצר',
    robots: {
        index: false,
        follow: false,
    },
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#f0fdf4] font-rubik" dir="rtl">

            {/* Header / Hero */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-green-100/50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200">
                                <span className="text-white font-bold text-lg">K</span>
                            </div>
                            <span className="font-bold text-xl text-gray-800 tracking-tight">Kesefly</span>
                        </div>
                        <a href="/" className="text-sm font-medium text-gray-500 hover:text-green-600 transition-colors">
                            חזרה לדף הבית
                        </a>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-green-800 to-green-600 pb-2">
                        תקנון ומדיניות פרטיות
                    </h1>
                    <p className="text-lg text-gray-500 font-medium">
                        עודכן לאחרונה: 11 באוגוסט 2025
                    </p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-1 shadow-xl border border-white/50 ring-1 ring-green-100">
                    <div className="bg-white rounded-[1.4rem] p-8 md:p-12 shadow-sm">
                        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-800 prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-900 prose-a:text-green-600 hover:prose-a:text-green-700">

                            <p className="lead text-xl md:text-2xl font-medium text-gray-700 leading-relaxed mb-10">
                                ברוכים הבאים ל-Kesefly, המערכת החכמה לניהול תקציב.
                                <br />
                                <span className="text-base text-gray-500 font-normal mt-2 block">
                                    תקנון זה מנוסח בלשון זכר לצורך נוחות בלבד, אך מתייחס לשני המינים באופן שווה. השימוש באתר ובמערכת כפופים להסכמתך לתנאים הבאים.
                                </span>
                            </p>

                            <div className="grid gap-12">
                                <Section title="1. הגדרות" number="01">
                                    <ul className="list-none space-y-3 p-0 m-0">
                                        <Definition term="החברה/המפעיל" desc="מפעיל האתר והשירות, המציע שירותי ניהול תקציב דיגיטליים (SaaS)." />
                                        <Definition term="האתר/המערכת" desc="פלטפורמת Kesefly המקוונת לניהול פיננסי." />
                                        <Definition term="הלקוח/המשתמש" desc="כל אדם שעושה שימוש בשירותי המערכת, בין אם בחינם ובין אם בתשלום." />
                                        <Definition term="השירות" desc="מערכת לניהול תקציב, מעקב הוצאות וכלים פיננסיים נלווים." />
                                    </ul>
                                </Section>

                                <Section title="2. תנאי שימוש במערכת" number="02">
                                    <p>
                                        2.1 המערכת נועדה לשימוש אישי או עסקי (בהתאם לסוג החשבון). אין לבצע שימוש מסחרי בגישה למערכת (כגון מכירת הגישה לצד ג') ללא אישור כתוב.
                                    </p>
                                    <p>
                                        2.2 חל איסור מוחלט לנסות לפגוע בתפקוד המערכת, לבצע הנדסה לאחור (Reverse Engineering), או להעתיק אלמנטים עיצוביים ותפקודיים.
                                    </p>
                                    <p>
                                        2.3 המפעיל רשאי לשנות את התקנון, את מבנה המערכת ואת הפיצ'רים המוצעים מעת לעת, עפ"י שיקול דעתו הבלעדי.
                                    </p>
                                </Section>

                                <Section title="3. מנויים ותשלומים" number="03">
                                    <p>
                                        3.1 הגישה לפיצ'רים מסוימים במערכת כרוכה בתשלום דמי מנוי (חודשי/שנתי).
                                    </p>
                                    <p>
                                        3.2 התשלום מתבצע באופן מקוון ומאובטח. הגישה לשירותי הפרימיום תיפתח מידית עם אישור העסקה.
                                    </p>
                                    <p>
                                        3.3 המחירים המוצגים כוללים מע"מ כחוק, אלא אם צוין אחרת במפורש (למשל בחשבונות עסקיים).
                                    </p>
                                </Section>

                                <Section title="4. מדיניות ביטול והחזרים" number="04">
                                    <p>
                                        4.1 ניתן לבטל את המנוי בכל עת דרך הגדרות החשבון. הביטול ייכנס לתוקף בסיום תקופת החיוב הנוכחית.
                                    </p>
                                    <p>
                                        4.2 לא יינתן החזר כספי יחסי עבור תקופת מנוי שלא נוצלה, אלא במקרים חריגים ועל פי שיקול דעתה של החברה.
                                    </p>
                                    <p>
                                        4.3 במקרה של תקלה טכנית המונעת שימוש מהותי במערכת למשך זמן ממושך, יזוכה הלקוח בהתאם.
                                    </p>
                                </Section>

                                <Section title="5. זמינות ואחריות" number="05">
                                    <p>
                                        5.1 אנו עושים את מירב המאמצים לשמור על זמינות מערכת של 99.9%. עם זאת, ייתכנו הפסקות שירות יזומות לצורך תחזוקה ועדכונים.
                                    </p>
                                    <p>
                                        5.2 המערכת מסופקת כפי שהיא (As-Is). החברה לא תישא באחריות לנזקים עקיפים שעלולים להיגרם כתוצאה משימוש בנתונים או מהסתמכות עליהם לצורך קבלת החלטות פיננסיות.
                                    </p>
                                </Section>

                                <Section title="6. פרטיות ואבטחת מידע" number="06">
                                    <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                                        <h4 className="flex items-center gap-2 text-green-800 mt-0 mb-4">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            אנו לוקחים את הפרטיות שלך ברצינות רבה.
                                        </h4>
                                        <ul className="space-y-2 text-sm md:text-base">
                                            <li><strong>הצפנה:</strong> המידע האישי והפיננסי שלך מוצפן ומאובטח בסטנדרטים הגבוהים ביותר בתעשייה.</li>
                                            <li><strong>שימוש במידע:</strong> המידע שלך משמש אך ורק לצורך תפעול המערכת ושיפור השירות.</li>
                                            <li><strong>צד שלישי:</strong> איננו מוכרים את המידע שלך לצדדים שלישיים. מידע מועבר רק לספקים חיוניים (כגון חברת הסליקה) לצורך ביצוע השירות.</li>
                                            <li><strong>שליטה:</strong> זכותך לבקש מחיקה מלאה של המידע שלך בכל עת.</li>
                                        </ul>
                                    </div>
                                </Section>

                                <Section title="7. שימוש במטבעות המערכת (Smart Links)" number="07">
                                    <p>
                                        המערכת תומכת בתיעוד עסקאות במגוון מטבעות, אך מטבע הבסיס לחישובים בדוחות הוא שקל חדש (ILS), אלא אם הוגדר אחרת.
                                    </p>
                                    <p>
                                        <strong>שים לב:</strong> בעת שימוש בקישורים החכמים (Smart Links) לתיעוד אוטומטי מ-Apple Pay / Google Pay, סכום העסקה נקלט כפי שהוא משודר מהמכשיר.
                                        במידה ובוצעה רכישה במט"ח והמכשיר משדר את הסכום המקורי (למשל 100$), המערכת עשויה לקלוט את המספר "100" כערך נומינלי. באחריות המשתמש לוודא את המטבע והסכום הסופי בעת אישור ההוצאה בטופס.
                                    </p>
                                </Section>

                                <Section title="8. קניין רוחני" number="08">
                                    <p>
                                        כל הזכויות על הקוד, העיצוב, המותג "Kesefly" והתכנים במערכת שמורות למפעיל. אין להעתיק או לעשות בהם שימוש ללא רשות.
                                    </p>
                                </Section>
                            </div>

                            <div className="mt-16 pt-10 border-t border-gray-100 text-center">
                                <p className="font-medium text-gray-500 mb-2">יש לך שאלות נוספות?</p>
                                <a href="mailto:keseflow.il@gmail.com" className="inline-flex items-center gap-2 text-green-600 font-bold hover:text-green-700 transition-colors px-6 py-3 bg-green-50 hover:bg-green-100 rounded-full">
                                    צור קשר עם התמיכה
                                </a>
                                <p className="text-sm text-gray-400 mt-8">
                                    תודה שבחרת ב-Kesefly ❤️
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
                <span className="w-8 h-1 rounded-full bg-green-500 block"></span>
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
            <span className="font-bold text-gray-900 shrink-0 min-w-[120px]">{term}:</span>
            <span className="text-gray-600">{desc}</span>
        </li>
    )
}
