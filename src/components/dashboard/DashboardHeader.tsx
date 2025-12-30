'use client'

import { UserButton } from '@clerk/nextjs'
import { useBudget } from '@/contexts/BudgetContext'
import { getMonthName } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { FeedbackButton } from './FeedbackButton'
import { ModeToggle } from '@/components/mode-toggle'

import Image from 'next/image'

const CURRENCIES = ['₪', '$', '€', '£']

interface DashboardHeaderProps {
    onMenuToggle?: () => void
    menuOpen?: boolean
    userPlan?: 'PERSONAL' | 'BUSINESS'
    hasPersonalAccess?: boolean
    hasBusinessAccess?: boolean
}

export function DashboardHeader({ onMenuToggle, menuOpen = false, userPlan = 'PERSONAL', hasPersonalAccess = true, hasBusinessAccess = false }: DashboardHeaderProps) {
    const { month, year, currency, budgetType, setMonth, setYear, setCurrency, setBudgetType } = useBudget()
    const router = useRouter()

    const handleToggle = (type: 'PERSONAL' | 'BUSINESS') => {
        // Check if user has access to the requested plan
        if (type === 'BUSINESS' && !hasBusinessAccess) {
            router.push('/subscribe?plan=BUSINESS')
            return
        }
        if (type === 'PERSONAL' && !hasPersonalAccess) {
            router.push('/subscribe?plan=PERSONAL')
            return
        }
        setBudgetType(type)
    }

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12)
            setYear(year - 1)
        } else {
            setMonth(month - 1)
        }
    }

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1)
            setYear(year + 1)
        } else {
            setMonth(month + 1)
        }
    }

    return (
        <div className="sticky top-4 z-[60] mx-4 mb-6">
            <div className="glass-panel w-full flex h-[72px] items-center px-6 justify-between gap-4 transition-all duration-300 hover:shadow-2xl hover:border-white/60">

                {/* Right Section - Date Navigation */}
                <div className="hidden md:flex items-center gap-4">
                    <div className="flex bg-gray-100/50 rounded-full p-1 border border-white/50 backdrop-blur-sm">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-white rounded-full">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="min-w-[140px] flex flex-col items-center justify-center px-2">
                            <span className="text-sm font-bold text-[#323338] leading-none">
                                {getMonthName(month)} {year}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">סקירה חודשית</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-white rounded-full">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Mobile Layout - Compressed */}
                <div className="flex md:hidden items-center justify-between w-full px-1">
                    {/* Menu Button */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            onClick={onMenuToggle}
                            className={`h-10 w-10 rounded-full flex-shrink-0 transition-all duration-300 border shadow-sm ${menuOpen
                                ? 'bg-white hover:bg-gray-100 text-black border-gray-200'
                                : 'bg-black hover:bg-gray-800 text-white border-transparent'
                                }`}
                        >
                            <Menu className={`h-5 w-5 ${menuOpen ? 'text-black' : 'text-white'}`} />
                        </Button>
                        <UserButton />
                    </div>

                    {/* Date Selector */}
                    <div className="flex items-center gap-1 bg-white/50 rounded-full p-1 border border-white/40 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-full">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="text-center min-w-[80px]" onClick={() => {
                            // Simple toggle for mobile if space is tight, or just render the full switcher below
                            const nextType = budgetType === 'PERSONAL' ? 'BUSINESS' : 'PERSONAL'
                            handleToggle(nextType)
                        }}>
                            <div className="flex flex-col items-center">
                                <h2 className="text-sm font-bold whitespace-nowrap text-[#323338] leading-none">
                                    {getMonthName(month)} {year}
                                </h2>
                                <span className={`text-[10px] font-bold ${budgetType === 'BUSINESS' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                    {budgetType === 'BUSINESS' ? 'עסקי' : 'פרטי'}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-full">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Center Section - Logo */}
                <div className="hidden md:flex flex-1 justify-center items-center opacity-80 hover:opacity-100 transition-opacity">
                    {/* Light Mode Logo */}
                    <Image
                        src="/K-LOGO.png"
                        alt="Keseflow"
                        width={120}
                        height={40}
                        className="h-8 w-auto object-contain drop-shadow-sm dark:hidden"
                        priority
                    />
                    {/* Dark Mode Logo */}
                    <Image
                        src="/K-LOGO2.png"
                        alt="Keseflow"
                        width={120}
                        height={40}
                        className="h-8 w-auto object-contain drop-shadow-sm hidden dark:block"
                        priority
                    />
                </div>

                {/* Left Section - Mode Switcher & Profile */}
                <div className="hidden md:flex items-center justify-end gap-4">
                    <ModeToggle />

                    <div className="flex bg-gray-100/50 p-1.5 rounded-full border border-white/50 shadow-inner dark:bg-slate-800/50 dark:border-slate-700/50">
                        <button
                            onClick={() => handleToggle('PERSONAL')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${budgetType === 'PERSONAL'
                                ? 'bg-white text-emerald-600 shadow-md transform scale-105 dark:bg-slate-700 dark:text-emerald-400'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            פרטי
                        </button>
                        <button
                            onClick={() => handleToggle('BUSINESS')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-300 ${budgetType === 'BUSINESS'
                                ? 'bg-white text-blue-600 shadow-md transform scale-105 dark:bg-slate-700 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-slate-700/50'
                                }`}
                        >
                            עסקי
                        </button>
                    </div>

                    <div className="pl-2 border-l border-gray-200 dark:border-gray-700">
                        <UserButton />
                    </div>
                </div>
            </div>
        </div>
    )
}
