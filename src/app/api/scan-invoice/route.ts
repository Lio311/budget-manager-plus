
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { revalidatePath } from 'next/cache'

// Initialize Gemini context variable
let genAI: GoogleGenerativeAI | null = null;

export async function POST(request: NextRequest) {
    try {
        // 1. Authentication (Same as quick-add)
        const apiKey = request.headers.get('x-api-key')

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Missing API key' },
                { status: 200 } // Changed from 401 to debugging
            )
        }

        const user = await prisma.user.findUnique({
            where: { shortcutApiKey: apiKey },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized: Invalid API key' },
                { status: 200 } // Changed from 401 for debugging
            )
        }

        const userId = user.id

        // Initialize Gemini inside handler
        const geminiKey = process.env.GEMINI_API_KEY
        if (!geminiKey) {
            console.error('GEMINI_API_KEY is not set')
            return NextResponse.json(
                { success: false, error: 'Server Configuration Error: Missing AI Key' },
                { status: 200 } // Changed from 500 for debugging
            )
        }

        if (!genAI) {
            genAI = new GoogleGenerativeAI(geminiKey)
        }

        // 2. Process Image & Scope
        const formData = await request.formData()
        const fileEntry = formData.get('file')
        const scopeParam = formData.get('scope') as string | null

        console.log(`[API Scan] File entry:`, fileEntry)

        if (!fileEntry || !(fileEntry instanceof File)) {
            return NextResponse.json(
                { success: false, error: 'Invalid file received. Please ensure Shortuct sends a File, not Text. (Received: ' + (typeof fileEntry) + ')' },
                { status: 400 }
            )
        }

        const file = fileEntry

        // Normalize scope (handle Hebrew from iPhone Shortcut)
        let targetScope: 'PERSONAL' | 'BUSINESS' = 'PERSONAL'

        if (scopeParam) {
            const normalized = scopeParam.trim()
            if (['BUSINESS', 'עסקית', 'עסקי', 'Business'].includes(normalized)) {
                targetScope = 'BUSINESS'
            }
        }

        console.log(`[API Scan] Raw scope: "${scopeParam}", Resolved: ${targetScope}`)

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
        // User requested 'gemini-2.5-flash-preview-09-2025' but it seems unstable or non-existent.
        // We will try it, but wrap in try/catch to fallback to stable if it fails.
        const modelName = 'gemini-2.5-flash-preview-09-2025'
        const stableModelName = 'gemini-1.5-flash'

        const model = genAI.getGenerativeModel({ model: modelName })

        const prompt = `
        Analyze this invoice/receipt image and extract the following details into a JSON object:
        - amount: number (total sum)
        - businessName: string (merchant name)
        - date: string (YYYY-MM-DD format, estimate if missing)
        - category: string (suggest a category in Hebrew)

        Return ONLY the JSON. Do not include markdown formatting.
        `

        let result;
        try {
            result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    }
                }
            ])
        } catch (modelError: any) {
            console.log(`[API Scan] Model ${modelName} failed, trying ${stableModelName}. Error:`, modelError.message)
            const fallbackModel = genAI.getGenerativeModel({ model: stableModelName })
            result = await fallbackModel.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: file.type
                    }
                }
            ])
        }

        const response = result.response
        const text = response.text()

        console.log('[API Scan] Raw AI Response:', text)

        // Clean and parse JSON
        let extractedData: any
        try {
            // Attempt 1: naive clean
            let cleanedText = text.replace(/```json\n|\n```/g, '').replace(/```/g, '').trim()

            // Attempt 2: find first { and last }
            const firstBrace = cleanedText.indexOf('{')
            const lastBrace = cleanedText.lastIndexOf('}')

            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanedText = cleanedText.substring(firstBrace, lastBrace + 1)
            }

            extractedData = JSON.parse(cleanedText)
        } catch (e) {
            console.error('[API Scan] JSON Parse Error:', e)
            return NextResponse.json(
                { success: false, error: 'Failed to parse AI response. See server logs.' },
                { status: 500 }
            )
        }

        console.log('[API Scan] Extracted:', extractedData)

        // 4. Save to Database
        const expenseDate = extractedData.date ? new Date(extractedData.date) : new Date()

        // Validate Date
        if (isNaN(expenseDate.getTime())) {
            console.error('[API Scan] Invalid date parsed:', extractedData.date)
            // Fallback to today? Or error? Let's fallback to today but warn.
        }

        const month = expenseDate.getMonth() + 1
        const year = expenseDate.getFullYear()

        // Ensure Budget Exists (Personal or Business based on scope)
        const budget = await prisma.budget.upsert({
            where: {
                userId_month_year_type: {
                    userId,
                    month,
                    year,
                    type: targetScope // Updated to use targetScope
                }
            },
            update: {},
            create: {
                userId,
                month,
                year,
                type: targetScope, // Updated to use targetScope
                currency: 'ILS'
            }
        })

        // Ensure Category Exists ("חשבוניות סרוקות")
        const categoryName = 'חשבוניות סרוקות'

        await prisma.category.upsert({
            where: {
                userId_name_type_scope: {
                    userId,
                    name: categoryName,
                    type: 'expense',
                    scope: targetScope // Updated to use targetScope
                }
            },
            update: {},
            create: {
                userId,
                name: categoryName,
                type: 'expense',
                scope: targetScope, // Updated to use targetScope
                color: targetScope === 'BUSINESS' ? 'bg-blue-500' : 'bg-purple-500' // Different color for business
            }
        })

        // Check for duplicates
        // We consider it a duplicate if: same amount, same date, same description, same budget
        const duplicate = await prisma.expense.findFirst({
            where: {
                budgetId: budget.id,
                amount: extractedData.amount || 0,
                // Compare dates by day to avoid time differences
                date: {
                    gte: new Date(expenseDate.setHours(0, 0, 0, 0)),
                    lt: new Date(expenseDate.setHours(23, 59, 59, 999))
                },
                description: extractedData.businessName || 'הוצאה סרוקה'
            }
        })

        if (duplicate) {
            console.log(`[API Scan] Duplicate found: ${duplicate.id}`)
            return NextResponse.json(
                { success: false, error: 'חשבונית כפולה: הוצאה זו כבר קיימת במערכת.' },
                { status: 409 }
            )
        }

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
                paymentMethod: 'כרטיס אשראי', // Default
                // For Business expenses, we might want to default VAT type or deducibility? 
                // Leaving as default for now as they are handled by DB defaults (FULL recognized)
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
                date: expense.date,
                scope: targetScope
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
