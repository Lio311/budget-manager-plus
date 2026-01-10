'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, ArrowRight, User, UserPlus } from 'lucide-react'
import { SignInButton, SignUpButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

export default function GetStartedPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center p-4 font-sans" dir="rtl">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-emerald-600 p-6 text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">ברוכים הבאים ל-Kesefly</h1>
                    <p className="text-emerald-100">הדרך החכמה לניהול עתידך הכלכלי</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="text-center mb-6">
                        <p className="text-gray-600">איך תרצו להתחיל?</p>
                    </div>

                    <div className="space-y-4">
                        <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
                            <Button className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-between px-6 group">
                                <span className="flex items-center gap-3">
                                    <UserPlus className="w-5 h-5" />
                                    הרשמה מהירה (מומלץ)
                                </span>
                                <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </SignUpButton>

                        <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                            <Button variant="outline" className="w-full h-14 text-lg border-2 border-gray-200 hover:border-emerald-200 hover:bg-emerald-50 text-gray-700 rounded-xl transition-all flex items-center justify-between px-6">
                                <span className="flex items-center gap-3">
                                    <User className="w-5 h-5" />
                                    כניסה לחשבון קיים
                                </span>
                            </Button>
                        </SignInButton>

                        <div className="relative py-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500">או נסה בלי להירשם</span>
                            </div>
                        </div>

                        <Link href="/demo">
                            <Button variant="ghost" className="w-full h-12 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                המשך כאורח (מצב דמה)
                            </Button>
                        </Link>
                    </div>

                    <div className="text-center mt-6">
                        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                            חזרה לדף הבית
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
