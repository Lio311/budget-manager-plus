'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useAuth, useUser } from '@clerk/nextjs'
import { Check, Tag } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { validateCoupon, getSubscriptionStatus } from '@/lib/actions/subscription'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function Paywall() {
    const { userId } = useAuth()
    const { user } = useUser()
    const [couponCode, setCouponCode] = useState('')
    const [discount, setDiscount] = useState(0)
    const [price, setPrice] = useState(50)
    const [couponMessage, setCouponMessage] = useState('')
    const [isTrialExpired, setIsTrialExpired] = useState(false)

    useEffect(() => {
        if (userId) {
            getSubscriptionStatus(userId).then(status => {
                if (status.status === 'trial_expired') {
                    setIsTrialExpired(true)
                }
            })
        }
    }, [userId])

    const handleApplyCoupon = async () => {
        if (!couponCode || !user?.emailAddresses[0]?.emailAddress) return

        const result = await validateCoupon(couponCode, user.emailAddresses[0].emailAddress)

        if (result.valid && result.discountPercent) {
            setDiscount(result.discountPercent)
            setPrice(50 * (1 - result.discountPercent / 100))
            setCouponMessage(`קופון הופעל! ${result.discountPercent}% הנחה`)
            toast.success('קופון הופעל בהצלחה!')
        } else {
            setDiscount(0)
            setPrice(50)
            setCouponMessage(result.message || 'קופון לא תקין')
            toast.error(result.message || 'קופון לא תקין')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[95vh]">
                <div className="flex justify-center mb-2">
                    <Image
                        src="/keseflow.png"
                        alt="KesefFlow"
                        width={300}
                        height={90}
                        className="h-20 w-auto"
                    />
                </div>

                <h1 className="text-xl font-bold text-center mb-2 text-gray-800">
                    {isTrialExpired ? 'תקופת הניסיון הסתיימה' : 'ניהול תקציב חכם ופשוט'}
                </h1>

                {isTrialExpired && (
                    <p className="text-center text-gray-600 mb-4 text-sm">
                        כדי להמשיך להשתמש במערכת ולשמור על הנתונים שלך, יש להסדיר תשלום.
                    </p>
                )}

                <p className="text-center text-xs font-semibold text-purple-600 mb-4">
                    בקרוב - ממשק לעסקים!
                </p>

                <div className="text-center mb-4 bg-green-50 rounded-lg p-3 border border-green-100 relative overflow-hidden">
                    {discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full transform rotate-12">
                            -{discount}%
                        </div>
                    )}
                    <div className="text-5xl font-black text-green-600 mb-1 flex items-center justify-center gap-1" dir="ltr">
                        <span className="text-2xl">₪</span>{price.toFixed(2)}
                    </div>
                    <div className="text-gray-600 text-base">לשנה שלמה</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {discount > 0 ? (
                            <>
                                <span className="line-through text-red-400 mx-1">₪4.17</span>
                                <strong>₪{(price / 12).toFixed(2)}</strong>
                            </>
                        ) : (
                            'רק ₪4.17 לחודש!'
                        )}
                    </div>
                </div>

                {/* Coupon Input */}
                <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                        <Tag className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="קוד קופון"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="pr-9 h-9 text-sm"
                        />
                    </div>
                    <Button onClick={handleApplyCoupon} variant="outline" size="sm">החל</Button>
                </div>
                {couponMessage && (
                    <p className={`text-xs text-center mb-2 ${discount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {couponMessage}
                    </p>
                )}

                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-red-800 font-medium">
                        <strong>חשוב:</strong> אם לא תחדש את המנוי בתום השנה, כל הנתונים שלך יימחקו לצמיתות.
                    </p>
                </div>

                <ul className="space-y-2 mb-4 text-sm">
                    <li className="flex items-start gap-2">
                        <Check className="text-green-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>ניהול תקציב חודשי מלא</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="text-green-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>מעקב אחר הכנסות והוצאות</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="text-green-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>ניהול חובות וחסכונות</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <Check className="text-green-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                        <span>דוחות ואנליטיקס מתקדמים</span>
                    </li>
                </ul>


                {!isTrialExpired && (
                    <Button
                        variant="secondary"
                        size="sm"
                        className="w-full mb-3 bg-purple-100 text-purple-700 hover:bg-purple-200"
                        onClick={async () => {
                            // We can redirect to dashboard which triggers the auto-trial logic
                            window.location.href = '/dashboard'
                        }}
                    >
                        נסה 14 יום חינם!
                    </Button>
                )}

                {userId ? (
                    <PayPalScriptProvider options={{
                        clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
                        currency: 'ILS'
                    }}>
                        <PayPalButtons
                            createOrder={(data, actions) => {
                                return actions.order.create({
                                    intent: 'CAPTURE',
                                    purchase_units: [
                                        {
                                            amount: {
                                                currency_code: 'ILS',
                                                value: price.toFixed(2),
                                            },
                                            description: 'מנוי שנתי למערכת ניהול תקציב',
                                            custom_id: couponCode || undefined
                                        },
                                    ],
                                })
                            }}
                            onApprove={async (data, actions) => {
                                if (actions.order) {
                                    const details = await actions.order.capture()
                                    // Handle successful payment here
                                    // You might want to call a server action here to update subscription
                                    try {
                                        const response = await fetch('/api/subscription/create', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                                orderId: details.id,
                                                amount: price
                                            }),
                                        })

                                        if (response.ok) {
                                            window.location.href = '/dashboard'
                                        }
                                    } catch (error) {
                                        console.error('Payment error:', error)
                                        toast.error('התשלום עבר אך הייתה שגיאה בעדכון המנוי. אנא צור קשר.')
                                    }
                                }
                            }}
                            style={{ layout: 'vertical' }}
                        />
                    </PayPalScriptProvider>
                ) : (
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <p className="text-gray-600 mb-2">יש להרשם למערכת כדי לרכוש מנוי</p>
                        <Button onClick={() => window.location.href = '/sign-in'}>
                            הרשמה / התחברות
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
