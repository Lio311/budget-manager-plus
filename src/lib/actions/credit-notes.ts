'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { getCurrentBudget } from './budget'

export interface CreditNoteFormData {
    invoiceId: string
    creditNoteNumber: string
    issueDate: Date
    creditAmount: number
    reason?: string
}

export async function getCreditNotes(scope: string = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const creditNotes = await db.creditNote.findMany({
            where: {
                userId,
                scope
            },
            include: {
                invoice: {
                    include: {
                        client: true
                    }
                }
            },
            orderBy: {
                issueDate: 'desc'
            }
        })

        return { success: true, data: creditNotes }
    } catch (error) {
        console.error('getCreditNotes error:', error)
        return { success: false, error: 'Failed to fetch credit notes' }
    }
}

export async function getCreditNote(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const creditNote = await db.creditNote.findUnique({
            where: { id },
            include: {
                invoice: {
                    include: {
                        client: true
                    }
                }
            }
        })

        if (!creditNote || creditNote.userId !== userId) {
            throw new Error('Credit note not found')
        }

        return { success: true, data: creditNote }
    } catch (error) {
        console.error('getCreditNote error:', error)
        return { success: false, error: 'Failed to fetch credit note' }
    }
}

export async function createCreditNote(data: CreditNoteFormData) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify invoice exists and belongs to user
        const invoice = await db.invoice.findUnique({
            where: { id: data.invoiceId }
        })

        if (!invoice || invoice.userId !== userId) {
            throw new Error('Invoice not found')
        }

        // Get budget for the credit note date
        const issueDate = new Date(data.issueDate)
        const budget = await getCurrentBudget(
            issueDate.getMonth() + 1,
            issueDate.getFullYear(),
            '₪',
            'BUSINESS'
        )

        import { createHash } from 'crypto'

        // ... in createCreditNote ...

        // Calculate VAT and total
        const vatAmount = data.creditAmount * invoice.vatRate
        const totalCredit = data.creditAmount + vatAmount

        // Generate Hash
        const hashData = JSON.stringify({
            number: data.creditNoteNumber,
            date: data.issueDate.toISOString(),
            amount: totalCredit,
            invoiceId: data.invoiceId,
            reason: data.reason
        })
        const documentHash = createHash('sha256').update(hashData).digest('hex')

        // Create credit note
        const creditNote = await db.creditNote.create({
            data: {
                userId,
                invoiceId: data.invoiceId,
                creditNoteNumber: data.creditNoteNumber,
                issueDate: data.issueDate,
                creditAmount: data.creditAmount,
                vatAmount,
                totalCredit,
                reason: data.reason,
                scope: 'BUSINESS',
                documentHash,
                signedAt: new Date()
            },
            include: {
                invoice: {
                    include: {
                        client: true
                    }
                }
            }
        })

        // Create negative income entry to reduce revenue
        await db.income.create({
            data: {
                budgetId: budget.id,
                source: `זיכוי עבור חשבונית ${invoice.invoiceNumber} - ${data.reason || 'זיכוי'}`,
                category: 'זיכויים',
                amount: -totalCredit,
                date: data.issueDate,
                clientId: invoice.clientId,
                invoiceId: invoice.id
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: creditNote }
    } catch (error: any) {
        console.error('createCreditNote error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'חשבונית זיכוי עם מספר זה כבר קיימת' }
        }
        return { success: false, error: 'Failed to create credit note' }
    }
}

export async function deleteCreditNote(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        // Verify ownership
        const existing = await db.creditNote.findUnique({
            where: { id },
            include: { invoice: true }
        })

        if (!existing || existing.userId !== userId) {
            throw new Error('Credit note not found')
        }

        // Delete the negative income entry
        await db.income.deleteMany({
            where: {
                invoiceId: existing.invoiceId,
                amount: { lt: 0 }, // Negative amounts only
                source: { contains: `זיכוי עבור חשבונית ${existing.invoice.invoiceNumber}` }
            }
        })

        // Delete credit note
        await db.creditNote.delete({
            where: { id }
        })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteCreditNote error:', error)
        return { success: false, error: 'Failed to delete credit note' }
    }
}

export async function getNextCreditNoteNumber() {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const lastCreditNote = await db.creditNote.findFirst({
            where: { userId },
            orderBy: { creditNoteNumber: 'desc' }
        })

        if (!lastCreditNote) {
            return { success: true, number: 'CN-1001' }
        }

        // Extract number from format CN-XXXX
        const match = lastCreditNote.creditNoteNumber.match(/CN-(\d+)/)
        if (match) {
            const nextNum = parseInt(match[1]) + 1
            return { success: true, number: `CN-${nextNum}` }
        }

        return { success: true, number: 'CN-1001' }
    } catch (error) {
        console.error('getNextCreditNoteNumber error:', error)
        return { success: false, error: 'Failed to generate credit note number' }
    }
}

export async function generateCreditNoteLink(id: string) {
    try {
        const { userId } = await auth()
        if (!userId) throw new Error('Unauthorized')

        const db = await authenticatedPrisma(userId)

        const creditNote = await db.creditNote.findUnique({ where: { id } })
        if (!creditNote || creditNote.userId !== userId) {
            throw new Error('Credit note not found')
        }

        if (!creditNote.token) {
            const updated = await db.creditNote.update({
                where: { id },
                data: { token: undefined } // Will use default cuid()
            })
            return { success: true, token: updated.token }
        }

        return { success: true, token: creditNote.token }
    } catch (error) {
        console.error('generateCreditNoteLink error:', error)
        return { success: false, error: 'Failed to generate link' }
    }
}

export async function getCreditNoteByToken(token: string) {
    try {
        const creditNote = await prisma.creditNote.findUnique({
            where: { token },
            include: {
                invoice: {
                    include: {
                        client: true
                    }
                },
                user: {
                    include: {
                        businessProfile: true
                    }
                }
            }
        })

        if (!creditNote) {
            throw new Error('Credit note not found')
        }

        return { success: true, data: creditNote }
    } catch (error) {
        console.error('getCreditNoteByToken error:', error)
        return { success: false, error: 'Credit note not found' }
    }
}
