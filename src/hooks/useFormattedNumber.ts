import { useState, useCallback } from 'react'
import { formatNumberWithCommas, parseNumberFromFormatted } from '@/lib/utils'

/**
 * Custom hook for handling formatted number inputs
 * Automatically adds commas to numbers as user types
 */
export function useFormattedNumber(initialValue: number = 0) {
    const [displayValue, setDisplayValue] = useState(formatNumberWithCommas(initialValue))
    const [numericValue, setNumericValue] = useState(initialValue)

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value

        // Allow empty input
        if (input === '') {
            setDisplayValue('')
            setNumericValue(0)
            return
        }

        // Remove commas for processing
        const cleaned = input.replace(/,/g, '')

        // Only allow numbers and one decimal point
        if (!/^\d*\.?\d*$/.test(cleaned)) {
            return
        }

        // Update display with commas
        const parts = cleaned.split('.')
        parts[0] = formatNumberWithCommas(parts[0] === '' ? 0 : Number(parts[0]))
        if (cleaned.startsWith('.')) parts[0] = '0'
        const formatted = parts.join('.')
        setDisplayValue(formatted)

        // Update numeric value
        const parsed = parseNumberFromFormatted(cleaned)
        setNumericValue(parsed)
    }, [])

    const setValue = useCallback((value: number) => {
        setNumericValue(value)
        setDisplayValue(formatNumberWithCommas(value))
    }, [])

    return {
        displayValue,
        numericValue,
        handleChange,
        setValue
    }
}
