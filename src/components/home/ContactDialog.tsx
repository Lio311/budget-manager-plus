'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, Loader2, X } from 'lucide-react'
import { submitContactForm } from '@/lib/actions/contact'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'

interface ContactDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ContactDialog({ open, onOpenChange }: ContactDialogProps) {
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
            // Reset form safely
            const form = e.currentTarget
            if (form) {
                setTimeout(() => form.reset(), 0)
            }
            setTimeout(() => {
                setIsSuccess(false)
                onOpenChange(false)
            }, 2000)
        } else {
            toast.error(result.message)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800 text-right">
                        צור קשר
                    </DialogTitle>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-8 mt-4">
                    {/* Contact Form */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-6 h-1 rounded-full bg-green-500 block"></span>
                            שלח לנו הודעה
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
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
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
                                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
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
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                    הודעה
                                </label>
                                <Textarea
                                    id="message"
                                    name="message"
                                    required
                                    placeholder="ספר לנו עוד..."
                                    className="w-full min-h-[120px] resize-none"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting || isSuccess}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-5 rounded-xl shadow-lg shadow-green-200 hover:shadow-xl transition-all"
                            >
                                {isSubmitting ? (
                                    <>
                                        שולח...
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    </>
                                ) : isSuccess ? (
                                    <>
                                        נשלח בהצלחה!
                                        <CheckCircle2 className="mr-2 h-5 w-5" />
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
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="w-6 h-1 rounded-full bg-green-500 block"></span>
                                פרטי התקשרות
                            </h3>

                            <div className="space-y-4">
                                {/* Email */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-200 shrink-0">
                                            <Mail className="text-white" size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 mb-1 text-sm">אימייל</h4>
                                            <a
                                                href="mailto:info@kesefly.co.il"
                                                className="text-green-600 hover:text-green-700 font-medium transition-colors break-all"
                                            >
                                                info@kesefly.co.il
                                            </a>
                                            <p className="text-xs text-gray-500 mt-1">
                                                מענה עד 3 ימי עסקים
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Business Hours */}
                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2 text-sm">
                                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                        שעות פעילות
                                    </h4>
                                    <ul className="space-y-1.5 text-xs text-gray-600">
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

                                {/* FAQ Hint */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                                    <h4 className="font-bold text-green-900 mb-2 text-sm">💡 טיפ</h4>
                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        לפני שפונים אלינו, מומלץ לבדוק את{' '}
                                        <span className="text-green-600 font-medium underline">
                                            שאלות נפוצות
                                        </span>
                                        {' '}- אולי התשובה כבר מחכה לך שם!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
