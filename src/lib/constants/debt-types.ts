/**
 * Debt Type Constants
 * Defines the two types of debts supported in the system
 */

export const DEBT_TYPES = {
    OWED_BY_ME: 'owed_by_me',    // הלוואות שאני חייב
    OWED_TO_ME: 'owed_to_me',    // הלוואות שחייבים לי
} as const

export const DEBT_TYPE_LABELS = {
    [DEBT_TYPES.OWED_BY_ME]: 'הלוואה שאני חייב',
    [DEBT_TYPES.OWED_TO_ME]: 'הלוואה שחייבים לי',
} as const

export const CREDITOR_LABELS = {
    [DEBT_TYPES.OWED_BY_ME]: 'מלווה',
    [DEBT_TYPES.OWED_TO_ME]: 'לווה',
} as const

export type DebtType = typeof DEBT_TYPES[keyof typeof DEBT_TYPES]
