import { Metadata } from 'next'

export const metadata: Metadata = {
    title: "הצהרת נגישות | Keseflow",
    description: "הצהרת הנגישות של אתר Keseflow - מחויבים לחווית גלישה שוויונית ונגישה לכולם.",
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
                            <span className="font-bold text-xl text-gray-800 tracking-tight">Keseflow</span>
                        </div>
                        <a href="/" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                            חזרה לדף הבית
                        </a>
                    </div>
                </div>
            </div>

            <main className="container mx-auto py-12 px-6 max-w-4xl text-right" dir="rtl">
                <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">הצהרת נגישות</h1>

                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-1 shadow-xl border border-white/50 ring-1 ring-blue-100">
                    <div className="bg-white rounded-[1.4rem] p-8 md:p-12 shadow-sm">
                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">מבוא</h2>
                            <div className="space-y-4 text-gray-700 leading-relaxed">
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
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">שימוש ברכיב ההנגשה</h2>
                            <p className="mb-4 text-gray-700">
                                באתר זה מוטמע רכיב נגישות מתקדם המסייע בהנגשת האתר לבעלי מוגבלויות.
                            </p>

                            <h3 className="text-xl font-bold mb-3 text-gray-800">מדריך למשתמש בתפריט:</h3>
                            <ul className="list-disc list-inside space-y-2 text-gray-700 bg-blue-50/50 p-6 rounded-lg border border-blue-100">
                                <li>כפתור הגדלת והקטנת טקסט</li>
                                <li>כפתור גופן קריא (משנה את הגופן ל-Arial/Sans-serif)</li>
                                <li>כפתור הדגשת קישורים (קו תחתון ורקע צהוב)</li>
                                <li>כפתור הדגשת כותרות (רקע תכלת וקו תחתון)</li>
                                <li>כפתור ניגודיות גבוהה (רקע שחור, טקסט צהוב)</li>
                                <li>כפתור ניגודיות הפוכה (היפוך צבעים מלא)</li>
                                <li>כפתור מצב מונוכרום (שחור לבן)</li>
                                <li>כפתור סמן עכבר מוגדל (להקלה על המעקב)</li>
                                <li>כפתור עצירת אנימציות (מניעת הבהובים ותזוזות)</li>
                                <li>כפתור מדריך קריאה (סרגל מיקוד)</li>
                                <li>כפתור איפוס ההגדרות</li>
                            </ul>
                        </section>

                        <section className="mb-10">
                            <h3 className="text-xl font-bold mb-3 text-gray-800">קיצורי מקלדת ושימוש בדפדפן</h3>
                            <p className="mb-4 text-gray-700">
                                בסרגל הנגישות יש אפשרויות הגדלה לנוחיותכם, אך ניתן להשתמש גם בפונקציות המקלדת הסטנדרטיות:
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                                <li className="bg-white p-3 border rounded shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
                                    <span>פתיחת/סגירת סרגל נגישות</span>
                                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm font-mono border">Esc</kbd>
                                </li>
                                <li className="bg-white p-3 border rounded shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
                                    <span>הגדלת טקסט</span>
                                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm font-mono border">Ctrl +</kbd>
                                </li>
                                <li className="bg-white p-3 border rounded shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
                                    <span>הקטנת טקסט</span>
                                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm font-mono border">Ctrl -</kbd>
                                </li>
                                <li className="bg-white p-3 border rounded shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
                                    <span>גודל מקורי</span>
                                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm font-mono border">Ctrl 0</kbd>
                                </li>
                                <li className="bg-white p-3 border rounded shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
                                    <span>גלילה למטה</span>
                                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm font-mono border">Space</kbd>
                                </li>
                                <li className="bg-white p-3 border rounded shadow-sm flex justify-between items-center hover:bg-gray-50 transition">
                                    <span>מסך מלא</span>
                                    <kbd className="bg-gray-100 px-2 py-1 rounded text-sm font-mono border">F11</kbd>
                                </li>
                            </ul>
                        </section>

                        <section className="mb-10 bg-blue-50 p-8 rounded-xl border border-blue-100">
                            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b border-blue-200 pb-2">למען הסר ספק</h2>
                            <div className="space-y-4 text-gray-700">
                                <p>
                                    אנחנו מחויבים להפוך את אתרינו לנגיש לכלל האנשים, בעלי יכולות ובעלי מוגבלויות.
                                    באתר זה תוכלו למצוא את הטכנולוגיה המתאימה לצרכים שלכם.
                                </p>
                                <p>
                                    אתר זה הנו אתר שמיש לכלל האוכלוסייה ברובו ובהשתדלות מקסימאלית.
                                    ייתכן ותמצאו אלמנטים שאינם מונגשים כי טרם הונגשו או שלא נמצאה טכנולוגיה מתאימה, ולצד זה אנו מבטיחים כי מתבצעים מרב המאמצים לשפר ולהנגיש ברמה גבוהה ובלי פשרות.
                                </p>
                                <p className="font-bold text-blue-800 mt-4">
                                    במידה ונתקלתם בקושי בגלישה באתר וצפייה בתוכנו, אנו מתנצלים ונשמח מאוד כי תפנו את תשומת ליבנו לכך באמצעות עמוד "צור קשר" או במייל.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
