"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { he } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <div className="rtl">
            <DayPicker
                locale={he}
                dir="rtl"
                showOutsideDays={showOutsideDays}
                fixedWeeks
                captionLayout="dropdown-buttons"
                fromYear={2020}
                toYear={new Date().getFullYear() + 1}
                className={cn("p-3", className)}
                classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center gap-2 mb-4",
                    caption_label: "hidden",
                    caption_dropdowns: "flex gap-2 items-center",
                    dropdown: "text-sm font-medium px-3 py-2 border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-right",
                    dropdown_month: "min-w-[140px]",
                    dropdown_year: "min-w-[100px]",
                    vhidden: "hidden",
                    nav: "hidden",
                    nav_button: "hidden",
                    nav_button_previous: "hidden",
                    nav_button_next: "hidden",
                    table: "w-full border-collapse",
                    head_row: "flex mb-1",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
                    row: "flex w-full mt-2",
                    cell: cn(
                        "h-9 w-9 text-center text-sm p-0 relative",
                        "[&:has([aria-selected].day-range-end)]:rounded-l-md",
                        "[&:has([aria-selected].day-outside)]:bg-accent/50",
                        "[&:has([aria-selected])]:bg-accent",
                        "first:[&:has([aria-selected])]:rounded-r-md",
                        "last:[&:has([aria-selected])]:rounded-l-md",
                        "focus-within:relative focus-within:z-20"
                    ),
                    day: cn(
                        buttonVariants({ variant: "ghost" }),
                        "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                    ),
                    day_range_end: "day-range-end",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground font-bold",
                    day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                    ...classNames,
                }}
                components={{
                    IconLeft: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
                    IconRight: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
                }}
                {...props}
            />
        </div>
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
