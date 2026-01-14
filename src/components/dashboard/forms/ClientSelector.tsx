'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, User, UserPlus } from 'lucide-react'
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
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

    const selectedClient = clients.find(c => c.id === selectedClientId)

    return (
        <div className="space-y-3">
            {/* Mode Toggle */}
            <div className="flex gap-4 text-sm">
                <button
                    type="button"
                    onClick={() => !isGuestMode && onGuestModeToggle()}
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
                    onClick={() => isGuestMode && onGuestModeToggle()}
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
                <div dir="rtl">
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={open}
                                className={cn(
                                    "w-full justify-between text-right bg-white dark:bg-slate-800",
                                    error && "!border-red-500 dark:!border-red-500 ring-1 ring-red-500/20"
                                )}
                            >
                                {selectedClient ? selectedClient.name : "בחר לקוח..."}
                                <ChevronsUpDown className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                            <Command dir="rtl">
                                <CommandInput placeholder="חפש לקוח..." className="text-right" />
                                <CommandList>
                                    <CommandEmpty>לא נמצאו לקוחות</CommandEmpty>
                                    <CommandGroup>
                                        {clients.map((client) => (
                                            <CommandItem
                                                key={client.id}
                                                value={client.name}
                                                onSelect={() => {
                                                    onClientIdChange(client.id)
                                                    setOpen(false)
                                                }}
                                                className="text-right cursor-pointer"
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
                            </Command>
                        </PopoverContent>
                    </Popover>
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
