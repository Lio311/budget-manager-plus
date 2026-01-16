'use client'

import { useState, useRef, useEffect } from 'react'
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

interface Client {
    id: string
    name: string
}

interface SimpleClientSelectorProps {
    clients: Client[]
    selectedClientId: string
    onClientIdChange: (id: string) => void
    placeholder?: string
    error?: boolean
}

export function SimpleClientSelector({
    clients,
    selectedClientId,
    onClientIdChange,
    placeholder = "חפש לקוח...",
    error
}: SimpleClientSelectorProps) {
    const [open, setOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedClient = clients.find(c => c.id === selectedClientId)

    // Handle click outside to close the dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const [inputValue, setInputValue] = useState(selectedClient ? selectedClient.name : "")

    // Sync input value with selected client
    useEffect(() => {
        setInputValue(selectedClient ? selectedClient.name : "")
    }, [selectedClient])

    return (
        <div ref={containerRef} dir="rtl" className="relative">
            <Command
                className="rounded-lg border shadow-sm overflow-visible bg-white dark:bg-slate-800 [&_[cmdk-input-wrapper]]:flex-row-reverse [&_[cmdk-input-wrapper]_svg]:ml-2 [&_[cmdk-input-wrapper]_svg]:mr-0"
            >
                <CommandInput
                    placeholder={placeholder}
                    value={inputValue}
                    onValueChange={setInputValue}
                    onFocus={() => setOpen(true)}
                    className={cn(
                        "text-right h-10",
                        error && "border-red-500 ring-1 ring-red-500/20 rounded-md"
                    )}
                />
                {open && (
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-lg border bg-popover shadow-md outline-none animate-in fade-in-0 zoom-in-95 max-h-[300px] overflow-auto">
                        <CommandList>
                            <CommandEmpty>לא נמצאו לקוחות</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="NO_CLIENT"
                                    onSelect={() => {
                                        onClientIdChange('')
                                        setInputValue('')
                                        setOpen(false)
                                    }}
                                    className="text-right cursor-pointer flex flex-row-reverse justify-between"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            !selectedClientId ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    ללא לקוח מקושר
                                </CommandItem>
                                {clients.map((client) => (
                                    <CommandItem
                                        key={client.id}
                                        value={client.name}
                                        onSelect={() => {
                                            onClientIdChange(client.id)
                                            setInputValue(client.name)
                                            setOpen(false)
                                        }}
                                        className="text-right cursor-pointer flex flex-row-reverse justify-between"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {client.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </div>
                )}
            </Command>
            {error && <p className="text-red-500 text-xs text-right mt-1">שדה חובה</p>}
        </div>
    )
}
