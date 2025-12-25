'use client'

import { UserButton } from '@clerk/nextjs'
import { useBudget } from '@/contexts/BudgetContext'
import { getMonthName } from '@/lib/utils'
import { ChevronLeft, ChevronRight, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeedbackButton } from './FeedbackButton'

import Image from 'next/image'

const CURRENCIES = ['₪', '$', '€', '£']

interface DashboardHeaderProps {
    onMenuToggle?: () => void
    menuOpen?: boolean
}

export function DashboardHeader({ onMenuToggle, menuOpen = false }: DashboardHeaderProps = {}) {
    const { month, year, currency, setMonth, setYear, setCurrency } = useBudget()

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
        <div className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-[60]">
            <div className="w-full flex h-[65px] items-center">

                {/* Right Section - Aligned with Sidebar */}
                <div className="w-72 h-full hidden md:flex items-center justify-center border-l border-gray-200 bg-[#f9f9fa]/50">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 hover:bg-white/50">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="text-center min-w-[120px]">
                            <h2 className="text-lg font-bold whitespace-nowrap text-[#323338]">
                                {getMonthName(month)} {year}
                            </h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8 hover:bg-white/50">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Mobile Layout - Compressed */}
                <div className="flex md:hidden items-center justify-between w-full px-2">
                    {/* Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onMenuToggle}
                        className={`h-9 w-9 rounded-full flex-shrink-0 transition-colors ${menuOpen
                                ? 'bg-white hover:bg-gray-100 text-black'
                                : 'bg-black hover:bg-gray-800 text-white'
                            }`}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    {/* Date Selector */}
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7">
                            <ChevronRight className="h-3 w-3" />
                        </Button>
                        <div className="text-center min-w-[85px]">
                            <h2 className="text-xs font-bold whitespace-nowrap">
                                {getMonthName(month)} {year}
                            </h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7">
                            <ChevronLeft className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* User Button */}
                    <div className="flex-shrink-0">
                        <UserButton />
                    </div>
                </div>

                {/* Center Section - Logo */}
                <div className="flex-1 flex justify-center items-center">
                    <Image
                        src="/K-LOGO.png"
                        alt="Keseflow"
                        width={120}
                        height={40}
                        className="h-8 w-auto object-contain"
                        priority
                    />
                </div>

                {/* Left Section - User Profile (Desktop only) */}
                <div className="hidden md:flex w-72 h-full items-center justify-end px-8">
                    <UserButton />
                </div>
            </div>
        </div>
    )
}
