'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { createInvoice, getNextInvoiceNumber, InvoiceFormData } from './invoices'

export interface QuoteFormData {
    clientId: string
    quoteNumber: string
    issueDate: Date
    validUntil?: Date
    subtotal: number
    vatRate?: number
    notes?: string
    items?: any[]
}

export async function getQuotes(scope: string = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const quotes = await db.quote.findMany({
            where: {
                userId,
                scope
            },
            include: {
                client: true
            },
            orderBy: {
                issueDate: 'desc'
            }
        })

        return { success: true, data: quotes }
    } catch (error) {
        console.error('getQuotes error:', error)
        return { success: false, error: 'Failed to fetch quotes' }
    }
}

export async function getQuote(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const quote = await db.quote.findUnique({
            where: { id },
            include: {
                client: true
            }
        })

        if (!quote || quote.userId !== userId) {
            throw new Error('Quote not found')
        }

        return { success: true, data: quote }
    } catch (error) {
        console.error('getQuote error:', error)
        return { success: false, error: 'Failed to fetch quote' }
    }
}

export async function createQuote(data: QuoteFormData, scope: string = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const vatRate = data.vatRate ?? 0.18
        const vatAmount = data.subtotal * vatRate
        const total = data.subtotal + vatAmount

        const quote = await db.quote.create({
            data: {
                userId,
                clientId: data.clientId,
                scope,
                quoteNumber: data.quoteNumber,
                issueDate: data.issueDate,
                validUntil: data.validUntil,
                subtotal: data.subtotal,
                vatRate,
                vatAmount,
                total,
                items: data.items, // Line items data
                notes: data.notes,
                status: 'DRAFT'
            },
            include: {
                client: true
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: quote }
    } catch (error: any) {
        console.error('createQuote error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'הצעת מחיר עם מספר זה כבר קיימת' }
        }
        return { success: false, error: 'Failed to create quote' }
    }
}

export async function updateQuote(id: string, data: Partial<QuoteFormData>) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.quote.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Quote not found')
        }

        const updateData: any = {}

        if (data.quoteNumber) updateData.quoteNumber = data.quoteNumber
        if (data.issueDate) updateData.issueDate = data.issueDate
        if (data.validUntil !== undefined) updateData.validUntil = data.validUntil
        if (data.notes !== undefined) updateData.notes = data.notes
        if (data.items !== undefined) updateData.items = data.items

        if (data.subtotal !== undefined) {
            const vatRate = data.vatRate ?? existing.vatRate
            const vatAmount = data.subtotal * vatRate
            const total = data.subtotal + vatAmount

            updateData.subtotal = data.subtotal
            updateData.vatRate = vatRate
            updateData.vatAmount = vatAmount
            updateData.total = total
        }

        const quote = await db.quote.update({
            where: { id },
            data: updateData,
            include: {
                client: true
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: quote }
    } catch (error: any) {
        console.error('updateQuote error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'הצעת מחיר עם מספר זה כבר קיימת' }
        }
        return { success: false, error: 'Failed to update quote' }
    }
}

export async function updateQuoteStatus(id: string, status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.quote.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Quote not found')
        }

        const quote = await db.quote.update({
            where: { id },
            data: { status },
            include: {
                client: true
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: quote }
    } catch (error) {
        console.error('updateQuoteStatus error:', error)
        return { success: false, error: 'Failed to update quote status' }
    }
}

export async function deleteQuote(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.quote.findUnique({ where: { id } })
        if (!existing || existing.userId !== userId) {
            throw new Error('Quote not found')
        }

        await db.quote.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteQuote error:', error)
        return { success: false, error: 'Failed to delete quote' }
    }
}

export async function getNextQuoteNumber() {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const lastQuote = await db.quote.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { quoteNumber: true }
        })

        if (!lastQuote) {
            return { success: true, data: '2001' } // Quotes start with 2000 range by default
        }

        // Try to extract number from quote number
        const match = lastQuote.quoteNumber.match(/\d+/)
        if (match) {
            const nextNumber = (parseInt(match[0]) + 1).toString()
            return { success: true, data: nextNumber }
        }

        return { success: true, data: '2001' }
    } catch (error) {
        console.error('getNextQuoteNumber error:', error)
        return { success: false, error: 'Failed to get next quote number' }
    }
}

export async function generateQuoteLink(quoteId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const quote = await db.quote.findUnique({ where: { id: quoteId } })
        if (!quote || quote.userId !== userId) throw new Error('Quote not found')

        if (quote.token) {
            return { success: true, token: quote.token }
        }

        const token = crypto.randomUUID()
        await db.quote.update({
            where: { id: quoteId },
            data: { token }
        })

        return { success: true, token }
    } catch (error) {
        console.error('generateQuoteLink error:', error)
        return { success: false, error: 'Failed to generate link' }
    }
}

export async function getQuoteByToken(token: string) {
    try {
        const quote = await prisma.quote.findUnique({
            where: { token },
            include: {
                client: true,
                user: {
                    include: {
                        businessProfile: true
                    }
                }
            }
        })

        if (!quote) {
            return { success: false, error: 'Quote not found or expired' }
        }

        return { success: true, data: quote }
    } catch (error) {
        console.error('getQuoteByToken error:', error)
        return { success: false, error: 'Failed to fetch quote' }
    }
}

export async function signQuote(token: string, signatureBase64: string) {
    try {
        const quote = await prisma.quote.findUnique({ where: { token } })
        if (!quote) throw new Error('Quote not found')

        await prisma.quote.update({
            where: { id: quote.id },
            data: {
                signature: signatureBase64,
                signedAt: new Date(),
                isSigned: true,
                status: 'ACCEPTED'
            }
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/quotes')

        return { success: true }
    } catch (error) {
        console.error('signQuote error:', error)
        return { success: false, error: 'Failed to sign quote' }
    }
}

export async function convertQuoteToInvoice(quoteId: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // 1. Fetch Quote
        const quote = await db.quote.findUnique({
            where: { id: quoteId },
            include: {
                client: true,
            }
        })

        if (!quote || quote.userId !== userId) {
            throw new Error('Quote not found')
        }

        // 2. Get Next Invoice Number
        const nextNumberRes = await getNextInvoiceNumber()
        const invoiceNumber = nextNumberRes.success && nextNumberRes.data ? nextNumberRes.data : '1001'

        // 3. Map Data
        const lineItems = (quote.items as any[])?.map((item: any) => ({
            description: item.description || item.name || 'פריט',
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            total: (Number(item.quantity) || 1) * (Number(item.price) || 0)
        })) || []

        const invoiceData: InvoiceFormData = {
            clientId: quote.clientId,
            invoiceNumber: invoiceNumber,
            issueDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 14)),
            subtotal: quote.subtotal,
            vatRate: quote.vatRate,
            vatAmount: quote.vatAmount,
            total: quote.total,
            notes: `נוצר מהצעת מחיר #${quote.quoteNumber}`,
            createIncomeFromInvoice: false,
            lineItems: lineItems
        }

        // 4. Create Invoice
        const result = await createInvoice(invoiceData, quote.scope)

        if (!result.success || !result.data) {
            throw new Error(result.error || 'Failed to create invoice')
        }

        // 5. Link Invoice to Quote
        await db.quote.update({
            where: { id: quoteId },
            data: { invoiceId: result.data.id }
        })

        revalidatePath('/dashboard')
        return { success: true, invoiceId: result.data.id }

    } catch (error) {
        console.error('convertQuoteToInvoice error:', error)
        return { success: false, error: 'Failed to convert quote to invoice' }
    }
}
