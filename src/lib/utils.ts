import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "ILS"): string {
    const symbolToCode: Record<string, string> = {
        '₪': 'ILS',
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP'
    }
    const code = symbolToCode[currency] || currency

    try {
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: 2,
        }).format(amount)
    } catch (e) {
        // Fallback for invalid currency codes
        return new Intl.NumberFormat('he-IL', {
            style: 'currency',
            currency: 'ILS',
            minimumFractionDigits: 2,
        }).format(amount)
    }
}

export function getMonthName(month: number): string {
    const months = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ]
    return months[month - 1] || ''
}

export function getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate()
}

/**
 * Format a number with commas for thousands separator
 * @param value - Number or string to format
 * @returns Formatted string with commas (e.g., "1,000" or "1,000,000")
 */
export function formatNumberWithCommas(value: number | string): string {
    if (value === '' || value === null || value === undefined) return ''

    // Remove existing commas and convert to string
    const numStr = String(value).replace(/,/g, '')

    // Check if it's a valid number
    if (isNaN(Number(numStr))) return String(value)

    // Split into integer and decimal parts
    const parts = numStr.split('.')
    const integerPart = parts[0]
    const decimalPart = parts[1]

    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

    // Combine with decimal part if exists
    return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger
}

/**
 * Parse a formatted number string back to a number
 * @param value - Formatted string with commas
 * @returns Number without commas
 */
export function parseNumberFromFormatted(value: string): number {
    if (!value) return 0
    const cleaned = String(value).replace(/,/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
}

