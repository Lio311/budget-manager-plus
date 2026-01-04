import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Validation Schema for Quick-Add Expense
const quickAddSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required'),
    category: z.string().optional().default('כללי'), // Default to "General" in Hebrew
    date: z.coerce.date().optional().default(() => new Date())
})

type QuickAddInput = z.infer<typeof quickAddSchema>

/**
 * POST /api/quick-add
 * 
 * Secure API endpoint for iOS Shortcuts to add expenses directly.
 * Requires API Key authentication via x-api-key header.
 * 
 * @returns JSON response with success/error status
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Security & Authentication
        const apiKey = request.headers.get('x-api-key')
        const validApiKey = process.env.KESEFLOW_API_KEY

        if (!apiKey || !validApiKey || apiKey !== validApiKey) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Unauthorized: Invalid or missing API key'
                },
                { status: 401 }
            )
        }

        // Get Admin User ID from environment
        const adminUserId = process.env.ADMIN_USER_ID
        if (!adminUserId) {
            console.error('ADMIN_USER_ID environment variable is not configured')
            return NextResponse.json(
                {
                    success: false,
                    error: 'Server configuration error'
                },
                { status: 500 }
            )
        }

        // 2. Parse and Validate Request Body
        const body = await request.json()
        const validationResult = quickAddSchema.safeParse(body)

        if (!validationResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Validation failed',
                    details: validationResult.error.errors
                },
                { status: 400 }
            )
        }

        const data: QuickAddInput = validationResult.data

        // 3. Database Operation
        // Get current month and year from the provided date
        const expenseDate = data.date
        const month = expenseDate.getMonth() + 1
        const year = expenseDate.getFullYear()

        // Find or create the budget for this month
        // Default to PERSONAL budget type for quick-add
        const budget = await prisma.budget.upsert({
            where: {
                userId_month_year_type: {
                    userId: adminUserId,
                    month,
                    year,
                    type: 'PERSONAL'
                }
            },
            update: {},
            create: {
                userId: adminUserId,
                month,
                year,
                type: 'PERSONAL',
                currency: '₪'
            }
        })

        // Ensure the category exists for the user
        const category = await prisma.category.upsert({
            where: {
                userId_name_type_scope: {
                    userId: adminUserId,
                    name: data.category,
                    type: 'expense',
                    scope: 'PERSONAL'
                }
            },
            update: {},
            create: {
                userId: adminUserId,
                name: data.category,
                type: 'expense',
                scope: 'PERSONAL',
                color: 'bg-gray-500'
            }
        })

        // Create the expense
        const expense = await prisma.expense.create({
            data: {
                budgetId: budget.id,
                category: data.category,
                description: data.description,
                amount: data.amount,
                currency: 'ILS',
                date: expenseDate,
                isRecurring: false
            }
        })

        // 4. Cache Revalidation
        revalidatePath('/dashboard')
        revalidatePath('/') // Also revalidate home in case of overview data

        // Return Success Response
        return NextResponse.json(
            {
                success: true,
                data: {
                    id: expense.id,
                    amount: expense.amount,
                    description: expense.description,
                    category: expense.category,
                    date: expense.date,
                    message: 'הוצאה נוספה בהצלחה' // "Expense added successfully" in Hebrew
                }
            },
            { status: 201 }
        )

    } catch (error) {
        // 5. Error Handling
        console.error('Quick-Add API Error:', error)

        // Log detailed error for debugging but return generic message to client
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error: Failed to add expense'
            },
            { status: 500 }
        )
    }
}
