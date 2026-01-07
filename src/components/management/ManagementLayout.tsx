'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    CheckSquare,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    Bell,
    Users,
    Calendar as CalendarIcon,
    MapPin, // Added missing imports
    CreditCard // Added missing imports
} from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

// Monday.com style sidebar
export function ManagementLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    // Example User
    const user = {
        name: 'Lior',
        role: 'Project Manager',
        initial: 'L'
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'מבט על', href: '/management', color: 'text-blue-500', activeBg: 'bg-blue-50' },
        { icon: CheckSquare, label: 'משימות', href: '/management/tasks', color: 'text-emerald-500', activeBg: 'bg-emerald-50' },
        { icon: Users, label: 'צוות', href: '/management/team', color: 'text-purple-500', activeBg: 'bg-purple-50' },
        { icon: CalendarIcon, label: 'לוח שנה', href: '/management/calendar', color: 'text-orange-500', activeBg: 'bg-orange-50' },
        { icon: BarChart3, label: 'דוחות', href: '/management/reports', color: 'text-rose-500', activeBg: 'bg-rose-50' },
        { icon: MapPin, label: 'מפה', href: '/management/map', color: 'text-cyan-500', activeBg: 'bg-cyan-50' },
        { icon: CreditCard, label: 'הוצאות', href: '/management/expenses', color: 'text-yellow-500', activeBg: 'bg-yellow-50' },
    ]

    return (
        <div className="flex h-screen bg-[#F5F6F8] direction-rtl" dir="rtl">
            {/* Sidebar */}
            <motion.div
                initial={false}
                animate={{ width: collapsed ? 64 : 240 }}
                className="bg-[#2B3440] text-white flex flex-col items-center py-4 relative z-20 shadow-xl transition-all duration-300 ease-in-out"
            >
                {/* Collapse Button */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute top-6 -left-3 bg-white text-gray-600 rounded-full p-1 shadow-md hover:bg-gray-50 transition"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                <div className="mt-8" />


                {/* Menu Items */}
                <div className="flex-1 w-full px-2 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${isActive
                                    ? `${item.activeBg} ${item.color} font-bold shadow-sm`
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                title={collapsed ? item.label : undefined}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className={`absolute left-0 top-0 bottom-0 w-1 ${item.color.replace('text-', 'bg-')}`}
                                    />
                                )}
                                <item.icon size={20} className={`transition-transform group-hover:scale-110 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100'} ${item.color}`} />
                                {!collapsed && (
                                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Bottom Actions */}
                <div className="w-full px-2 mt-auto space-y-2">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#3E4957]/50 transition-all"
                    >
                        <LogOut size={20} />
                        {!collapsed && <span className="text-sm">חזרה לאפליקציה</span>}
                    </Link>
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-gray-800">
                            {menuItems.find(i => i.href === pathname)?.label || 'ניהול'}
                        </h1>
                    </div>



                    <div className="flex items-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition outline-none">
                                    <Bell size={20} />
                                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="end">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                    <h4 className="font-semibold text-gray-900">התראות</h4>
                                </div>
                                <div className="p-8 text-center text-gray-500 text-sm">
                                    <Bell size={32} className="mx-auto mb-3 text-gray-300" />
                                    <p>אין התראות חדשות</p>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </header>

                {/* Page Content Scrollable */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#F5F6F8]">
                    {children}
                </main>
            </div>
        </div>
    )
}
