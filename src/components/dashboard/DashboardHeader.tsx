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
        <div className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Month/Year Selector */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <div className="text-center min-w-[180px]">
                            <h2 className="text-2xl font-bold">
                                {getMonthName(month)} {year}
                            </h2>
                        </div>
                        <Button variant="outline" size="icon" onClick={handleNextMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Currency Selector */}
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1 bg-muted rounded-lg p-1">
                            {CURRENCIES.map((curr) => (
                                <button
                                    key={curr}
                                    onClick={() => setCurrency(curr)}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currency === curr
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'hover:bg-background'
                                        }`}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </div>
            </div>
        </div>
    )
}
