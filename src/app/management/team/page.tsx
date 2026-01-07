'use client'

import { Card } from '@/components/ui/card'
import { CheckCircle, Mail, Phone, Shield, User } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock Data - In real app, fetch from `clerk` or `prisma.user`
const TEAM_MEMBERS = [
    { id: 1, name: 'Lior', role: 'Full Stack Developer', email: 'lior31197@gmail.com', avatar: '/lior-profile.jpg', department: 'Development', color: 'bg-blue-500' },
    { id: 2, name: 'Ron', role: 'QA & Marketing', email: 'ron.kor97@gmail.com', avatar: 'R', department: 'Marketing & QA', color: 'bg-orange-500' },
    { id: 3, name: 'Leon', role: 'Security Engineer', email: 'leon@example.com', avatar: 'L', department: 'Security', color: 'bg-red-500' },
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
                        <Card className={`p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow relative overflow-hidden group`}>
                            {/* Top Color Bar */}
                            <div className={`absolute top-0 left-0 right-0 h-2 ${member.color}`} />

                            <div className={`absolute top-4 right-4 ${member.color} text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm`}>
                                {member.department}
                            </div>

                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 border-4 border-white shadow-md ${member.color} overflow-hidden`}>
                                {member.avatar.length > 2 ? (
                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{member.avatar}</span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
                            <p className={`text-sm font-bold mb-6 opacity-80 ${member.color.replace('bg-', 'text-')}`}>{member.role}</p>

                            <div className="w-full space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                                    <span className="text-gray-500 flex items-center gap-2"><Mail size={16} className={`${member.color.replace('bg-', 'text-')}`} /> אימייל</span>
                                    <span className="font-medium text-gray-800 dir-ltr">{member.email}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                                    <span className="text-gray-500 flex items-center gap-2"><Shield size={16} className={`${member.color.replace('bg-', 'text-')}`} /> הרשאות</span>
                                    <span className="font-medium text-gray-800 flex items-center gap-1">
                                        <CheckCircle size={14} className="text-green-500" />
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
