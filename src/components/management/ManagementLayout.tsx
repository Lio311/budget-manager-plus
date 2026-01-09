'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    CheckSquare,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    Bell,
    FileText,
    Users,
    Calendar as CalendarIcon,
    MapPin,
    CreditCard,
    Megaphone // Added marketing icon
} from 'lucide-react'
import Image from 'next/image'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getManagementNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/actions/notifications'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'

// Monday.com style sidebar
export function ManagementLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchNotifications = async () => {
        const res = await getManagementNotifications()
        if (res.success && res.data) {
            setNotifications(res.data.notifications)
            setUnreadCount(res.data.unreadCount)
        }
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds for new notifications
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead()
        fetchNotifications()
    }

    const handleMarkRead = async (id: string, link?: string | null) => {
        await markNotificationAsRead(id)
        if (link) window.location.href = link
        else fetchNotifications()
    }

    // Example User
    const user = {
        name: 'Lior',
        role: 'Project Manager',
        initial: 'L'
    }

    const menuItems = [
        { icon: LayoutDashboard, label: 'מבט על', href: '/management', color: 'text-blue-500', activeBg: 'bg-blue-50' },
        { icon: CheckSquare, label: 'משימות', href: '/management/tasks', color: 'text-emerald-500', activeBg: 'bg-emerald-50' },
        { icon: Megaphone, label: 'שיווק', href: '/management/marketing', color: 'text-pink-500', activeBg: 'bg-pink-50' },
        { icon: CreditCard, label: 'הוצאות', href: '/management/expenses', color: 'text-yellow-500', activeBg: 'bg-yellow-50' },
        { icon: CalendarIcon, label: 'לוח שנה', href: '/management/calendar', color: 'text-orange-500', activeBg: 'bg-orange-50' },
        { icon: Users, label: 'צוות', href: '/management/team', color: 'text-purple-500', activeBg: 'bg-purple-50' },
        { icon: FileText, label: 'חוזה', href: '/management/agreement', color: 'text-gray-500', activeBg: 'bg-gray-50' },
        { icon: MapPin, label: 'מפה', href: '/management/map', color: 'text-cyan-500', activeBg: 'bg-cyan-50' },
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

                    {/* Center Section - Logo */}
                    <div className="hidden md:flex flex-1 justify-center items-center opacity-80 hover:opacity-100 transition-opacity">
                        <Image
                            src="/images/branding/K-LOGO.png"
                            alt="Kesefly"
                            width={120}
                            height={40}
                            className="h-8 w-auto object-contain drop-shadow-sm dark:hidden"
                            priority
                        />
                        <Image
                            src="/images/branding/K-LOGO2.png"
                            alt="Kesefly"
                            width={120}
                            height={40}
                            className="h-8 w-auto object-contain drop-shadow-sm hidden dark:block"
                            priority
                        />
                    </div>



                    <div className="flex items-center gap-4">
                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition outline-none">
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-96 p-0" align="end">
                                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                                    <h4 className="font-semibold text-gray-900">התראות</h4>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={handleMarkAllRead}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            סמן הכל כנקרא
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto">
                                    {notifications.length > 0 ? (
                                        <div className="flex flex-col">
                                            {notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleMarkRead(notif.id, notif.link)}
                                                    className={cn(
                                                        "p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer relative",
                                                        !notif.isRead && "bg-blue-50/30"
                                                    )}
                                                >
                                                    {!notif.isRead && (
                                                        <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full" />
                                                    )}
                                                    <div className="flex flex-col gap-1">
                                                        <div className="text-sm font-bold text-gray-900 pr-2">
                                                            {notif.title}
                                                        </div>
                                                        <div className="text-sm text-gray-600 pr-2">
                                                            {notif.message}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 mt-1 pr-2">
                                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: he })}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-8 text-center text-gray-500 text-sm">
                                            <Bell size={32} className="mx-auto mb-3 text-gray-300" />
                                            <p>אין התראות חדשות</p>
                                        </div>
                                    )}
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
