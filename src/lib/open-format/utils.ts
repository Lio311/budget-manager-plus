import { format } from 'date-fns'

/**
 * Format a string field for Open Format (Windows-1255).
 * - Right-pad with spaces.
 * - Ensure no illegal characters (tabs, newlines).
 * - Enforce maximum length.
 */
export function fmtStr(str: string | null | undefined, length: number): string {
    const s = (str || '').toString().trim().replace(/[\r\n\t]/g, ' ')
    // Slice to length then padEnd
    return s.slice(0, length).padEnd(length, ' ')
}

/**
 * Format a numeric field (Amount/Quantity).
 * - Left-pad with zeros.
 * - Implicit decimal point involved? 
 *   Spec 1.31 usually requires explicit decimal or integer representation depending on field.
 *   However, most definitions (e.g., "Amount") specify:
 *   "15 digits, includes 2 decimal digits" -> implies 1234567890123.45 or 000000000010000 (for 100.00)
 *   
 *   Clarification from Spec (Horaot Nihul Sfarim):
 *   Numeric fields are usually "Z" (Zero padded).
 *   If the spec says "Size 15 (2)", it usually means 12 digits, dot, 2 decimals? Or 15 continuous digits?
 *   
 *   Common convention for "Mivne Achid" text files:
 *   Fields are often defined as "N12.2" -> 999999999999.99 (Total 15 chars including dot).
 *   OR "N15" implicit.
 *   
 *   We will use: Absolute value, Max fixed digits, Leading Zeros.
 *   If the field allows decimals, we include the dot.
 */
export function fmtNum(num: number | null | undefined, length: number = 15): string {
    if (num === null || num === undefined) return '0'.padStart(length, '0')

    // Convert to fixed 2 decimals
    const n = Math.abs(num) // Sign is usually separate or implied positive in many records, but let's check.
    // Actually, many fields in Mivne Achid are signed. 
    // If signed, usually the sign is the first char or separate. 
    // For standard "Amounts", they are often absolute in detail records, with Action Type determining effect.

    // We will assume standard formatting: 1234.56
    const s = n.toFixed(2)

    // If the result is shorter than length, pad with zeros
    return s.padStart(length, '0')
}

/**
 * Format an Integer field (e.g. Line Number, Count).
 */
export function fmtInt(num: number | null | undefined, length: number): string {
    if (num === null || num === undefined) return '0'.padStart(length, '0')
    const s = Math.floor(Math.abs(num)).toString()
    return s.padStart(length, '0')
}

/**
 * Format Date: YYYYMMDD
 */
export function fmtDate(date: Date | null | undefined): string {
    if (!date) return '00000000'
    try {
        return format(date, 'yyyyMMdd')
    } catch (e) {
        return '00000000'
    }
}

/**
 * Format Time: HHMM
 */
export function fmtTime(date: Date | null | undefined): string {
    if (!date) return '0000'
    try {
        return format(date, 'HHmm')
    } catch (e) {
        return '0000'
    }
}
