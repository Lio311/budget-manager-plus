import { Metadata } from 'next'

export const metadata: Metadata = {
    title: "הצהרת נגישות | Kesefly",
    description: "הצהרת הנגישות של אתר Kesefly - מחויבים לחווית גלישה שוויונית ונגישה לכולם.",
};

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-[#eff6ff] font-rubik" dir="rtl">
            {/* Header / Hero */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-blue-100/50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                <span className="text-white font-bold text-lg">K</span>
                            </div>
                            <span className="font-bold text-xl text-gray-800 tracking-tight">Kesefly</span>
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
                        הצהרת נגישות
                    </h1>
                    <p className="text-lg text-gray-500 font-medium">
                        מחויבים לחוויה שוויונית לכולם
                    </p>
                </div>

                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-1 shadow-xl border border-white/50 ring-1 ring-blue-100">
                    <div className="bg-white rounded-[1.4rem] p-8 md:p-12 shadow-sm">
                        <article className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-800 prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-900 prose-a:text-blue-600 hover:prose-a:text-blue-700">

                            <Section title="מבוא" number="01">
                                <p>
                                    הזירה האינטרנטית הנה פלטפורמה לביטוי וייצוג עצמי, היא משמשת אותנו כזירה חברתית ופוליטית.
                                    אנו רוכשים ומוכרים, עובדים ונחשפים באמצעותה כיום יותר מבעבר.
                                </p>
                                <p>
                                    וככזו ישנה מחויבות לאפשר לציבור חווית גלישה מהנה וקלה ככל האפשר.
                                </p>
                                <p>
                                    אנו משקיעים משאבים רבים להפוך אתר זה לנגיש בכדי לאפשר את חווית הגלישה לכלל האוכלוסייה ולאנשים עם מוגבלויות בפרט.
                                </p>
                                <p className="font-bold">
                                    המוטו שמוביל אותנו הנו כבוד האדם וחירותו, שכן מדובר באבן יסוד בחברה הישראלית כי כולנו שווי זכויות ושווים במהותנו.
                                </p>
                            </Section>

                            <Section title="שימוש ברכיב ההנגשה" number="02">
                                <p>
                                    באתר זה מוטמע רכיב נגישות מתקדם המסייע בהנגשת האתר לבעלי מוגבלויות.
                                </p>
                                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 my-4">
                                    <h4 className="flex items-center gap-2 text-blue-800 mt-0 mb-4 font-bold text-lg">
                                        מדריך למשתמש בתפריט:
                                    </h4>
                                    <ul className="grid md:grid-cols-2 gap-2 text-sm md:text-base list-disc list-inside">
                                        <li>כפתור הגדלת והקטנת טקסט</li>
                                        <li>כפתור גופן קריא (Arial/Sans-serif)</li>
                                        <li>כפתור הדגשת קישורים</li>
                                        <li>כפתור הדגשת כותרות</li>
                                        <li>כפתור ניגודיות גבוהה</li>
                                        <li>כפתור ניגודיות הפוכה</li>
                                        <li>כפתור מצב מונוכרום (שחור לבן)</li>
                                        <li>כפתור סמן עכבר מוגדל</li>
                                        <li>כפתור עצירת אנימציות</li>
                                        <li>כפתור מדריך קריאה (סרגל מיקוד)</li>
                                        <li>כפתור איפוס ההגדרות</li>
                                    </ul>
                                </div>
                            </Section>

                            <Section title="קיצורי מקלדת ושימוש בדפדפן" number="03">
                                <p>
                                    בסרגל הנגישות יש אפשרויות הגדלה לנוחיותכם, אך ניתן להשתמש גם בפונקציות המקלדת הסטנדרטיות:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose mt-4">
                                    <ShortcutKey label="פתיחת/סגירת סרגל" keys={["Esc"]} />
                                    <ShortcutKey label="הגדלת טקסט" keys={["Ctrl", "+"]} />
                                    <ShortcutKey label="הקטנת טקסט" keys={["Ctrl", "-"]} />
                                    <ShortcutKey label="גודל מקורי" keys={["Ctrl", "0"]} />
                                    <ShortcutKey label="גלילה למטה" keys={["Space"]} />
                                    <ShortcutKey label="מסך מלא" keys={["F11"]} />
                                </div>
                            </Section>

                            <Section title="למען הסר ספק" number="04">
                                <p>
                                    אנחנו מחויבים להפוך את אתרינו לנגיש לכלל האנשים, בעלי יכולות ובעלי מוגבלויות.
                                    באתר זה תוכלו למצוא את הטכנולוגיה המתאימה לצרכים שלכם.
                                </p>
                                <p>
                                    אתר זה הנו אתר שמיש לכלל האוכלוסייה ברובו ובהשתדלות מקסימאלית.
                                    ייתכן ותמצאו אלמנטים שאינם מונגשים כי טרם הונגשו או שלא נמצאה טכנולוגיה מתאימה, ולצד זה אנו מבטיחים כי מתבצעים מרב המאמצים לשפר ולהנגיש ברמה גבוהה ובלי פשרות.
                                </p>
                                <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
                                    <strong>נתקלתם בבעיה?</strong> אנו מתנצלים ונשמח מאוד כי תפנו את תשומת ליבנו לכך באמצעות עמוד "צור קשר" או במייל.
                                </div>
                            </Section>


                            <div className="mt-16 pt-10 border-t border-gray-100 text-center">
                                <p className="font-medium text-gray-500 mb-2">יש לכם שאלה בנושא נגישות?</p>
                                <a href="mailto:keseflow.il@gmail.com" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors px-6 py-3 bg-blue-50 hover:bg-blue-100 rounded-full">
                                    פנו לרכז הנגישות
                                </a>
                                <p className="text-sm text-gray-400 mt-8">
                                    keseflow.il@gmail.com
                                </p>
                            </div>

                        </article>
                    </div>
                </div>
            </main>
        </div>
    );
}

function Section({ title, children, number }: { title: string, children: React.ReactNode, number: string }) {
    return (
        <section className="relative group mb-12">
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

function ShortcutKey({ label, keys }: { label: string, keys: string[] }) {
    return (
        <div className="bg-white p-3 border rounded shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
            <span className="text-gray-700 font-medium">{label}</span>
            <div className="flex gap-1">
                {keys.map((k, i) => (
                    <kbd key={i} className="bg-gray-100 px-2 py-1 rounded text-sm font-mono border text-gray-600 min-w-[30px] text-center">
                        {k}
                    </kbd>
                ))}
            </div>
        </div>
    )
}
