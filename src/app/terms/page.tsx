import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'תקנון ומדיניות פרטיות',
    description: 'תקנון ומדיניות שימוש באתר ובמוצר',
    robots: {
        index: false,
        follow: false,
    },
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white font-sans" dir="rtl">
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <h1 className="text-3xl font-bold mb-8 text-center">תקנון ומדיניות שימוש באתר ובמוצר 📄</h1>
                <p className="text-gray-500 mb-8 text-center">(מעודכן החל מתאריך 11/8/2025)</p>

                <div className="prose prose-slate max-w-none space-y-8 text-gray-800">
                    <p>ברוכים הבאים לאתר למכירת טמפלטים לניהול תקציב במערכת &quot;Notion&quot;.</p>
                    <p>תקנון זה מנוסח בלשון זכר לצורך נוחות בלבד, אך מתייחס לשני המינים באופן שווה.</p>
                    <p className="font-bold">השימוש באתר וביצוע רכישה כפופים להסכמתך לתנאים הבאים.</p>

                    <section>
                        <h2 className="text-xl font-bold mb-4">1. הגדרות</h2>
                        <ul className="list-disc pr-5 space-y-2">
                            <li><span className="font-bold">המוכר:</span> מפעיל האתר, עוסק פרטי המציע למכירה טמפלטים דיגיטליים לשימוש במערכת &quot;Notion&quot;.</li>
                            <li><span className="font-bold">האתר:</span> הפלטפורמה המקוונת למכירת הטמפלטים.</li>
                            <li><span className="font-bold">הלקוח:</span> כל משתמש שביצע רכישה או השתמש בשירותי האתר.</li>
                            <li><span className="font-bold">המוצר:</span> טמפלט לניהול תקציב המותאם למערכת &quot;Notion&quot;.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">2. תנאי שימוש באתר</h2>
                        <ul className="list-disc pr-5 space-y-2">
                            <li>2.1 האתר נועד לרכישות פרטיות בלבד. אין לבצע שימוש מסחרי במוצרים הנרכשים ללא אישור כתוב מהמוכר.</li>
                            <li>2.2 חל איסור לבצע פעולות שעלולות לפגוע בתפקוד האתר, להעתיק, להפיץ או לשכפל את תוכן האתר או המוצרים ללא אישור מפורש.</li>
                            <li>2.3 המוכר רשאי לשנות את התקנון מעת לעת. הנוסח האחרון באתר הוא המחייב.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">3. רכישה ותשלום</h2>
                        <ul className="list-disc pr-5 space-y-2">
                            <li>3.1 התשלום מתבצע באופן מקוון. עם השלמת התשלום יישלח ללקוח קישור להורדת הטמפלט לכתובת הדוא&quot;ל שסיפק.</li>
                            <li>3.2 הלקוח אחראי להזנת פרטי התקשרות נכונים. המוכר אינו אחראי על טעויות שנובעות מהזנת פרטים שגויים.</li>
                            <li>3.3 המחירים מוצגים בשקלים חדשים וכוללים מע&quot;מ, אם הוא חל לפי החוק.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">4. מדיניות ביטול והחזרים</h2>
                        <ul className="list-disc pr-5 space-y-2">
                            <li>4.1 בשל אופיו הדיגיטלי של המוצר, לא ניתן לבטל רכישה או לקבל החזר כספי לאחר התשלום.</li>
                            <li>4.2 מומלץ לבדוק היטב את תיאור המוצר והתאמתו לצרכים לפני הרכישה.</li>
                            <li>4.3 בכל בעיה טכנית ניתן לפנות למוכר, והוא יעשה מאמץ לסייע.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">5. אחריות, תיקונים ועדכונים</h2>
                        <ul className="list-disc pr-5 space-y-2">
                            <li>5.1 הלקוח מודע לכך שייתכנו באגים בטמפלט. המוכר מתחייב לתקן שגיאות ולספק גרסה מעודכנת עם אותם פיצ&apos;רים שהיו במועד הרכישה.</li>
                            <li>5.2 תיקונים אינם כוללים הוספת פיצ&apos;רים חדשים מעבר למה שנרכש.</li>
                            <li>5.3 טמפלט חדש עם פיצ&apos;רים נוספים או עיצוב שונה יימכר בנפרד, ייתכן שתינתן הנחה לרוכשים קודמים לפי שיקול דעתו של המוכר.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">6. פרטיות ואבטחת מידע</h2>
                        <h3 className="font-bold mb-2">6.1 מטרת איסוף המידע:</h3>
                        <ul className="list-disc pr-5 space-y-1 mb-4">
                            <li>לצורך השלמת רכישות: שליחת קישורים והוצאת חשבוניות.</li>
                            <li>מתן שירות ותמיכה טכנית.</li>
                            <li>שיפור חוויית המשתמש והתאמה אישית.</li>
                            <li>שליחת עדכונים ומבצעים (אם ניתנה הסכמה).</li>
                            <li>עמידה בדרישות חוקיות.</li>
                        </ul>

                        <h3 className="font-bold mb-2">6.2 שימוש מוגבל במידע:</h3>
                        <p className="mb-4">ייעשה רק למטרות שנאסף עבורן, אלא אם יש חובה חוקית אחרת.</p>

                        <h3 className="font-bold mb-2">6.3 שמירה על המידע:</h3>
                        <ul className="list-disc pr-5 space-y-1 mb-4">
                            <li>האתר משתמש במערכות מאובטחות.</li>
                            <li>רק עובדים מורשים גולשים למידע.</li>
                        </ul>

                        <h3 className="font-bold mb-2">6.4 מסירת מידע לצד שלישי:</h3>
                        <ul className="list-disc pr-5 space-y-1 mb-4">
                            <li>רק לצורך השלמת עסקאות (כגון סליקה).</li>
                            <li>או על פי צו שיפוטי.</li>
                        </ul>

                        <h3 className="font-bold mb-2">6.5 שקיפות ללקוחות:</h3>
                        <p className="mb-4">ניתן לבקש לעיין, לעדכן או למחוק מידע אישי – דרך פרטי הקשר שבאתר.</p>

                        <h3 className="font-bold mb-2">6.6 פרטיות ואבטחת המידע המוזן לטמפלט</h3>
                        <ul className="list-disc pr-5 space-y-1">
                            <li>בעת הורדת הטמפלט, כל המידע הפיננסי שאתם מתעדים בטמפלט חשוף רק לכם.</li>
                            <li>אין לנו גישה אליו כלל.</li>
                            <li>המידע נשמר בצורה מאובטחת על חשבון ה-Notion הפרטי שלכם בלבד.</li>
                            <li>האחריות לפרטיות המידע הינה בהתאם למדיניות השימוש של Notion.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">7. שימוש במערכת של מאני מאסטר (Money Master)</h2>
                        <p>מערכת Money Master מבוססת על מטבע מסוג שקל בלבד, כלומר גם כאשר נקלטת עסקה שבוצעה באמצעות אפל פיי טאפ היא תיקלט בשקלים ללא המרה (כלומר לדוגמא אם בוצע תשלום בסך 100$, יקלט 100 ש״ח) ואז אתם יכולים באופן ידני להמיר את הסכום לשקלים. החיבור לאפל פיי טאפ מסתמך על קליטת נתוני העסקה ב-Wallet ב-iPhone. יש לקחת בחשבון שלפעמים בשל עיכוב בקליטת הנתונים האוטומציה תיכשל והמידע לא יירשם אוטומטית והודעת &quot;Faild&quot; תופיע על המסך, ואז כמובן ניתן לרשום את ההוצאה ידנית.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">8. זכויות יוצרים וקניין רוחני</h2>
                        <ul className="list-disc pr-5 space-y-2">
                            <li>8.1 כל התכנים באתר ובמוצרים הם בבעלות המוכר ומוגנים לפי חוק זכויות יוצרים.</li>
                            <li>8.2 אין להעתיק, להפיץ או לשנות תכנים ללא אישור מהמוכר.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold mb-4">9. קשר ותמיכה</h2>
                        <p>אנו מספקים תמיכה טכנית למשך חודשיים ממועד הרכישה.</p>
                        <p>לשאלות או בעיות ניתן לפנות דרך דוא&quot;ל או ווטסאפ, לפי הפרטים באתר.</p>
                        <p>המוכר ישתדל לספק מענה בהקדם.</p>
                    </section>

                    <p className="font-bold mt-8">ביצוע רכישה באתר מהווה הסכמה מלאה לכל התנאים המפורטים לעיל.</p>
                    <p className="font-bold text-center mt-12 text-lg">תודה על בחירתך! ❤️</p>
                </div>
            </div>
        </div>
    )
}
