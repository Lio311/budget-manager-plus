'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, Mail, Phone, Shield, User, Plus, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner' // Assuming sonner is available (used in NewTaskDialog)

// Mock Data - In real app, fetch from `clerk` or `prisma.user`
const INITIAL_TEAM = [
    { id: 1, name: 'Lior', role: 'Full Stack Developer', email: 'lior31197@gmail.com', avatar: '/images/team/lior-profile.jpg', department: 'Development', color: 'bg-blue-500' },
    { id: 2, name: 'Ron', role: 'QA & Marketing', email: 'ron.kor97@gmail.com', avatar: '/images/team/ron.png', department: 'Marketing & QA', color: 'bg-orange-500' },
    { id: 3, name: 'Leon', role: 'Security Engineer', email: 'leonpiattij@gmail.com', avatar: '/images/team/leon.png', department: 'Security', color: 'bg-red-500' },
]

export default function TeamPage() {
    const [members, setMembers] = useState(INITIAL_TEAM)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        email: '',
        department: 'Development'
    })

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault()

        let color = 'bg-gray-500'
        if (formData.department === 'Development') color = 'bg-blue-500'
        if (formData.department === 'Marketing & QA') color = 'bg-orange-500'
        if (formData.department === 'Security') color = 'bg-red-500'
        if (formData.department === 'Sales') color = 'bg-green-500'

        const newMember = {
            id: members.length + 1,
            ...formData,
            avatar: formData.name.charAt(0).toUpperCase(),
            color
        }

        setMembers([...members, newMember])
        toast.success('חבר צוות נוסף בהצלחה')
        setIsDialogOpen(false)
        setFormData({ name: '', role: '', email: '', department: 'Development' })
    }

    const handleDeleteMember = (id: number) => {
        setMembers(members.filter(m => m.id !== id))
        toast.success('העובד הוסר בהצלחה')
    }

    return (
        <div className="space-y-8 animate-fade-in" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">ניהול צוות</h2>
                    <p className="text-gray-500">חברי הצוות וההרשאות שלהם</p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                            <Plus size={18} />
                            הוסף עובד
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]" dir="rtl">
                        <DialogHeader className="text-right">
                            <DialogTitle>הוספת עובד חדש</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddMember} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label className="text-right block">שם מלא</Label>
                                <Input
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="שם העובד..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-right block">תפקיד</Label>
                                <Input
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    placeholder="מפתח, משווק, וכו'..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-right block">אימייל</Label>
                                <Input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-right block">מחלקה</Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(val) => setFormData({ ...formData, department: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl">
                                        <SelectItem value="Development">פיתוח</SelectItem>
                                        <SelectItem value="Marketing & QA">שיווק ובדיקות</SelectItem>
                                        <SelectItem value="Security">אבטחה</SelectItem>
                                        <SelectItem value="Sales">מכירות</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 w-full">
                                    הוסף לצוות
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member, index) => (
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

                            <button
                                onClick={() => handleDeleteMember(member.id)}
                                className="absolute top-4 left-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                                title="מחק עובד"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 border-4 border-white shadow-md ${member.color} overflow-hidden`}>
                                {member.avatar.length > 2 && member.avatar.startsWith('/') ? (
                                    <img
                                        src={member.avatar}
                                        alt={member.name}
                                        className={`w-full h-full object-cover ${member.name === 'Lior' ? 'object-top' : ''}`}
                                    />
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
