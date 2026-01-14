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
