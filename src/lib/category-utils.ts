import { Category } from '@prisma/client'

export const findMatchingCategory = (inputCat: string | null, categories: { name: string }[]): string => {
    if (!inputCat) return ''

    // 1. Direct Match
    const directMatch = categories.find(c => c.name === inputCat)
    if (directMatch) return directMatch.name

    const normalizedInput = inputCat.toLowerCase().trim()

    // 2. Common Mappings
    const MAPPINGS: Record<string, string[]> = {
        'מזון': ['food', 'groceries', 'supermarket', 'אוכל', 'סופר', 'קניות לבית'],
        'דלק': ['fuel', 'gas', 'petrol', 'תחנת דלק'],
        'מסעדות': ['restaurants', 'dining', 'eating out', 'מסעדה', 'בחוץ', 'פיצה', 'המבורגר'],
        'תחבורה': ['transport', 'transportation', 'bus', 'train', 'taxi', 'uber', 'מונית', 'אוטובוס', 'רכבת', 'חניה', 'parking'],
        'בילויים': ['entertainment', 'movies', 'fun', 'party', 'cinema', 'סרט', 'בילוי', 'יציאה'],
        'קניות': ['shopping', 'clothes', 'clothing', 'store', 'בגדים', 'שופינג'],
        'בית': ['home', 'house', 'rent', 'utilities', 'חשמל', 'ארנונה', 'מים', 'שכירות'],
        'פנאי': ['leisure', 'vacation', 'trip', 'hotel', 'חופשה', 'מלון'],
    }

    // Check aliases
    for (const [actualName, aliases] of Object.entries(MAPPINGS)) {
        if (aliases.some(alias => normalizedInput.includes(alias))) {
            const exists = categories.find(c => c.name === actualName)
            if (exists) return exists.name
        }
    }

    // 3. Partial Match
    const partialMatch = categories.find(c => c.name.toLowerCase().includes(normalizedInput))
    if (partialMatch) return partialMatch.name

    // 4. Fallback (Return original input for manual category creation or generic bucket)
    return inputCat
}
