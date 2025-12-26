import Image from 'next/image'
import { Construction } from 'lucide-react'

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4" dir="rtl">
            <div className="max-w-2xl w-full">
                {/* Logo */}
                <div className="flex justify-center mb-8 animate-pulse">
                    <Image
                        src="/K-LOGO.png"
                        alt="KesefFlow"
                        width={300}
                        height={90}
                        className="h-20 w-auto"
                        priority
                    />
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center relative overflow-hidden">
                    {/* Decorative Background Elements */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                    {/* Animated Icon */}
                    <div className="mb-6 flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                            <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-6">
                                <Construction className="h-16 w-16 text-white animate-bounce" />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        האתר בשיפוצים
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-gray-700 mb-6 font-medium">
                        אנחנו עובדים על שיפורים מרגשים!
                    </p>

                    {/* Description */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8">
                        <p className="text-gray-600 text-lg leading-relaxed">
                            המערכת שלנו עוברת תחזוקה מתוכננת כדי להביא לכם חוויה טובה יותר.
                            <br />
                            <span className="font-semibold text-gray-800">נחזור לפעילות בשעות הקרובות.</span>
                        </p>
                    </div>

                    {/* Features Being Improved */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 rounded-xl p-4">
                            <div className="text-3xl mb-2">⚡</div>
                            <p className="text-sm font-semibold text-gray-700">ביצועים משופרים</p>
                        </div>
                        <div className="bg-purple-50 rounded-xl p-4">
                            <div className="text-3xl mb-2">🎨</div>
                            <p className="text-sm font-semibold text-gray-700">עיצוב מחודש</p>
                        </div>
                        <div className="bg-pink-50 rounded-xl p-4">
                            <div className="text-3xl mb-2">🚀</div>
                            <p className="text-sm font-semibold text-gray-700">תכונות חדשות</p>
                        </div>
                    </div>

                    {/* Footer Message */}
                    <p className="text-gray-500 text-sm">
                        תודה על הסבלנות! 💙
                    </p>
                </div>

                {/* Bottom Text */}
                <p className="text-center text-gray-600 mt-6 text-sm">
                    לשאלות ובעיות דחופות, צרו קשר בכתובת:
                    <a href="mailto:support@kesefflow.com" className="text-blue-600 hover:text-blue-700 font-medium mr-1">
                        support@kesefflow.com
                    </a>
                </p>
            </div>
        </div>
    )
}
