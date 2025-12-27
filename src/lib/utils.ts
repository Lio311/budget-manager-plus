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
