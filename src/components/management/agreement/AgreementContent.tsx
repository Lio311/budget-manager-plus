'use client'

import { Input } from "@/components/ui/input"

// Increment this number to invalidate old signatures
export const AGREEMENT_VERSION = 2

interface AgreementContentProps {
    values: any
    onChange: (key: string, value: string) => void
    readOnly?: boolean
    userEmail?: string
    signature?: string | null
}

const EMAILS = {
    LIOR: 'lior31197@gmail.com',
    RON: 'ron.kor97@gmail.com',
    LEON: 'leonpiatti@tuta.com'
}

interface InlineInputProps {
    name: string
    placeholder?: string
    width?: string
    values: any
    onChange: (key: string, value: string) => void
    readOnly: boolean
    isFieldDisabled: (name: string) => boolean
}

const InlineInput = ({ name, placeholder, width = "120px", values, onChange, readOnly, isFieldDisabled }: InlineInputProps) => {
    if (readOnly) {
        return (
            <span className="font-bold border-b border-black px-2 inline-block text-center mx-1">
                {values[name] || "_______"}
            </span>
        )
    }
    const disabled = isFieldDisabled(name)
    return (
        <input
            type="text"
            value={values[name] || ''}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`inline-block border-b border-black focus:outline-none focus:border-blue-500 bg-transparent px-1 mx-1 text-center font-bold placeholder:font-normal placeholder:text-gray-400 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
            style={{ width }}
        />
    )
}

export function AgreementContent({ values, onChange, readOnly = false, userEmail, signature }: AgreementContentProps) {

    const isLior = userEmail === EMAILS.LIOR
    const isRon = userEmail === EMAILS.RON
    const isLeon = userEmail === EMAILS.LEON

    const isFieldDisabled = (fieldName: string) => {
        if (readOnly) return true
        if (!userEmail) return false // Fallback

        if (isLior) return !['liorId', 'day', 'month', 'year'].includes(fieldName)
        if (isRon) return !['ronId', 'day', 'month', 'year'].includes(fieldName)
        if (isLeon) return !['leonId', 'day', 'month', 'year'].includes(fieldName)

        return true
    }

    return (
        <div className="prose max-w-none text-right leading-relaxed text-gray-800 font-open-sans" dir="rtl">
            <h1 className="text-2xl font-bold text-center mb-6 underline">מסמך עקרונות והבנות – מיזם מערכת לניהול כספים</h1>

            <p className="mb-6 text-center">
                נערך ונחתם ביום <InlineInput name="day" placeholder="יום" width="50px" values={values} onChange={onChange} readOnly={readOnly} isFieldDisabled={isFieldDisabled} /> לחודש <InlineInput name="month" placeholder="חודש" width="80px" values={values} onChange={onChange} readOnly={readOnly} isFieldDisabled={isFieldDisabled} /> שנת <InlineInput name="year" placeholder="שנה" width="60px" values={values} onChange={onChange} readOnly={readOnly} isFieldDisabled={isFieldDisabled} />
            </p>

            <h3 className="text-lg font-bold mb-2">הצדדים:</h3>
            <ul className="list-disc pr-6 mb-6 space-y-2">
                <li>
                    ליאור צפריר ת.ז <InlineInput name="liorId" placeholder="מס' ת.ז" width="120px" values={values} onChange={onChange} readOnly={readOnly} isFieldDisabled={isFieldDisabled} /> (להלן: "<strong>ליאור</strong>")
                </li>
                <li>
                    רון קור ת.ז <InlineInput name="ronId" placeholder="מס' ת.ז" width="120px" values={values} onChange={onChange} readOnly={readOnly} isFieldDisabled={isFieldDisabled} /> (להלן: "<strong>רון</strong>")
                </li>
                <li>
                    לאון פיאטיגורסקי ת.ז <InlineInput name="leonId" placeholder="מס' ת.ז" width="120px" values={values} onChange={onChange} readOnly={readOnly} isFieldDisabled={isFieldDisabled} /> (להלן: "<strong>לאון</strong>")
                </li>
            </ul>
            <p className="mb-6 font-bold">להלן ביחד: "הצדדים" או "השותפים"</p>

            <h3 className="text-lg font-bold mb-2 underline">כללי:</h3>
            <ul className="list-disc pr-6 mb-6">
                <li>הצדדים מעוניינים לשתף פעולה בהקמה, פיתוח וניהול של מיזם טכנולוגי בתחום ניהול הכספים (להלן: "<strong>המיזם</strong>").</li>
                <li>מסמך זה נועד להגדיר את חלוקת האחריות, הבעלות והמימון בין הצדדים.</li>
            </ul>

            <h3 className="text-lg font-bold mb-2 underline">רישום העסק וישות משפטית:</h3>
            <ul className="list-disc pr-6 mb-6">
                <li>בשלב הראשוני, ולצורך תחילת הפעילות, המיזם יירשם כעוסק פטור תחת שמו של לאון פיאטיגורסקי.</li>
                <li>מוסכם על הצדדים כי על אף שהרישום הפורמלי הוא על שמו של לאון, המיזם, נכסיו, הקניין הרוחני (הקוד, המותג, הדאטה) והרווחים ממנו שייכים לשלושת השותפים בהתאם לחלוקת האחוזים המוגדרת במסמך זה.</li>
                <li>הצדדים מתחייבים לפעול להקמת חברה בע"מ (או שותפות רשומה) בהקדם האפשרי או עם הגעה ליעדים שיוסכמו, ולהעביר אליה את הפעילות.</li>
            </ul>

            <h3 className="text-lg font-bold mb-2 underline">חלוקת החזקות (Equity)</h3>
            <p className="mb-2">חלוקת הבעלות במיזם (וברווחים שיחולקו כדיבידנד) תהיה כדלקמן:</p>
            <ul className="list-disc pr-6 mb-6">
                <li>ליאור צפריר: <strong>40%</strong></li>
                <li>רון קור: <strong>40%</strong></li>
                <li>לאון פיאטיגורסקי: <strong>20%</strong></li>
            </ul>

            <h3 className="text-lg font-bold mb-2 underline">מנגנון שינוי אחזקות במקרה של עזיבה (Vesting / Clawback)</h3>
            <p className="mb-2">במקרה בו לאון יסיים את פעילותו במיזם (בין אם ביוזמתו ובין אם בהחלטת רוב השותפים) מכל סיבה שהיא, תשתנה חלוקת האחוזים באופן אוטומטי למבנה הבא:</p>
            <ul className="list-disc pr-6 mb-6">
                <li>ליאור צפריר: <strong>47%</strong></li>
                <li>רון קור: <strong>46%</strong></li>
                <li>לאון פיאטיגורסקי: <strong>7%</strong></li>
                <li>במצב זה, לאון יישאר בעל מניות מיעוט פסיבי ("Silent Partner") בשיעור של 7%, ללא זכויות ניהול או קבלת החלטות, אך עם זכאות לרווחים יחסיים.</li>
            </ul>

            <h3 className="text-lg font-bold mb-2 underline">תחומי אחריות ותפקידים</h3>
            <p className="mb-2">כל שותף יקדיש את מירב מאמציו לקידום המיזם בתחומי אחריותו:</p>
            <ul className="list-disc pr-6 mb-6">
                <li><strong>ליאור (פיתוח וטכנולוגיה)</strong>: אחריות מלאה על בניית האתר/פלטפורמה, כתיבת הקוד, תחזוקה שוטפת, פיתוח פיצ'רים חדשים וניהול הצד הטכנולוגי (CTO).</li>
                <li><strong>רון (צמיחה ומוצר)</strong>: אחריות על שיווק, מכירות, בניית אסטרטגיה עסקית, וכן בקרת איכות (QA) למוצר (CMO).</li>
                <li><strong>לאון (תפעול ואבטחה)</strong>: אחריות על אבטחת מידע (InfoSec), הגנה על נתוני משתמשים, וכן טיפול בצד הבירוקרטי של רישום העסק וניהולו הפורמלי מול הרשויות (CISO).</li>
            </ul>

            <h3 className="text-lg font-bold mb-2 underline">מימון והוצאות</h3>
            <p className="mb-2">הצדדים מסכימים על מודל מימון מדורג:</p>
            <ul className="list-disc pr-6 mb-6">
                <li><strong>שלב א' – עד הגעה ל-100 משתמשים משלמים ראשונים:</strong> כל הוצאות המיזם (שרתים, כלים טכנולוגיים, רואה חשבון, רישום וכו') יחולו וישולמו במלואם על ידי רון ולאון (70% רון, 30% לאון).</li>
                <li><strong>שלב ב' – החל מהמשתמש ה-101 ואילך:</strong> מרגע הגעת המיזם ל-100 משתמשים משלמים, כל הוצאה עתידית תתחלק שווה בשווה בין שלושת השותפים (33.3% ליאור, 33.3% רון, 33.3% לאון), או תשולם מתוך רווחי המיזם (במידה וישנם). יש לחדד כי רווחי המיזם עד המשתמש ה-100 לא יחולו על כיסוי ההוצאות הראשוני, אלא, רק מהמשתמש ה-101.</li>
            </ul>

            <h3 className="text-lg font-bold mb-2 underline">הערות:</h3>
            <ul className="list-disc pr-6 mb-6">
                <li>כלל הוצאות השיווק בשלב א' הן על חשבון רון בלבד ואינן כלולות בהוצאות שמתחלקות עם לאון.</li>
                <li>חלוקת האחוזים בין השותפים פתוחה לשינויים בהינתן הסכמה של כלל השותפים וחתימה על חוזה חדשה.</li>
            </ul>

            <div className="mt-12 pt-8 border-t-2 border-gray-200">
                <h3 className="text-lg font-bold mb-6 underline text-center">חתימות:</h3>

                <div className="flex justify-between items-end gap-4 mt-8">
                    <div className="text-center w-1/3">
                        <div className="h-20 border-b border-black mb-2 flex items-end justify-center pb-2 font-handwriting text-lg relative">
                            {(readOnly && isLior && signature) && <img src={signature} alt="Signature" className="h-full object-contain" />}
                        </div>
                        <strong>ליאור צפריר</strong>
                    </div>

                    <div className="text-center w-1/3">
                        <div className="h-20 border-b border-black mb-2 flex items-end justify-center pb-2 font-handwriting text-lg relative">
                            {(readOnly && isRon && signature) && <img src={signature} alt="Signature" className="h-full object-contain" />}
                        </div>
                        <strong>רון קור</strong>
                    </div>

                    <div className="text-center w-1/3">
                        <div className="h-20 border-b border-black mb-2 flex items-end justify-center pb-2 font-handwriting text-lg relative">
                            {(readOnly && isLeon && signature) && <img src={signature} alt="Signature" className="h-full object-contain" />}
                        </div>
                        <strong>לאון פיאטיגורסקי</strong>
                    </div>
                </div>
            </div>
        </div>
    )
}
