/**
 * Debt Type Constants
 * Defines the two types of debts supported in the system
 */

export const DEBT_TYPES = {
    OWED_BY_ME: 'owed_by_me',    // חובות שאני חייב
    OWED_TO_ME: 'owed_to_me',    // חובות שחייבים לי
} as const

export const DEBT_TYPE_LABELS = {
    [DEBT_TYPES.OWED_BY_ME]: 'חוב שאני חייב',
    [DEBT_TYPES.OWED_TO_ME]: 'חוב שחייבים לי',
} as const

export const CREDITOR_LABELS = {
    [DEBT_TYPES.OWED_BY_ME]: 'נושה',
    [DEBT_TYPES.OWED_TO_ME]: 'חייב',
} as const

export type DebtType = typeof DEBT_TYPES[keyof typeof DEBT_TYPES]
