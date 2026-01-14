'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronsUpDown, User, UserPlus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'

interface Client {
    id: string
    name: string
}

interface ClientSelectorProps {
    clients: Client[]
    selectedClientId: string
    guestClientName: string
    isGuestMode: boolean
    onClientIdChange: (id: string) => void
    onGuestModeToggle: () => void
    onGuestNameChange: (name: string) => void
    error?: boolean
}

export function ClientSelector({
    clients,
    selectedClientId,
    guestClientName,
    isGuestMode,
    onClientIdChange,
    onGuestModeToggle,
    onGuestNameChange,
    error
}: ClientSelectorProps) {
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

    // Allow typing
    useEffect(() => {
        setInputValue(selectedClient ? selectedClient.name : "")
    }, [selectedClient])

    return (
        <div className="space-y-3" ref={containerRef}>
            {/* ... preserved buttons ... */}
            <div className="flex gap-4 text-sm">
                <button
                    type="button"
                    onClick={() => isGuestMode && onGuestModeToggle()}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors",
                        !isGuestMode
                            ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
                    )}
                >
                    <User className="h-4 w-4" />
                    לקוח קיים
                </button>
                <button
                    type="button"
                    onClick={() => !isGuestMode && onGuestModeToggle()}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors",
                        isGuestMode
                            ? "bg-green-100 text-green-700 font-medium dark:bg-green-900/30 dark:text-green-300"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800"
                    )}
                >
                    <UserPlus className="h-4 w-4" />
                    לקוח אורח
                </button>
            </div>

            {/* Client Selection */}
            {!isGuestMode ? (
                <div dir="rtl" className="relative">
                    <Command
                        className="rounded-lg border shadow-sm overflow-visible bg-white dark:bg-slate-800 [&_[cmdk-input-wrapper]]:flex-row-reverse [&_[cmdk-input-wrapper]_svg]:ml-2 [&_[cmdk-input-wrapper]_svg]:mr-0"
                    >
                        <CommandInput
                            placeholder="חפש לקוח..."
                            value={inputValue}
                            onValueChange={setInputValue}
                            onFocus={() => setOpen(true)}
                            className={cn(
                                "text-right",
                                error && "border-red-500 ring-1 ring-red-500/20 rounded-md"
                            )}
                        />
                        {open && (
                            <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 rounded-lg border bg-popover shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                                <CommandList>
                                    <CommandEmpty>לא נמצאו לקוחות</CommandEmpty>
                                    <CommandGroup>
                                        {clients.map((client) => (
                                            <CommandItem
                                                key={client.id}
                                                value={client.name}
                                                onSelect={() => {
                                                    onClientIdChange(client.id)
                                                    setInputValue(client.name) // Sync immediately
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
            ) : (
                <div>
                    <Input
                        type="text"
                        placeholder="שם הלקוח המלא"
                        value={guestClientName}
                        onChange={(e) => onGuestNameChange(e.target.value)}
                        className={cn(
                            "text-right bg-white dark:bg-slate-800",
                            error && "!border-red-500 dark:!border-red-500 ring-1 ring-red-500/20"
                        )}
                    />
                    {error && <p className="text-red-500 text-xs text-right mt-1">שדה חובה</p>}
                </div>
            )}
        </div>
    )
}
