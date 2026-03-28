"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    className?: string
    placeholder?: string
    fromDate?: Date
    toDate?: Date
    disableNavigation?: boolean
    modal?: boolean
}

export function DatePicker({ date, setDate, className, placeholder = "בחר תאריך", fromDate, toDate, disableNavigation = false, modal = true }: DatePickerProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen} modal={modal}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full flex flex-row-reverse items-center justify-start text-right font-normal h-10 px-3",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                    <span className="flex-1 text-right truncate">
                        {date ? format(date, "dd/MM/yyyy") : placeholder}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center" side="bottom" sideOffset={8}>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        setDate(d)
                        setOpen(false)
                    }}
                    fromDate={fromDate}
                    toDate={toDate}
                    disableNavigation={disableNavigation}
                />
            </PopoverContent>
        </Popover>
    )
}
