'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PlansPage() {
    const router = useRouter()

    const plans = [
        {
            id: 'PERSONAL',
            name: 'אישי',
            title: 'בחר בתוכנית האישית',
            price: 89,
            description: 'ניהול תקציב למשק בית',
            features: [
                'מעקב הוצאות והכנסות',
                'תקציב חודשי חכם',
                'ניהול חובות וחסכונות',
                'דוחות וגרפים בסיסיים',
                'גישה לאפליקציה'
            ],
            recommended: false
        },
        {
            id: 'BUSINESS',
            name: 'עסקי (SMB)',
            title: 'בחר בתוכנית העסקית',
            price: 129,
            description: 'ניהול פיננסי מלא לעסק',
            features: [
                "כל הפיצ'רים בתוכנית הפרטית",
                'ניהול מע"מ (VAT) ודוח רווח והפסד',
                'תזרים מזומנים (Cash Flow) עסקי',
                'פרופיל עסקי ואישי נפרדים',
                'ניהול נכסים ופחת'
            ],
            recommended: false
        },
        {
            id: 'COMBINED',
            name: 'משולב - אישי ועסקי',
            title: 'בחר בתוכנית המשולבת',
            price: 169,
            description: 'גישה מלאה לשני הממשקים',
            features: [
                "כל הפיצ'רים מהתוכנית הפרטית",
                "כל הפיצ'רים מהתוכנית העסקית",
                'מעבר חופשי בין ממשק פרטי לעסקי',
                'ניהול נפרד של תקציב אישי ועסקי',
                'חיסכון של 49 ₪ לעומת רכישה נפרדת'
            ],
            recommended: true
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col justify-center py-4 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="max-w-6xl mx-auto text-center mb-6">
                <Image
                    src="/images/branding/K-LOGO.png"
                    alt="KesefFlow"
                    width={180}
                    height={50}
                    className="h-10 w-auto mx-auto mb-2"
                />
                <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
                    בחרו את המסלול המתאים לכם
                </h1>
                <p className="text-base text-gray-600">
                    בין אם אתם מנהלים משק בית או עסק עצמאי, יש לנו את הפתרון המושלם בשבילכם
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-6xl mx-auto w-full">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-white rounded-xl shadow-lg overflow-hidden relative border-2 ${plan.recommended ? 'border-green-500' : 'border-transparent'
                            }`}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-md">
                                מומלץ
                            </div>
                        )}
                        <div className="p-5">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                            <p className="text-gray-500 text-sm mb-3 h-8 leading-snug">{plan.description}</p>
                            <div className="flex items-baseline justify-center mb-4 gap-1" dir="rtl">
                                <span className="text-3xl font-extrabold text-gray-900">₪{plan.price}</span>
                                <span className="text-gray-500 text-sm">/ שנה</span>
                            </div>
                            <ul className="space-y-2 mb-6 text-right">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center text-sm">
                                        <Check className="h-4 w-4 text-green-500 ml-2 flex-shrink-0" />
                                        <span className="text-gray-600">{feature === "כל הפיצ'רים בתוכנית הפרטית" ? "כל הפיצ'רים מהתוכנית הפרטית" : feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button
                                onClick={() => router.push(`/subscribe?plan=${plan.id}`)}
                                className={`w-full py-2 h-10 text-base font-semibold ${plan.recommended
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-gray-800 hover:bg-gray-900'
                                    }`}
                            >
                                {plan.title}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-6">
                <p className="text-xs text-gray-500">
                    * כל התוכניות כוללות 10 ימי ניסיון חינם ללא התחייבות
                </p>
            </div>
        </div>
    )
}
