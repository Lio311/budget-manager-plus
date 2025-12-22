'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useAuth } from '@clerk/nextjs'
import { createSubscription } from '@/lib/actions/subscription'
import { Check } from 'lucide-react'
import Image from 'next/image'

export function Paywall() {
    const { userId } = useAuth()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex justify-center mb-4">
                    <Image
                        src="/keseflow.png"
                        alt="KesefFlow"
                        width={200}
                        height={60}
                        className="h-16 w-auto"
                    />
                </div>
                <p className="text-center text-gray-600 mb-8">
                    ניהול תקציב חכם ופשוט
                </p>

                <div className="text-center mb-8 bg-green-50 rounded-xl p-6">
                    <div className="text-6xl font-black text-green-600 mb-2">
                        ₪50
                    </div>
                    <div className="text-gray-600 text-lg">לשנה שלמה</div>
                    <div className="text-sm text-gray-500 mt-2">רק ₪4.17 לחודש!</div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800 font-medium">
                        <strong>חשוב:</strong> אם לא תחדש את המנוי בתום השנה, כל הנתונים שלך יימחקו לצמיתות.
                    </p>
                </div>

                <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2">
                        <Check className="text-green-500 mt-1 h-5 w-5 flex-shrink-0" />
                        <span>ניהול תקציב חודשי מלא</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="text-green-500 mt-1 h-5 w-5 flex-shrink-0" />
                        <span>מעקב אחר הכנסות והוצאות</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="text-green-500 mt-1 h-5 w-5 flex-shrink-0" />
                        <span>ניהול חובות וחסכונות</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="text-green-500 mt-1 h-5 w-5 flex-shrink-0" />
                        <span>דוחות ואנליטיקס מתקדמים</span>
                    </li>
                </ul>


                {userId ? (
                    <PayPalScriptProvider options={{
                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                        currency: 'ILS'
                    }}>
                        <PayPalButtons
                            createOrder={(data, actions) => {
                                return actions.order.create({
                                    intent: 'CAPTURE',
                                    purchase_units: [{
                                        amount: {
                                            value: '50.00',
                                            currency_code: 'ILS'
                                        },
                                        custom_id: userId
                                    }]
                                })
                            }}
                            onApprove={async (data, actions) => {
                                if (!actions.order) return
                                const order = await actions.order.capture()
                                if (order.id) {
                                    await createSubscription(order.id, 50)
                                    window.location.href = '/dashboard'
                                }
                            }}
                            style={{
                                layout: 'vertical',
                                color: 'blue',
                                shape: 'rect',
                                label: 'pay'
                            }}
                        />
                    </PayPalScriptProvider>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-gray-600">טוען...</p>
                    </div>
                )}

                <p className="text-xs text-center text-gray-500 mt-4">
                    תשלום מאובטח דרך PayPal
                </p>
            </div>
        </div>
    )
}
