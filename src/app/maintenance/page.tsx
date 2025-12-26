import { Construction } from 'lucide-react'

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4" dir="rtl">
            <div className="max-w-2xl w-full">
                {/* Animated Construction Icon */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                        <div className="relative bg-white rounded-full p-8 shadow-2xl">
                            <Construction className="w-24 h-24 text-blue-600 animate-bounce" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white rounded-3xl shadow-2xl p-12 text-center space-y-6 border border-gray-100">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        האתר בשיפוצים כרגע
                    </h1>

                    <div className="space-y-4">
                        <p className="text-2xl text-gray-700 font-medium">
                            אנחנו עובדים על שיפורים מרגשים! 🚀
                        </p>

                        <p className="text-xl text-gray-600">
                            האתר יחזור לפעילות בשעות הקרובות
                        </p>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="pt-8">
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse w-[70%]">
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-3">
                            מתקדמים יפה... כמעט מוכנים!
                        </p>
                    </div>

                </div>

                {/* Footer Note */}
                <p className="text-center text-gray-500 mt-8 text-sm">
                    תודה על הסבלנות! 💙
                </p>
            </div>
        </div>
    )
}
