'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'

interface ComboboxInputProps {
    value?: string
    onChange: (value: string) => void
    options: string[]
    placeholder?: string
    className?: string
    emptyMessage?: string
}

export function ComboboxInput({
    value = '',
    onChange,
    options,
    placeholder = 'Search...',
    className,
    emptyMessage = 'לא נמצאו תוצאות'
}: ComboboxInputProps) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [inputValue, setInputValue] = useState(value)

    // Sync external value changes to input state
    useEffect(() => {
        setInputValue(value)
    }, [value])

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div className={cn("relative", className)} ref={containerRef} dir="rtl">
            <Command
                className="rounded-md border border-input shadow-sm overflow-visible bg-white dark:bg-slate-800 [&_[cmdk-input-wrapper]]:flex-row-reverse [&_[cmdk-input-wrapper]_svg]:ml-2 [&_[cmdk-input-wrapper]_svg]:mr-0"
                shouldFilter={true}
            >
                <CommandInput
                    placeholder={placeholder}
                    value={inputValue}
                    onValueChange={(val) => {
                        setInputValue(val)
                        onChange(val)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    className="text-right h-9"
                />
                {open && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-lg border bg-popover shadow-md outline-none animate-in fade-in-0 zoom-in-95 overflow-hidden">
                        <CommandList>
                            <CommandEmpty className="py-2 text-center text-sm text-muted-foreground">{emptyMessage}</CommandEmpty>
                            <CommandGroup className="max-h-[200px] overflow-auto">
                                {options.map((option) => (
                                    <CommandItem
                                        key={option}
                                        value={option}
                                        onSelect={(currentValue) => {
                                            onChange(currentValue)
                                            setInputValue(currentValue)
                                            setOpen(false)
                                        }}
                                        className="text-right cursor-pointer flex flex-row-reverse justify-between"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === option ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </div>
                )}
            </Command>
        </div>
    )
}
