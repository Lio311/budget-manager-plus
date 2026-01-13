'use client'

import React, { useState, useEffect } from 'react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PhoneInputWithCountryProps {
    value?: string
    onChange: (value: string) => void
    className?: string
    placeholder?: string
}

const COUNTRY_CODES = [
    { code: '972', label: 'Israel', flag: '🇮🇱' },
    { code: '1', label: 'USA/Canada', flag: '🇺🇸' },
    { code: '44', label: 'UK', flag: '🇬🇧' },
    { code: '33', label: 'France', flag: '🇫🇷' },
    { code: '49', label: 'Germany', flag: '🇩🇪' },
    { code: '39', label: 'Italy', flag: '🇮🇹' },
    { code: '34', label: 'Spain', flag: '🇪🇸' },
    { code: '7', label: 'Russia', flag: '🇷🇺' },
    { code: '86', label: 'China', flag: '🇨🇳' },
    { code: '81', label: 'Japan', flag: '🇯🇵' },
    // Add more as needed
]

export function PhoneInputWithCountry({ value = '', onChange, className, placeholder }: PhoneInputWithCountryProps) {
    const [countryCode, setCountryCode] = useState('972')
    const [localNumber, setLocalNumber] = useState('')

    // Parse initial value
    useEffect(() => {
        if (!value) {
            setLocalNumber('')
            return
        }

        // Try to match existing country code
        // We sort by length desc to match longer codes first (though most are 1-3 digits)
        const sortedCodes = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
        const found = sortedCodes.find(c => value.startsWith('+' + c.code)) || sortedCodes.find(c => value.startsWith(c.code))

        if (found) {
            setCountryCode(found.code)
            // Remove code from value
            const prefix = value.startsWith('+') ? '+' + found.code : found.code
            setLocalNumber(value.substring(prefix.length))
        } else {
            // Cannot detect, just set as local number (or default)
            setLocalNumber(value)
        }
    }, [value])

    const handleCountryChange = (code: string) => {
        setCountryCode(code)
        onChange(`+${code}${localNumber}`)
    }

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '') // Remove non-digits
        setLocalNumber(val)
        onChange(`+${countryCode}${val}`)
    }

    return (
        <div className={cn("flex items-center gap-2", className)} dir="ltr">
            <Select value={countryCode} onValueChange={handleCountryChange}>
                <SelectTrigger className="w-[100px] flex-shrink-0">
                    <SelectValue placeholder="Code" />
                </SelectTrigger>
                <SelectContent dir="ltr">
                    {COUNTRY_CODES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                            <span className="mr-2">{c.flag}</span>
                            <span>+{c.code}</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Input
                type="tel"
                value={localNumber}
                onChange={handleNumberChange}
                placeholder={placeholder || "050..."}
                className="flex-1 text-left direction-ltr"
                dir="ltr"
            />
        </div>
    )
}
