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
            name: 'פרטי',
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
            price: 129,
            description: 'ניהול פיננסי מלא לעסק',
            features: [
                "כל הפיצ'רים בתוכנית הפרטית",
                'ניהול מע"מ (VAT) ודוח רווח והפסד',
                'תזרים מזומנים (Cash Flow) עסקי',
                'פרופיל עסקי ואישי נפרדים',
                'ניהול נכסים ופחת'
            ],
            recommended: true
        }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="max-w-4xl mx-auto text-center mb-12">
                <Image
                    src="/K-LOGO.png"
                    alt="KesefFlow"
                    width={200}
                    height={60}
                    className="h-16 w-auto mx-auto mb-6"
                />
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                    בחר את המסלול המתאים לך
                </h1>
                <p className="text-xl text-gray-600">
                    בין אם אתה מנהל משק בית או עסק עצמאי, יש לנו את הפתרון המושלם בשבילך
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`bg-white rounded-2xl shadow-xl overflow-hidden relative border-2 ${plan.recommended ? 'border-purple-500' : 'border-transparent'
                            }`}
                    >
                        {plan.recommended && (
                            <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                מומלץ
                            </div>
                        )}
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <p className="text-gray-500 mb-6 h-10">{plan.description}</p>
                            <div className="flex items-baseline justify-center mb-6" dir="ltr">
                                <span className="text-5xl font-extrabold text-gray-900">₪{plan.price}</span>
                                <span className="text-gray-500 ml-2">/שנה</span>
                            </div>
                            <ul className="space-y-4 mb-8 text-right">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-center">
                                        <Check className="h-5 w-5 text-green-500 ml-3 flex-shrink-0" />
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Button
                                onClick={() => router.push(`/subscribe?plan=${plan.id}`)}
                                className={`w-full py-6 text-lg font-semibold ${plan.recommended
                                    ? 'bg-purple-600 hover:bg-purple-700'
                                    : 'bg-gray-800 hover:bg-gray-900'
                                    }`}
                            >
                                בחר בתוכנית {plan.name}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-12">
                <p className="text-sm text-gray-500">
                    * כל התוכניות כוללות 14 יום ניסיון חינם ללא התחייבות
                </p>
            </div>
        </div>
    )
}
