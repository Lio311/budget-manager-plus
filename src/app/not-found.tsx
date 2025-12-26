import Link from 'next/link'
import { Home, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50" dir="rtl">
            <div className="text-center px-4 max-w-2xl">
                {/* 404 Number */}
                <div className="relative mb-8">
                    <h1 className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 leading-none">
                        404
                    </h1>
                    <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-r from-blue-600 to-purple-600"></div>
                </div>

                {/* Message */}
                <div className="space-y-4 mb-8">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                        הדף לא נמצא
                    </h2>
                    <p className="text-lg text-gray-600 max-w-md mx-auto">
                        מצטערים, הדף שחיפשת אינו קיים או הועבר למקום אחר
                    </p>
                </div>

                {/* Illustration */}
                <div className="mb-8 flex justify-center">
                    <svg className="w-64 h-64 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link href="/">
                        <Button size="lg" className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                            <Home className="h-5 w-5" />
                            חזרה לדף הבית
                        </Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button size="lg" variant="outline" className="gap-2">
                            לוח הבקרה
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                {/* Additional Help */}
                <div className="mt-12 text-sm text-gray-500">
                    <p>זקוק לעזרה? צור קשר עם התמיכה שלנו</p>
                </div>
            </div>
        </div>
    )
}
