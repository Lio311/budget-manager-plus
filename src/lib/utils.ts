import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = '₪'): string {
  return `${currency}${amount.toLocaleString('he-IL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatNumberWithCommas(num: number): string {
  return num.toLocaleString('he-IL')
}

export function parseNumberFromFormatted(formatted: string): number {
  return parseFloat(formatted.replace(/,/g, '')) || 0
}

export function getMonthName(month: number): string {
  const monthNames = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ]
  return monthNames[month - 1] || ''
}

export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export function formatIsraeliPhoneNumber(phone: string | undefined | null): string {
  if (!phone) return ''

  // Remove non-digits to analyze
  const clean = phone.replace(/\D/g, '')

  // Case 1: Already has country code (starts with 972)
  if (clean.startsWith('972')) {
    // 972521234567 -> +972 52-123-4567
    if (clean.length === 12) { // 972 + 9 digits
      return `+${clean.substring(0, 3)} ${clean.substring(3, 5)}-${clean.substring(5, 8)}-${clean.substring(8)}`
    }
    return `+${clean}`
  }

  // Case 2: Standard Israeli Mobile (starts with 05) - 10 digits
  if (clean.startsWith('05') && clean.length === 10) {
    // 0521234567 -> +972 52-123-4567
    return `+972 ${clean.substring(1, 3)}-${clean.substring(3, 6)}-${clean.substring(6)}`
  }

  // Case 3: Mobile without leading 0 (starts with 5) - 9 digits (common excel import issue)
  if (clean.startsWith('5') && clean.length === 9) {
    // 521234567 -> +972 52-123-4567
    return `+972 ${clean.substring(0, 2)}-${clean.substring(2, 5)}-${clean.substring(5)}`
  }

  // Case 4: Landline (starts with 02, 03, 04, 08, 09) - 9 digits
  if (/^0[23489]/.test(clean) && clean.length === 9) {
    // 031234567 -> +972 3-123-4567
    return `+972 ${clean.substring(1, 2)}-${clean.substring(2, 5)}-${clean.substring(5)}`
  }

  // Case 5: Landline without leading 0 (starts with 2,3,4,8,9) - 8 digits
  if (/^[23489]/.test(clean) && clean.length === 8) {
    // 31234567 -> +972 3-123-4567
    return `+972 ${clean.substring(0, 1)}-${clean.substring(1, 4)}-${clean.substring(4)}`
  }

  // Fallback: If starts with +, return as is
  if (phone.trim().startsWith('+')) return phone

  return phone
}
