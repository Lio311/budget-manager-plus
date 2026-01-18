'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@clerk/nextjs/server'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables')
}
const genAI = new GoogleGenerativeAI(apiKey)

interface ScanResult {
    success: boolean
    data?: {
        date: string | null
        amount: number
        businessName: string
        category?: string
        vatAmount?: number
    }
    error?: string
}

export async function scanInvoiceImage(formData: FormData): Promise<ScanResult> {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'Unauthorized' }
        }

        const file = formData.get('file') as File
        if (!file) {
            return { success: false, error: 'No file provided' }
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer()
        const base64Data = Buffer.from(arrayBuffer).toString('base64')

        // Initialize Gemini Model
        // Using the same model as in ai.ts which is confirmed to work
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' })

        const prompt = `
        Analyze this invoice/receipt image and extract the following details into a JSON object:
        1. "amount": The total amount (final sum) of the invoice. number.
        2. "businessName": The name of the merchant/business. string.
        3. "date": The date of the invoice in YYYY-MM-DD format. If not found, null. string | null.
        4. "category": A suggested category for this expense (e.g., "Food", "Transport", "Shopping", "Bills"). string.
        5. "vatAmount": The VAT/Tax amount (Ma'am) if stated. 
           - If the VAT amount is explicitly stated on the receipt, use that value.
           - If VAT is NOT stated but the receipt looks like a standard Israeli receipt (ILS), CALCULATE it as: amount - (amount / 1.18). Round to 2 decimal places.
           - If the receipt is clearly from a VAT-exempt entity (e.g. Eilat, or specific exempt query), return 0. 
           - Default to calculating 18% VAT if unsure (Amount * 0.17 is wrong! Use the extraction method: Amount - (Amount/1.18)).

        Return ONLY the JSON object. Do not include markdown code blocks.
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

        // Clean markdown if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const data = JSON.parse(jsonStr)
            return {
                success: true,
                data: {
                    date: data.date || null,
                    amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
                    businessName: data.businessName || 'עסק לא מזוהה',
                    category: data.category,
                    vatAmount: typeof data.vatAmount === 'number' ? data.vatAmount : parseFloat(data.vatAmount) || 0
                }
            }
        } catch (e) {
            console.error('Failed to parse Gemini response:', text)
            return { success: false, error: 'Failed to analyze image' }
        }

    } catch (error: any) {
        console.error('Scan invoice error:', error)
        return { success: false, error: error.message || 'Failed to scan invoice' }
    }
}
