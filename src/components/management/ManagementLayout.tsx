'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    CheckSquare,
    BarChart3,
    Map as MapIcon,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    Bell,
    Users,
    Calendar as CalendarIcon
} from 'lucide-react'

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
        { label: 'דשבורד ראשי', icon: LayoutDashboard, href: '/management' },
        { label: 'לוח משימות', icon: CheckSquare, href: '/management/tasks' },
        { label: 'לוח שנה', icon: CalendarIcon, href: '/management/calendar' },
        { label: 'צוות', icon: Users, href: '/management/team' },
        { label: 'מפת משתמשים', icon: MapIcon, href: '/management/map' },
        { label: 'דוחות', icon: BarChart3, href: '/management/reports' },
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

                {/* Logo Area */}
                <div className="mb-8 px-4 w-full flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center shrink-0">
                        <span className="font-bold text-white">M</span>
                    </div>
                    {!collapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="font-bold text-lg whitespace-nowrap"
                        >
                            Manager
                        </motion.span>
                    )}
                </div>

                {/* Menu Items */}
                <div className="flex-1 w-full px-2 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                                    ${isActive ? 'bg-[#3E4957] text-white' : 'text-gray-400 hover:bg-[#3E4957]/50 hover:text-gray-100'}
                                    ${collapsed ? 'justify-center' : ''}
                                `}
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon size={20} />
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
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="חיפוש..."
                                className="pr-9 pl-4 py-1.5 bg-gray-100 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 w-64 transition-all"
                            />
                        </div>
                        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:shadow-lg transition">
                            {user.initial}
                        </div>
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
