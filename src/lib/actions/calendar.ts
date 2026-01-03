'use server'

import { authenticatedPrisma } from '@/lib/db'
import { getGoogleCalendarClient } from '@/lib/google'
import { auth } from '@clerk/nextjs/server'
import { getCurrentBudget } from './budget'
import { convertToILS } from '@/lib/currency'

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

        // 2. Fetch Budget Data
        // Use 'PERSONAL' by default or iterate both? 
        // For simplicity, let's sync the active dashboard context if passed, or just PERSONAL for now. 
        // The user didn't specify, but usually they want everything. 
        // Let's assume passed month/year is relevant.
        // We'll sync PERSONAL budget items.

        const budget = await getCurrentBudget(month, year, '₪', 'PERSONAL')
        if (!budget) return { success: false, error: 'No budget found' }

        // 3. Prepare Events
        const events = []
        const calendarId = user.googleCalendarId || 'primary'

        // Bills (Due Date)
        if (budget.bills) {
            for (const bill of budget.bills) {
                if (bill.dueDate) {
                    events.push({
                        summary: `🛒 חוב/הוצאה: ${bill.name}`,
                        description: `סכום: ${bill.amount} ${bill.currency}\nסטטוס: ${bill.isPaid ? 'שולם' : 'לא שולם'}`,
                        start: { date: new Date(bill.dueDate).toISOString().split('T')[0] },
                        end: { date: new Date(bill.dueDate).toISOString().split('T')[0] },
                        colorId: '11' // Red-ish
                    })
                }
            }
        }

        // Debts (Due Day)
        if (budget.debts) {
            for (const debt of budget.debts) {
                // Construct date from dueDay + month/year
                // Be careful with day validity (e.g. 31st in Feb)
                const safeDay = Math.min(debt.dueDay, new Date(year, month, 0).getDate())
                const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`

                events.push({
                    summary: `💳 הלוואה: ${debt.creditor}`,
                    description: `סכום: ${debt.monthlyPayment} ${debt.currency}\nיתרה: ${debt.totalAmount}`,
                    start: { date: dateStr },
                    end: { date: dateStr },
                    colorId: '9' // Blueberry
                })
            }
        }

        // 4. Push to Google
        // Strategy: "Sync Day" - We can't easily track individual updates without IDs.
        // Simple approach: Create events. 
        // Risk: Duplicates if run multiple times.
        // Fix: Query existing events in this month range with signature "Created by Budget Manager" property?
        // Or simply trust the user won't spam the button? 
        // Better: Search events by timeMin/timeMax and title matching.

        const startDate = new Date(year, month - 1, 1).toISOString()
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()

        const existingEvents = await calendar.events.list({
            calendarId,
            timeMin: startDate,
            timeMax: endDate,
            singleEvents: true,
            q: 'Budget Manager' // Tag search
        })

        // Simple Dedup: If event exists at same day with same title, skip.
        // Or Delete All "Budget Manager" events in this range and Re-create. (Destructive but clean)

        // Let's trying "Delete All Tagged" approach for this month range to ensure perfect sync.
        if (existingEvents.data.items) {
            const batch = existingEvents.data.items.map(evt =>
                calendar.events.delete({ calendarId, eventId: evt.id! })
            )
            await Promise.all(batch)
        }

        // Create New
        // Use a batch? Google API supports batching but loop is fine for < 50 items.
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
