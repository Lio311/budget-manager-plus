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

        let body
        try {
            const text = await req.text()
            console.log('Raw Request Body:', text)
            if (!text) {
                return NextResponse.json({ error: 'Empty request body' }, { status: 400 })
            }
            body = JSON.parse(text)
        } catch (e) {
            console.error('Failed to parse JSON:', e)
            return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
        }

        let { amount, category, description, currency, date, budgetType = 'PERSONAL' } = body

        // Support Hebrew Keys (fallback for Israeli users/shortcuts)
        if (!amount && body['סכום']) amount = body['סכום']
        if (!category && body['קטגוריה']) category = body['קטגוריה']
        if (!description && (body['תיאור'] || body['תיאור ההוצאה'])) description = body['תיאור'] || body['תיאור ההוצאה']
        if (!currency && body['מטבע']) currency = body['מטבע']
        if (!date && body['תאריך']) date = body['תאריך']
        if (!budgetType && body['סוג']) budgetType = body['סוג']

        console.log('Received Expense Request:', { amount, category, budgetType, currency, date })

        if (!amount) {
            return NextResponse.json({ error: 'Missing amount' }, { status: 400 })
        }

        const numericAmount = parseFloat(amount)
        if (isNaN(numericAmount)) {
            return NextResponse.json({ error: 'Invalid amount - must be a number' }, { status: 400 })
        }

        // Handle Category: Fallback to 'כללי' if missing or empty
        let categoryName = 'כללי'
        if (category) {
            categoryName = findMatchingCategory(category, user.categories) || category
        }

        const targetType = (budgetType === 'BUSINESS' || budgetType === 'business') ? 'BUSINESS' : 'PERSONAL'

        // Handle Date: Default to Now, or Parse provided date
        let expenseDate = new Date()
        if (date) {
            const parsedDate = new Date(date)
            if (!isNaN(parsedDate.getTime())) {
                expenseDate = parsedDate
            }
        }

        const month = expenseDate.getMonth() + 1
        const year = expenseDate.getFullYear()

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
                date: expenseDate,
                paymentMethod: body['אמצעי תשלום'] || body['paymentMethod'] || 'CREDIT_CARD' // Optional extra
            }
        })

        console.log('Expense Saved:', expense.id)
        return NextResponse.json({ success: true, id: expense.id, message: 'Expense saved successfully', debug: { category: categoryName, date: expenseDate } })

    } catch (error) {
        console.error('API Internal Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
