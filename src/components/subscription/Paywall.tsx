'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useAuth } from '@clerk/nextjs'
import { createSubscription } from '@/lib/actions/subscription'
import { Check } from 'lucide-react'

export function Paywall() {
    const { userId } = useAuth()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
                <h1 className="text-3xl font-bold text-center mb-2">
                    Budget Manager Plus
                </h1>
                <p className="text-center text-gray-600 mb-8">
                    ניהול תקציב חכם ופשוט
                </p>

                <div className="text-center mb-8 bg-purple-50 rounded-xl p-6">
                    <div className="text-6xl font-black text-purple-600 mb-2">
                        ₪50
                    </div>
                    <div className="text-gray-600 text-lg">לשנה שלמה</div>
                    <div className="text-sm text-gray-500 mt-2">רק ₪4.17 לחודש!</div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800 font-medium">
                        ⚠️ <strong>חשוב:</strong> אם לא תחדש את המנוי בתום השנה, כל הנתונים שלך יימחקו לצמיתות.
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
                                    custom_id: userId || ''
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

                <p className="text-xs text-center text-gray-500 mt-4">
                    תשלום מאובטח דרך PayPal
                </p>
            </div>
        </div>
    )
}
