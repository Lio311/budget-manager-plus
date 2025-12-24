'use client'

import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js'
import { useAuth, useUser } from '@clerk/nextjs'
import { Check, Tag } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { validateCoupon, getSubscriptionStatus, startTrial } from '@/lib/actions/subscription'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function Paywall() {
    const { userId } = useAuth()
    const { user } = useUser()
    const [couponCode, setCouponCode] = useState('')
    const [discount, setDiscount] = useState(0)
    const [price, setPrice] = useState(89)
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
            setPrice(89 * (1 - result.discountPercent / 100))
            setCouponMessage(`קופון הופעל! ${result.discountPercent}% הנחה`)
            toast.success('קופון הופעל בהצלחה!')
        } else {
            setDiscount(0)
            setPrice(89)
            setCouponMessage(result.message || 'קופון לא תקין')
            toast.error(result.message || 'קופון לא תקין')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-2 sm:p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-4 overflow-y-auto max-h-[95vh]">
                <div className="flex justify-center mb-1">
                    <Image
                        src="/keseflow.png"
                        alt="KesefFlow"
                        width={200}
                        height={60}
                        className="h-14 w-auto"
                    />
                </div>

                <h1 className="text-lg font-bold text-center mb-1 text-gray-800">
                    {isTrialExpired ? 'תקופת הניסיון הסתיימה' : 'ניהול תקציב חכם ופשוט'}
                </h1>

                {isTrialExpired && (
                    <p className="text-center text-gray-600 mb-2 text-xs">
                        כדי להמשיך להשתמש במערכת ולשמור על הנתונים שלך, יש להסדיר תשלום.
                    </p>
                )}

                <p className="text-center text-[10px] font-semibold text-yellow-500 mb-2">
                    בקרוב - ממשק לעסקים!
                </p>

                <div className="text-center mb-3 bg-green-50 rounded-lg p-2 border border-green-100 relative overflow-hidden">
                    {discount > 0 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full transform rotate-12 dir-ltr">
                            {discount}%-
                        </div>
                    )}
                    <div className="text-3xl font-black text-green-600 mb-0 flex items-center justify-center gap-1" dir="ltr">
                        <span className="text-lg">₪</span>{price.toFixed(2)}
                    </div>
                    <div className="text-gray-600 text-xs">לשנה שלמה</div>
                    <div className="text-[10px] text-gray-500 mt-0">
                        {discount > 0 ? (
                            <>
                                מחיר לחודש:&nbsp;
                                <span className="line-through text-red-400 mx-1">₪7.42</span>
                                <strong>₪{(price / 12).toFixed(2)}</strong>
                            </>
                        ) : (
                            'רק ₪7.42 לחודש!'
                        )}
                    </div>
                </div>

                {/* Coupon Input */}
                <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                        <Tag className="absolute right-3 top-2.5 h-3 w-3 text-gray-400" />
                        <Input
                            placeholder="קוד קופון"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="pr-8 h-8 text-xs"
                        />
                    </div>
                    <Button onClick={handleApplyCoupon} variant="outline" size="sm" className="h-8 text-xs">החל</Button>
                </div>
                {couponMessage && (
                    <p className={`text-[10px] text-center mb-2 ${discount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {couponMessage}
                    </p>
                )}

                <div className="bg-red-50 border border-red-200 rounded-lg p-1 mb-2 flex items-center justify-center">
                    <p className="text-[10px] text-red-800 font-medium text-center whitespace-nowrap overflow-hidden text-ellipsis px-1">
                        <strong>חשוב:</strong> ללא חידוש המנוי בזמן, הנתונים שלך ימחקו לצמיתות.
                    </p>
                </div>

                <ul className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <li className="flex items-start gap-1.5">
                        <Check className="text-green-500 mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span>ניהול תקציב חודשי</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                        <Check className="text-green-500 mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span>מעקב הכנסות/הוצאות</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                        <Check className="text-green-500 mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span>ניהול חובות וחסכונות</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                        <Check className="text-green-500 mt-0.5 h-3 w-3 flex-shrink-0" />
                        <span>דוחות מתקדמים</span>
                    </li>
                </ul>


                {!isTrialExpired && (
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full mb-2 bg-white text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-gray-900 font-medium transition-all duration-200"
                        onClick={async (e) => {
                            const btn = e.currentTarget;
                            const originalText = btn.innerText;
                            btn.innerText = 'מפעיל...';
                            btn.disabled = true;

                            console.log('Trial button clicked');
                            if (!user?.id || !user?.emailAddresses?.[0]?.emailAddress) {
                                console.log('User not found in client');
                                toast.error('אנא התחבר מחדש');
                                btn.innerText = originalText;
                                btn.disabled = false;
                                return;
                            }

                            const toastId = toast.loading('מפעיל תקופת ניסיון...');
                            try {
                                const result = await startTrial(user.id, user.emailAddresses[0].emailAddress);

                                if (result.success) {
                                    toast.dismiss(toastId);
                                    toast.success('הופעל בהצלחה! מעביר...');
                                    window.location.href = '/dashboard';
                                } else {
                                    toast.dismiss(toastId);
                                    toast.error(result.reason || 'שגיאה');
                                    btn.innerText = originalText;
                                    btn.disabled = false;
                                }
                            } catch (error) {
                                console.error('Trial start error:', error);
                                toast.dismiss(toastId);
                                toast.error('שגיאה בלתי צפויה');
                                btn.innerText = originalText;
                                btn.disabled = false;
                            }
                        }}
                    >

                        התנסות במערכת ללא תשלום וללא התחייבות ל-14 ימים
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
