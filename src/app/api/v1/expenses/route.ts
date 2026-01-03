import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { convertToILS } from '@/lib/currency'
import { findMatchingCategory } from '@/lib/category-utils'

export async function POST(req: NextRequest) {
    try {
        const apiKey = req.headers.get('x-api-key') || req.nextUrl.searchParams.get('apiKey')

        if (!apiKey) {
            console.error('API Error: Missing API Key')
            return NextResponse.json({ error: 'Missing API Key' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { shortcutApiKey: apiKey },
            include: { categories: true }
        })

        if (!user) {
            console.error('API Error: Invalid API Key')
            return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 })
        }

        const body = await req.json()
        const { amount, category, description, currency, budgetType = 'PERSONAL' } = body

        console.log('Received Expense Request:', { amount, category, budgetType, currency })

        if (!amount || !category) {
            return NextResponse.json({ error: 'Missing amount or category' }, { status: 400 })
        }

        const numericAmount = parseFloat(amount)
        if (isNaN(numericAmount)) {
            return NextResponse.json({ error: 'Invalid amount - must be a number' }, { status: 400 })
        }

        const categoryName = findMatchingCategory(category, user.categories) || category
        const targetType = (budgetType === 'BUSINESS' || budgetType === 'business') ? 'BUSINESS' : 'PERSONAL'

        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        // Find or Create Budget
        let budget = await prisma.budget.findFirst({
            where: {
                userId: user.id,
                month,
                year,
                type: targetType
            }
        })

        if (!budget) {
            console.log(`Creating new ${targetType} budget for ${month}/${year}`)
            budget = await prisma.budget.create({
                data: {
                    userId: user.id,
                    month,
                    year,
                    type: targetType,
                    currency: 'ILS'
                }
            })
        }

        const expense = await prisma.expense.create({
            data: {
                budgetId: budget.id,
                amount: numericAmount,
                category: categoryName,
                description: description || 'From Shortcut',
                currency: currency || 'ILS', // Default to ILS
                date: now
            }
        })

        console.log('Expense Saved:', expense.id)
        return NextResponse.json({ success: true, id: expense.id, message: 'Expense saved successfully' })

    } catch (error) {
        console.error('API Internal Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
