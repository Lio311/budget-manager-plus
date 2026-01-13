'use client'

import { useState } from 'react'
import { Mail, Send, CheckCircle2, Loader2 } from 'lucide-react'
import { submitContactForm } from '@/lib/actions/contact'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function ContactPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const result = await submitContactForm(formData)

        setIsSubmitting(false)

        if (result.success) {
            setIsSuccess(true)
            toast.success(result.message)
            // Reset form
            e.currentTarget.reset()
            // Reset success state after 3 seconds
            setTimeout(() => setIsSuccess(false), 3000)
        } else {
            toast.error(result.message)
        }
    }

    return (
        <div className="min-h-screen bg-[#f0fdf4] font-rubik" dir="rtl">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-green-100/50">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200">
                                <span className="text-white font-bold text-lg">K</span>
                            </div>
                            <span className="font-bold text-xl text-gray-800 tracking-tight">Kesefly</span>
                        </div>
                        <a href="/" className="text-sm font-medium text-gray-500 hover:text-green-600 transition-colors">
                            חזרה לדף הבית
                        </a>
                    </div>
                </div>
            </div>

            <main className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Title */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-green-800 to-green-600 pb-2">
                        צור קשר
                    </h1>
                    <p className="text-lg text-gray-500 font-medium">
                        אנחנו כאן לכל שאלה, הצעה או בקשה
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-1 shadow-xl border border-white/50 ring-1 ring-green-100">
                    <div className="bg-white rounded-[1.4rem] p-8 md:p-12 shadow-sm">
                        <div className="grid md:grid-cols-2 gap-12">
                            {/* Contact Form */}
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <span className="w-8 h-1 rounded-full bg-green-500 block"></span>
                                    שלח לנו הודעה
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                            שם מלא
                                        </label>
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            placeholder="איך קוראים לך?"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                            אימייל
                                        </label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            required
                                            placeholder="your@email.com"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                                            נושא
                                        </label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            type="text"
                                            required
                                            placeholder="במה נוכל לעזור?"
                                            className="w-full"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                                            הודעה
                                        </label>
                                        <Textarea
                                            id="message"
                                            name="message"
                                            required
                                            placeholder="ספר לנו עוד..."
                                            className="w-full min-h-[150px] resize-none"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || isSuccess}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-green-200 hover:shadow-xl transition-all"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                                שולח...
                                            </>
                                        ) : isSuccess ? (
                                            <>
                                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                                נשלח בהצלחה!
                                            </>
                                        ) : (
                                            <>
                                                שלח הודעה
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <span className="w-8 h-1 rounded-full bg-green-500 block"></span>
                                        פרטי התקשרות
                                    </h2>

                                    <div className="space-y-6">
                                        {/* Email */}
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100 hover:shadow-md transition-shadow">
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200 shrink-0">
                                                    <Mail className="text-white" size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-gray-800 mb-1">אימייל</h3>
                                                    <a
                                                        href="mailto:info@kesefly.co.il"
                                                        className="text-green-600 hover:text-green-700 font-medium text-lg transition-colors break-all"
                                                    >
                                                        info@kesefly.co.il
                                                    </a>
                                                    <p className="text-sm text-gray-500 mt-2">
                                                        מענה עד 3 ימי עסקים
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info Box */}
                                        <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                                            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                שעות פעילות
                                            </h4>
                                            <ul className="space-y-2 text-sm text-gray-600">
                                                <li className="flex justify-between">
                                                    <span className="font-medium">ראשון - חמישי:</span>
                                                    <span>18:00 - 09:00</span>
                                                </li>
                                                <li className="flex justify-between">
                                                    <span className="font-medium">שישי:</span>
                                                    <span>13:00 - 09:00</span>
                                                </li>
                                                <li className="flex justify-between text-gray-400">
                                                    <span className="font-medium">שבת:</span>
                                                    <span>סגור</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
