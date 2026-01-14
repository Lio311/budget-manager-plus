import { Input } from '@/components/ui/input'
import { formatNumberWithCommas, parseNumberFromFormatted } from '@/lib/utils'
import { forwardRef, useState, useEffect } from 'react'

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
    value: string | number
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onValueChange?: (value: number) => void
}

/**
 * Input component that automatically formats numbers with commas
 * Use this instead of regular Input for amount/number fields
 */
export const FormattedNumberInput = forwardRef<HTMLInputElement, FormattedNumberInputProps>(
    ({ value, onChange, onValueChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = useState('')

        // Update display value when prop value changes
        useEffect(() => {
            if (value === '' || value === null || value === undefined) {
                setDisplayValue('')
            } else {
                setDisplayValue(formatNumberWithCommas(Number(value)))
            }
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const input = e.target.value

            // Allow empty input
            if (input === '') {
                setDisplayValue('')
                // Create synthetic event with numeric value
                const syntheticEvent = {
                    ...e,
                    target: { ...e.target, value: '0' }
                }
                onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
                if (onValueChange) onValueChange(0)
                return
            }

            // Remove commas for processing
            const cleaned = input.replace(/,/g, '')

            // Only allow numbers and one decimal point
            if (!/^\d*\.?\d*$/.test(cleaned)) {
                return
            }

            // Update display with commas
            const formatted = formatNumberWithCommas(cleaned)
            setDisplayValue(formatted)

            // Pass the numeric value back
            const syntheticEvent = {
                ...e,
                target: { ...e.target, value: cleaned }
            }
            onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>)

            if (onValueChange) {
                const numericValue = parseNumberFromFormatted(cleaned)
                onValueChange(numericValue)
            }
        }

        return (
            <Input
                {...props}
                ref={ref}
                type="text"
                inputMode="decimal"
                value={displayValue}
                onChange={handleChange}
                className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-base ${props.className || ''}`}
            />
        )
    }
)

FormattedNumberInput.displayName = 'FormattedNumberInput'
