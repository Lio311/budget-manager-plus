import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { convertToILS } from '@/lib/currency'
import { findMatchingCategory } from '@/lib/category-utils'

export async function POST(req: NextRequest) {
    try {
        const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('apiKey')

        if (!apiKey) {
            return NextResponse.json({ error: 'Missing API Key' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { shortcutApiKey: apiKey },
            include: { categories: true } // Need categories for fuzzy matching logic if reused
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })
        }

        // Parse Body
        const body = await req.json()
        const { amount, category, description, currency } = body

        if (!amount || !category) {
            return NextResponse.json({ error: 'Missing amount or category' }, { status: 400 })
        }

        // Fuzzy Match Category using shared utility
        const categoryName = findMatchingCategory(category, user.categories)

        // Create Expense
        const budget = await prisma.budget.findFirst({
            where: {
                userId: user.id,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                type: 'PERSONAL' // Shortcut usually personal
            }
        })

        let budgetId = budget?.id

        if (!budgetId) {
            // Auto create budget if missing? 
            // This is complex. Better to fail or require user to open app once?
            // Let's try to create basic budget
            const newBudget = await prisma.budget.create({
                data: {
                    userId: user.id,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                    type: 'PERSONAL'
                }
            })
            budgetId = newBudget.id
        }

        const expense = await prisma.expense.create({
            data: {
                budgetId: budgetId,
                amount: parseFloat(amount),
                category: categoryName,
                description: description || 'From Shortcut',
                currency: currency || 'ILS',
                date: new Date()
            }
        })

        return NextResponse.json({ success: true, id: expense.id, message: 'Expense saved' })

    } catch (error) {
        console.error('API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
