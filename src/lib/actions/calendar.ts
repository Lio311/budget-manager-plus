'use server'

import { authenticatedPrisma } from '@/lib/db'
import { getGoogleCalendarClient } from '@/lib/google'
import { auth } from '@clerk/nextjs/server'
import { getCurrentBudget } from './budget'
import { convertToILS } from '@/lib/currency'

// ... (rest of imports remains same, just replacing function body)

export async function syncBudgetToGoogleCalendar(month: number, year: number, type: 'PERSONAL' | 'BUSINESS' = 'PERSONAL') {
    try {
        const { userId } = await auth()
        if (!userId) return { success: false, error: 'Unauthorized' }

        const db = await authenticatedPrisma(userId)

        // 1. Check if sync enabled
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { isCalendarSyncEnabled: true, googleCalendarId: true }
        })

        if (!user?.isCalendarSyncEnabled) {
            return { success: false, error: 'Calendar sync is not enabled' }
        }

        const calendar = await getGoogleCalendarClient(userId)
        if (!calendar) {
            return { success: false, error: 'Google Calendar connection expired. Please reconnect.' }
        }

        // 2. Fetch Budget Data & All Items
        const budget = await getCurrentBudget(month, year, '₪', type)
        if (!budget) return { success: false, error: 'No budget found' }

        const bills = await db.bill.findMany({ 
            where: { budgetId: budget.id },
            select: { id: true, name: true, amount: true, currency: true, dueDate: true, isPaid: true }
        })
        const debts = await db.debt.findMany({ 
            where: { budgetId: budget.id },
            select: { id: true, creditor: true, monthlyPayment: true, totalAmount: true, currency: true, dueDay: true }
        })
        const incomes = await db.income.findMany({ 
            where: { budgetId: budget.id },
            select: { id: true, source: true, amount: true, currency: true, date: true }
        })
        const expenses = await db.expense.findMany({ 
            where: { budgetId: budget.id },
            select: { id: true, description: true, amount: true, currency: true, date: true, category: true }
        })

        // 3. Prepare Events List
        const events = []
        const calendarId = user.googleCalendarId || 'primary'
        const appTag = `Budget Manager - ${type}`
        const appSignature = `[Budget Manager - ${type}]`

        // Bills (Due Date) -> Red (11)
        if (bills) {
            for (const bill of bills) {
                if (bill.dueDate) {
                    events.push({
                        summary: `🛒 חוב/הוצאה: ${bill.name}`,
                        description: `${appSignature}\nסכום: ${bill.amount} ${bill.currency}\nסטטוס: ${bill.isPaid ? 'שולם' : 'לא שולם'}`,
                        start: { date: new Date(bill.dueDate).toISOString().split('T')[0] },
                        end: { date: new Date(bill.dueDate).toISOString().split('T')[0] },
                        colorId: '11'
                    })
                }
            }
        }

        // Debts (Due Day) -> Blueberry (9)
        if (debts) {
            for (const debt of debts) {
                const safeDay = Math.min(debt.dueDay, new Date(year, month, 0).getDate())
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`

                events.push({
                    summary: `💳 הלוואה: ${debt.creditor}`,
                    description: `${appSignature}\nסכום: ${debt.monthlyPayment} ${debt.currency}\nיתרה: ${debt.totalAmount}`,
                    start: { date: dateStr },
                    end: { date: dateStr },
                    colorId: '9'
                })
            }
        }

        // Incomes (Date) -> Green (10)
        if (incomes) {
            for (const income of incomes) {
                if (income.date) {
                    events.push({
                        summary: `💰 הכנסה: ${income.source}`,
                        description: `${appSignature}\nסכום: ${income.amount} ${income.currency}`,
                        start: { date: new Date(income.date).toISOString().split('T')[0] },
                        end: { date: new Date(income.date).toISOString().split('T')[0] },
                        colorId: '10'
                    })
                }
            }
        }

        // Expenses (Date) -> Red (11)
        if (expenses) {
            for (const expense of expenses) {
                if (expense.date) {
                    events.push({
                        summary: `💸 הוצאה: ${expense.description}`,
                        description: `${appSignature}\nסכום: ${expense.amount} ${expense.currency}\nקטגוריה: ${expense.category}`,
                        start: { date: new Date(expense.date).toISOString().split('T')[0] },
                        end: { date: new Date(expense.date).toISOString().split('T')[0] },
                        colorId: '11'
                    })
                }
            }
        }

        // 4. Delete Old Events (Fix Duplication Bug - Scoped by Type)
        const startDate = new Date(year, month - 1, 1).toISOString()
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

        const existingEvents = await calendar.events.list({
            calendarId,
            timeMin: startDate,
            timeMax: endDate,
            singleEvents: true,
            maxResults: 250 // Fetch enough to cover
        })

        if (existingEvents.data.items) {
            // Client-side filter: Match specific type signature
            const eventsToDelete = existingEvents.data.items.filter(evt =>
                // Check private prop OR description tag as fallback
                evt.extendedProperties?.private?.appTag === appTag ||
                evt.description?.includes(appSignature) ||
                // Backward compatibility: if it was generic 'Budget Manager', treat as PERSONAL or clean up?
                // Let's assume generic legacy items are PERSONAL.
                (type === 'PERSONAL' && evt.description?.includes('[Budget Manager]'))
            )

            // Delete in parallel but catch errors individually
            await Promise.all(eventsToDelete.map(async (evt) => {
                try {
                    await calendar.events.delete({ calendarId, eventId: evt.id! })
                } catch (err: any) {
                    console.warn(`Failed to delete event ${evt.id}:`, err.message)
                    // Ignore 404/410 (already deleted)
                }
            }))
        }

        // 5. Insert New Events


        // 5. Insert New Events (Parallel Batches)
        const batchSize = 10
        let successCount = 0
        let failCount = 0
        const errors: string[] = []

        // Process in chunks to avoid hitting rate limits too hard but still be fast
        for (let i = 0; i < events.length; i += batchSize) {
            const chunk = events.slice(i, i + batchSize)
            await Promise.all(chunk.map(async (evt) => {
                try {
                    await calendar.events.insert({
                        calendarId,
                        requestBody: {
                            ...evt,
                            extendedProperties: {
                                private: {
                                    app: 'Budget Manager',
                                    appTag: appTag,
                                    type: 'auto-sync'
                                }
                            }
                        }
                    })
                    successCount++
                } catch (err: any) {
                    console.error('Failed to insert event:', evt.summary, err.message)
                    failCount++
                    errors.push(err.message)
                }
            }))
        }

        if (successCount === 0 && failCount > 0) {
            return { success: false, error: `נכשל בסנכרון כל האירועים (${errors[0]})` }
        }

        return { success: true, count: successCount }

    } catch (error: any) {
        console.error('Sync Error:', error)
        return { success: false, error: error.message || 'Failed to sync calendar' }
    }
}
