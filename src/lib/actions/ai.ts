'use server'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables')
}
const genAI = new GoogleGenerativeAI(apiKey)

interface FinancialData {
    month: number
    year: number
    currency: string
    totalIncome: number
    totalExpenses: number
    savingsRemainder: number
    incomes: any[]
    expenses: any[]
    bills: any[]
    debts: any[]
    savings: any[]
}

export async function getFinancialAdvice(data: FinancialData) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return {
                success: false,
                error: 'משתמש לא מחובר'
            }
        }


        // Check cache first - enforce 24-hour limit
        const cachedAdvice = await prisma.aIAdviceCache.findUnique({
            where: {
                userId_month_year: {
                    userId,
                    month: data.month,
                    year: data.year
                }
            }
        })

        // If cache exists and not expired, return it
        if (cachedAdvice && cachedAdvice.expiresAt > new Date()) {
            const hoursRemaining = Math.floor((cachedAdvice.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
            return {
                success: true,
                advice: cachedAdvice.advice,
                cached: true,
                expiresIn: `${hoursRemaining} שעות`
            }
        }

        // If no cache or expired, call Gemini API
        console.log('[AI Advisor] Calling Gemini API for user:', userId)
        console.log('[AI Advisor] Data summary:', {
            month: data.month,
            year: data.year,
            totalIncome: data.totalIncome,
            totalExpenses: data.totalExpenses,
            incomesCount: data.incomes?.length || 0,
            expensesCount: data.expenses?.length || 0,
            billsCount: data.bills?.length || 0,
            debtsCount: data.debts?.length || 0
        })

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-09-2025' })

        // Format the financial data into a comprehensive prompt
        const prompt = `אתה יועץ פיננסי מקצועי. נתחת את הנתונים הפיננסיים הבאים של לקוח ותספק ניתוח מקצועי ותובנות.

**נתונים פיננסיים לחודש ${data.month}/${data.year}:**

**הכנסות:**
- סך הכנסות: ${data.totalIncome} ${data.currency}
- מספר מקורות הכנסה: ${data.incomes.length}
${data.incomes.map((inc: any) => `  - ${inc.source}: ${inc.amount} ${data.currency}`).join('\n')}

**הוצאות:**
- סך הוצאות: ${data.totalExpenses} ${data.currency}
- מספר הוצאות: ${data.expenses.length}
${data.expenses.slice(0, 10).map((exp: any) => `  - ${exp.description} (${exp.category}): ${exp.amount} ${data.currency}`).join('\n')}
${data.expenses.length > 10 ? `  ... ועוד ${data.expenses.length - 10} הוצאות` : ''}

**חשבונות קבועים:**
- מספר חשבונות: ${data.bills.length}
- שולמו: ${data.bills.filter((b: any) => b.isPaid).length}
${data.bills.map((bill: any) => `  - ${bill.name}: ${bill.amount} ${data.currency} ${bill.isPaid ? '✓' : '✗'}`).join('\n')}

**חובות:**
- מספר חובות: ${data.debts.length}
- תשלום חודשי כולל: ${data.debts.reduce((sum: number, d: any) => sum + (d.monthlyPayment || 0), 0)} ${data.currency}
${data.debts.map((debt: any) => `  - ${debt.creditor}: ${debt.monthlyPayment || 0} ${data.currency}/חודש${debt.totalAmount ? ` (סה"כ חוב: ${debt.totalAmount} ${data.currency})` : ''}`).join('\n')}

**חסכונות:**
- הפקדה חודשית: ${data.savings.reduce((sum: number, s: any) => sum + s.monthlyDeposit, 0)} ${data.currency}
${data.savings.map((sav: any) => `  - ${sav.description}: ${sav.monthlyDeposit} ${data.currency}/חודש`).join('\n')}

**מצב כללי:**
- יתרה חודשית (חיסכון): ${data.savingsRemainder} ${data.currency}
- אחוז חיסכון: ${data.totalIncome > 0 ? ((data.savingsRemainder / data.totalIncome) * 100).toFixed(1) : 0}%

---

**בבקשה ספק ניתוח מקצועי תמציתי:**

כתוב 2-3 פסקאות תמציתיות (עד 400 מילים) בעברית, ללא כותרת פתיחה כמו "בכבוד רב" או "שלום".
התמקד בסקירת המצב הפיננסי, נקודות חוזק, תחומים לשיפור, וסיכונים פוטנציאליים.
סיים עם 3-5 המלצות מעשיות וקונקרטיות.

**חשוב:** 
- אל תשתמש באימוג'י
- אל תשתמש במספור (1, 2, 3) או כדורים (•)
- כתוב בצורה זורמת ומקצועית בפסקאות רגילות
- התמקד בתובנות מעשיות ומועילות`

        console.log('[AI Advisor] Sending prompt to Gemini, length:', prompt.length)

        const result = await model.generateContent(prompt)
        const response = result.response
        const text = response.text()

        console.log('[AI Advisor] Received response, length:', text.length)
        console.log('[AI Advisor] Response preview:', text.substring(0, 200))

        // Store in cache with 24-hour expiry
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now

        await prisma.aIAdviceCache.upsert({
            where: {
                userId_month_year: {
                    userId,
                    month: data.month,
                    year: data.year
                }
            },
            create: {
                userId,
                month: data.month,
                year: data.year,
                advice: text,
                expiresAt
            },
            update: {
                advice: text,
                expiresAt,
                createdAt: new Date()
            }
        })

        return {
            success: true,
            advice: text,
            cached: false,
            expiresIn: undefined
        }
    } catch (error: any) {
        console.error('Error getting financial advice:', error)
        return {
            success: false,
            error: error.message || 'שגיאה בקבלת ייעוץ פיננסי'
        }
    }
}
