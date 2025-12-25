'use client'

import { UserButton } from '@clerk/nextjs'
import { useBudget } from '@/contexts/BudgetContext'
import { getMonthName } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FeedbackButton } from './FeedbackButton'

import Image from 'next/image'

const CURRENCIES = ['₪', '$', '€', '£']

export function DashboardHeader() {
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

                {/* Mobile Date Selector - Visible only on mobile */}
                <div className="flex md:hidden items-center gap-1 px-4">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                        <ChevronRight className="h-3 w-3" />
                    </Button>
                    <div className="text-center w-[100px]">
                        <h2 className="text-sm font-bold whitespace-nowrap">
                            {getMonthName(month)} {year}
                        </h2>
                    </div>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                        <ChevronLeft className="h-3 w-3" />
                    </Button>
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

                {/* Left Section - User Profile */}
                <div className="w-auto md:w-72 h-full flex items-center justify-end px-4 md:px-8">
                    <UserButton />
                </div>
            </div>
        </div>
    )
}
