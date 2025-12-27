'use server'

import { prisma } from '@/lib/db'
import { currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export interface InvoiceFormData {
    clientId: string
    invoiceNumber: string
    issueDate: Date
    dueDate?: Date
    subtotal: number
    vatRate?: number
    notes?: string
}

export async function getInvoices(scope: string = 'BUSINESS') {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const invoices = await prisma.invoice.findMany({
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

        return { success: true, data: invoices }
    } catch (error) {
        console.error('getInvoices error:', error)
        return { success: false, error: 'Failed to fetch invoices' }
    }
}

export async function getInvoice(id: string) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                incomes: true
            }
        })

        if (!invoice || invoice.userId !== user.id) {
            throw new Error('Invoice not found')
        }

        return { success: true, data: invoice }
    } catch (error) {
        console.error('getInvoice error:', error)
        return { success: false, error: 'Failed to fetch invoice' }
    }
}

export async function createInvoice(data: InvoiceFormData, scope: string = 'BUSINESS') {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const vatRate = data.vatRate ?? 0.18
        const vatAmount = data.subtotal * vatRate
        const total = data.subtotal + vatAmount

        const invoice = await prisma.invoice.create({
            data: {
                userId: user.id,
                clientId: data.clientId,
                scope,
                invoiceNumber: data.invoiceNumber,
                issueDate: data.issueDate,
                dueDate: data.dueDate,
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
        return { success: true, data: invoice }
    } catch (error: any) {
        console.error('createInvoice error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'חשבונית עם מספר זה כבר קיימת' }
        }
        return { success: false, error: 'Failed to create invoice' }
    }
}

export async function updateInvoice(id: string, data: Partial<InvoiceFormData>) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.invoice.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Invoice not found')
        }

        const updateData: any = {}

        if (data.invoiceNumber) updateData.invoiceNumber = data.invoiceNumber
        if (data.issueDate) updateData.issueDate = data.issueDate
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
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

        const invoice = await prisma.invoice.update({
            where: { id },
            data: updateData,
            include: {
                client: true
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: invoice }
    } catch (error: any) {
        console.error('updateInvoice error:', error)
        if (error.code === 'P2002') {
            return { success: false, error: 'חשבונית עם מספר זה כבר קיימת' }
        }
        return { success: false, error: 'Failed to update invoice' }
    }
}

export async function updateInvoiceStatus(id: string, status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED', paidDate?: Date, paidAmount?: number) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.invoice.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Invoice not found')
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                status,
                paidDate: status === 'PAID' ? (paidDate || new Date()) : null,
                paidAmount: status === 'PAID' ? (paidAmount || existing.total) : null
            },
            include: {
                client: true
            }
        })

        revalidatePath('/dashboard')
        return { success: true, data: invoice }
    } catch (error) {
        console.error('updateInvoiceStatus error:', error)
        return { success: false, error: 'Failed to update invoice status' }
    }
}

export async function deleteInvoice(id: string) {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        // Verify ownership
        const existing = await prisma.invoice.findUnique({ where: { id } })
        if (!existing || existing.userId !== user.id) {
            throw new Error('Invoice not found')
        }

        // Check if invoice has associated incomes
        const hasIncomes = await prisma.income.count({ where: { invoiceId: id } })

        if (hasIncomes > 0) {
            return {
                success: false,
                error: 'לא ניתן למחוק חשבונית עם הכנסות משויכות. אפשר לבטל את החשבונית במקום.'
            }
        }

        await prisma.invoice.delete({ where: { id } })

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('deleteInvoice error:', error)
        return { success: false, error: 'Failed to delete invoice' }
    }
}

export async function getNextInvoiceNumber() {
    try {
        const user = await currentUser()
        if (!user) throw new Error('Unauthorized')

        const lastInvoice = await prisma.invoice.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { invoiceNumber: true }
        })

        if (!lastInvoice) {
            return { success: true, data: '1001' }
        }

        // Try to extract number from invoice number
        const match = lastInvoice.invoiceNumber.match(/\d+/)
        if (match) {
            const nextNumber = (parseInt(match[0]) + 1).toString()
            return { success: true, data: nextNumber }
        }

        return { success: true, data: '1001' }
    } catch (error) {
        console.error('getNextInvoiceNumber error:', error)
        return { success: false, error: 'Failed to get next invoice number' }
    }
}
