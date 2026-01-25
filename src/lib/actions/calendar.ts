'use server'

import { authenticatedPrisma } from '@/lib/db'
import { getGoogleCalendarClient } from '@/lib/google'
import { auth } from '@clerk/nextjs/server'
import { getCurrentBudget } from './budget'
import { convertToILS } from '@/lib/currency'

// ... (rest of imports remains same, just replacing function body)

export async function syncBudgetToGoogleCalendar(month: number, year: number) {
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
        const budget = await getCurrentBudget(month, year, '₪', 'PERSONAL')
        if (!budget) return { success: false, error: 'No budget found' }

        const bills = await db.bill.findMany({ where: { budgetId: budget.id } })
        const debts = await db.debt.findMany({ where: { budgetId: budget.id } })
        const incomes = await db.income.findMany({ where: { budgetId: budget.id } })
        const expenses = await db.expense.findMany({ where: { budgetId: budget.id } })

        // 3. Prepare Events List
        const events = []
        const calendarId = user.googleCalendarId || 'primary'

        // Bills (Due Date) -> Red (11)
        if (bills) {
            for (const bill of bills) {
                if (bill.dueDate) {
                    events.push({
                        summary: `🛒 חוב/הוצאה: ${bill.name}`,
                        description: `[Budget Manager]\nסכום: ${bill.amount} ${bill.currency}\nסטטוס: ${bill.isPaid ? 'שולם' : 'לא שולם'}`,
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
                    description: `[Budget Manager]\nסכום: ${debt.monthlyPayment} ${debt.currency}\nיתרה: ${debt.totalAmount}`,
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
                        description: `[Budget Manager]\nסכום: ${income.amount} ${income.currency}`,
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
                        description: `[Budget Manager]\nסכום: ${expense.amount} ${expense.currency}\nקטגוריה: ${expense.category}`,
                        start: { date: new Date(expense.date).toISOString().split('T')[0] },
                        end: { date: new Date(expense.date).toISOString().split('T')[0] },
                        colorId: '11'
                    })
                }
            }
        }

        // 4. Delete Old Events (Fix Duplication Bug)
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
            // Client-side filter because 'q' doesn't work well with private props
            const eventsToDelete = existingEvents.data.items.filter(evt =>
                // Check private prop OR description tag as fallback
                evt.extendedProperties?.private?.app === 'Budget Manager' ||
                evt.description?.includes('[Budget Manager]')
            )

            const deletePromises = eventsToDelete.map(evt =>
                calendar.events.delete({ calendarId, eventId: evt.id! })
            )
            await Promise.all(deletePromises)
        }

        // 5. Insert New Events
        for (const evt of events) {
            await calendar.events.insert({
                calendarId,
                requestBody: {
                    ...evt,
                    extendedProperties: {
                        private: {
                            app: 'Budget Manager',
                            type: 'auto-sync'
                        }
                    }
                }
            })
        }

        return { success: true, count: events.length }

    } catch (error) {
        console.error('Sync Error:', error)
        return { success: false, error: 'Failed to sync calendar' }
    }
}
