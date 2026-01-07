'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle, Mail, Phone, Shield, User } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock Data - In real app, fetch from `clerk` or `prisma.user`
const TEAM_MEMBERS = [
    { id: 1, name: 'Lior', role: 'Manager', email: 'lior@example.com', avatar: 'L', department: 'Management' },
    { id: 2, name: 'Ron', role: 'Developer', email: 'ron@example.com', avatar: 'R', department: 'Development' },
    { id: 3, name: 'Leon', role: 'Designer', email: 'leon@example.com', avatar: 'L', department: 'Design' },
]

export default function TeamPage() {
    return (
        <div className="space-y-8 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">ניהול צוות</h2>
                    <p className="text-gray-500">חברי הצוות וההרשאות שלהם</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TEAM_MEMBERS.map((member, index) => (
                    <motion.div
                        key={member.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow border-t-4 border-t-blue-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">
                                {member.department}
                            </div>

                            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 mb-4 border-4 border-white shadow-sm">
                                {member.avatar}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                            <p className="text-sm text-blue-600 font-medium mb-4">{member.role}</p>

                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Mail size={14} /> אימייל</span>
                                    <span className="font-medium text-gray-800 dir-ltr">{member.email}</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                                    <span className="text-gray-500 flex items-center gap-2"><Shield size={14} /> הרשאות</span>
                                    <span className="font-medium text-gray-800 flex items-center gap-1">
                                        <CheckCircle size={12} className="text-green-500" />
                                        פעיל
                                    </span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
