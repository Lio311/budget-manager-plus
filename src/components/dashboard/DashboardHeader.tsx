'use client'

import { UserButton } from '@clerk/nextjs'
import { useBudget } from '@/contexts/BudgetContext'
import { getMonthName } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-30">
            <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
                <div className="flex items-center justify-between gap-2">
                    {/* Month/Year Selector */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8 sm:h-10 sm:w-10">
                            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <div className="text-center min-w-[120px] sm:min-w-[180px]">
                            <h2 className="text-base sm:text-2xl font-bold whitespace-nowrap">
                                {getMonthName(month)} {year}
                            </h2>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 sm:h-10 sm:w-10">
                            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                    </div>

                    {/* User Button */}
                    <div className="flex items-center">
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>
        </div>
    )
}
