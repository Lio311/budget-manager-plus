'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface QuoteFormData {
    clientId: string
    quoteNumber: string
    issueDate: Date
    validUntil?: Date
    subtotal: number
    vatRate?: number
    notes?: string
}

export async function getQuotes(scope: string = 'BUSINESS') {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const quotes = await prisma.quote.findMany({
            where: {
                userId: user.id,
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
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const quote = await prisma.quote.findUnique({
            where: { id },
            include: {
                client: true
            }
        })

        if (!quote || quote.userId !== user.id) {
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
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const vatRate = data.vatRate ?? 0.18
        const vatAmount = data.subtotal * vatRate
        const total = data.subtotal + vatAmount

        const quote = await prisma.quote.create({
            data: {
                userId: user.id,
                clientId: data.clientId,
                scope,
                quoteNumber: data.quoteNumber,
                issueDate: data.issueDate,
                validUntil: data.validUntil,
                subtotal: data.subtotal,
                vatRate,
                vatAmount,
                total,
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
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.quote.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Quote not found')
        }

        const updateData: any = {}

        if (data.quoteNumber) updateData.quoteNumber = data.quoteNumber
        if (data.issueDate) updateData.issueDate = data.issueDate
        if (data.validUntil !== undefined) updateData.validUntil = data.validUntil
        if (data.notes !== undefined) updateData.notes = data.notes

        if (data.subtotal !== undefined) {
            const vatRate = data.vatRate ?? existing.vatRate
            const vatAmount = data.subtotal * vatRate
            const total = data.subtotal + vatAmount

            updateData.subtotal = data.subtotal
            updateData.vatRate = vatRate
            updateData.vatAmount = vatAmount
            updateData.total = total
        }

        const quote = await prisma.quote.update({
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
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.quote.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Quote not found')
        }

        const quote = await prisma.quote.update({
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
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.quote.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Quote not found')
        }

        await prisma.quote.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteQuote error:', error)
        return { success: false, error: 'Failed to delete quote' }
    }
}

export async function getNextQuoteNumber() {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const lastQuote = await prisma.quote.findFirst({
            where: { userId: user.id },
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
