
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'

// Initialize Gemini
const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set')
}
const genAI = new GoogleGenerativeAI(apiKey)

export async function POST(request: NextRequest) {
    try {
        // 1. Authentication (Same as quick-add)
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Missing API key' },
                { status: 401 }
            )
        }

        const user = await prisma.user.findUnique({
            where: { shortcutApiKey: apiKey },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid API key' },
                { status: 401 }
            )
        }

        const userId = user.id

        // 2. Process Image
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { success: false, error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json(
                { success: false, error: 'File must be an image' },
                { status: 400 }
            )
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString('base64')

        // 3. Call Gemini AI
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' })

        const prompt = `
        Analyze this invoice/receipt image and extract the following details into a JSON object:
        - amount: number (total sum)
        - businessName: string (merchant name)
        - date: string (YYYY-MM-DD format, estimate if missing)
        - category: string (suggest a category in Hebrew)

        Return ONLY the JSON.
        `

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: base64Data,
                    mimeType: file.type
                }
            }
        ])

        const response = result.response
        const text = response.text()

        // Clean and parse JSON
        const cleanedText = text.replace(/```json\n|\n```/g, '').trim()
        const extractedData = JSON.parse(cleanedText)

        console.log('[API Scan] Extracted:', extractedData)

        // 4. Save to Database
        const expenseDate = extractedData.date ? new Date(extractedData.date) : new Date()
        const month = expenseDate.getMonth() + 1
        const year = expenseDate.getFullYear()

        // Ensure Budget Exists (Personal)
        const budget = await prisma.budget.upsert({
            where: {
                userId_month_year_type: {
                    userId,
                    month,
                    year,
                    type: 'PERSONAL'
                }
            },
            update: {},
            create: {
                userId,
                month,
                year,
                type: 'PERSONAL',
                currency: 'ILS'
            }
        })

        // Ensure Category Exists ("חשבוניות סרוקות" or whatever AI found, let's stick to "חשבוניות סרוקות" for consistency or AI suggestion?)
        // User requested: "Assign all expenses generated from scanned images to a new or existing category named "חשבוניות סרוקות" (Scanned Invoices)."
        const categoryName = 'חשבוניות סרוקות'

        await prisma.category.upsert({
            where: {
                userId_name_type_scope: {
                    userId,
                    name: categoryName,
                    type: 'expense',
                    scope: 'PERSONAL'
                }
            },
            update: {},
            create: {
                userId,
                name: categoryName,
                type: 'expense',
                scope: 'PERSONAL',
                color: 'bg-purple-500' // Distinct color
            }
        })

        // Create Expense
        const expense = await prisma.expense.create({
            data: {
                budgetId: budget.id,
                category: categoryName,
                description: extractedData.businessName || 'הוצאה סרוקה',
                amount: extractedData.amount || 0,
                currency: 'ILS',
                date: expenseDate,
                isRecurring: false,
                paymentMethod: 'כרטיס אשראי' // Default
            }
        })

        // 5. Revalidate
        revalidatePath('/dashboard')

        return NextResponse.json({
            success: true,
            data: {
                id: expense.id,
                amount: expense.amount,
                business: expense.description,
                date: expense.date
            }
        })

    } catch (error: any) {
        console.error('[API Scan] Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        )
    }
}
