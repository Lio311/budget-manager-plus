'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const HEBREW_MONTHS = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

interface MonthYearPickerProps {
    currentMonth: number
    currentYear: number
    onSelect: (month: number, year: number) => void
    children: React.ReactNode
}

export function MonthYearPicker({ currentMonth, currentYear, onSelect, children }: MonthYearPickerProps) {
    const [open, setOpen] = useState(false)
    const [selectedYear, setSelectedYear] = useState(currentYear)

    const startYear = 2020
    const endYear = 2030
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)

    const handleMonthSelect = (monthIndex: number) => {
        onSelect(monthIndex, selectedYear)
        setOpen(false)
    }

    const handleYearChange = (direction: 'prev' | 'next') => {
        if (direction === 'prev' && selectedYear > startYear) {
            setSelectedYear(selectedYear - 1)
        } else if (direction === 'next' && selectedYear < endYear) {
            setSelectedYear(selectedYear + 1)
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700" align="center">
                {/* Year Selector */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-slate-700">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleYearChange('prev')}
                        disabled={selectedYear <= startYear}
                        className="h-8 w-8 dark:hover:bg-slate-800"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {selectedYear}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleYearChange('next')}
                        disabled={selectedYear >= endYear}
                        className="h-8 w-8 dark:hover:bg-slate-800"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>

                {/* Month Grid */}
                <div className="grid grid-cols-3 gap-2">
                    {HEBREW_MONTHS.map((month, index) => {
                        const isSelected = index === currentMonth && selectedYear === currentYear
                        return (
                            <Button
                                key={index}
                                variant={isSelected ? "default" : "outline"}
                                onClick={() => handleMonthSelect(index)}
                                className={`h-10 text-sm font-medium transition-all ${isSelected
                                        ? 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700'
                                        : 'bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-600'
                                    }`}
                            >
                                {month}
                            </Button>
                        )
                    })}
                </div>
            </PopoverContent>
        </Popover>
    )
}
