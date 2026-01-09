'use client'

import { Input } from "@/components/ui/input"

// Increment this number to invalidate old signatures
export const AGREEMENT_VERSION = 1

interface AgreementContentProps {
    values: any
    onChange: (key: string, value: string) => void
    readOnly?: boolean
}

export function AgreementContent({ values, onChange, readOnly = false }: AgreementContentProps) {

    const InlineInput = ({ name, placeholder, width = "150px" }: { name: string, placeholder?: string, width?: string }) => {
        if (readOnly) {
            return (
                <span className="font-bold border-b border-black px-2 inline-block min-w-[50px] text-center">
                    {values[name] || "_______"}
                </span>
            )
        }
        return (
            <input
                type="text"
                value={values[name] || ''}
                onChange={(e) => onChange(name, e.target.value)}
                placeholder={placeholder}
                className="inline-block border-b border-black focus:outline-none focus:border-blue-500 bg-transparent px-1 mx-1 text-center font-bold placeholder:font-normal placeholder:text-gray-400"
                style={{ width }}
            />
        )
    }

    return (
        <div className="prose max-w-none text-right font-serif leading-relaxed text-gray-800" dir="rtl">
            <h1 className="text-2xl font-bold text-center mb-8 underline">הסכם העסקה אישי</h1>

            <p className="mb-6">
                נערך ונחתם ביום <InlineInput name="signedDay" placeholder="יום" width="40px" /> לחודש <InlineInput name="signedMonth" placeholder="חודש" width="80px" /> שנת <InlineInput name="signedYear" placeholder="שנה" width="60px" />
            </p>

            <div className="flex justify-between items-start mb-8 gap-4">
                <div className="w-1/2">
                    <strong>בין: </strong>
                    <span className="font-bold">קספליי בע"מ</span>
                    <br />
                    ח.פ. 511111111
                    <br />
                    (להלן: "<strong>החברה</strong>")
                    <br />
                    <span className="float-left ml-4 underline">מצד אחד</span>
                </div>

                <div className="w-1/2">
                    <strong>לבין: </strong>
                    <InlineInput name="employeeName" placeholder="שם העובד המלא" width="200px" />
                    <br />
                    ת.ז. <InlineInput name="employeeId" placeholder="מספר תעודת זהות" width="150px" />
                    <br />
                    כתובת: <InlineInput name="employeeAddress" placeholder="כתובת מלאה" width="250px" />
                    <br />
                    (להלן: "<strong>העובד</strong>")
                    <br />
                    <span className="float-left ml-4 underline">מצד שני</span>
                </div>
            </div>

            <h3 className="text-xl font-bold mb-4">1. תפקיד העובד</h3>
            <p className="mb-4">
                העובד מועסק בתפקיד <InlineInput name="jobTitle" placeholder="הגדרת תפקיד" width="180px" />.
                העובד מתחייב למלא את תפקידו במסירות, בנאמנות ובמיומנות, ולפעול בהתאם להנחיות החברה והממונים עליו.
            </p>

            <h3 className="text-xl font-bold mb-4">2. תקופת העסקה</h3>
            <p className="mb-4">
                הסכם זה הינו לתקופה בלתי קצובה וייכנס לתוקף החל מיום <InlineInput name="startDate" placeholder="תאריך התחלה" width="120px" />.
                כל צד רשאי לסיים את ההסכם במתן הודעה מוקדמת בכתב כדין.
            </p>

            <h3 className="text-xl font-bold mb-4">3. שכר עבודה</h3>
            <p className="mb-4">
                שכר העובד יעמוד על סך של <InlineInput name="salary" placeholder="סכום ברוטו" width="100px" /> ש"ח ברוטו לחודש.
                השכר ישולם לא יאוחר מה-9 לכל חודש קלנדרי עבור החודש הקודם.
            </p>

            <h3 className="text-xl font-bold mb-4">4. סודיות</h3>
            <p className="mb-4">
                העובד מתחייב לשמור בסודיות מוחלטת כל מידע שהגיע לידיעתו במסגרת עבודתו בחברה ולא לעשות בו שימוש כלשהו אלא לצרכי עבודתו בחברה בלבד.
            </p>

            <div className="mt-12 pt-8 border-t-2 border-gray-200">
                <p className="font-bold mb-2">ולראיה באו הצדדים על החתום:</p>

                <div className="flex justify-between items-end h-24 mt-8">
                    <div className="text-center w-1/3">
                        <div className="h-16 border-b border-black mb-2 flex items-end justify-center pb-2 font-handwriting text-xl">
                            קספליי בע"מ
                        </div>
                        החברה
                    </div>

                    <div className="text-center w-1/3">
                        {/* Space for signature pad in parent component */}
                        <div className="h-16 mb-2 flex items-end justify-center pb-2">
                            (חתימה למטה)
                        </div>
                        העובד
                    </div>
                </div>
            </div>
        </div>
    )
}
