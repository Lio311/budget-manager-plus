'use server'

import { prisma, authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { ClientFormData, createClient } from './clients'
import { ISRAELI_CITIES, ISRAELI_BANKS, getBankName } from '@/lib/constants/israel-data'

export async function importClients(clients: any[], budgetType: 'BUSINESS' | 'PERSONAL' = 'BUSINESS') {
    try {
        const { userId } = await auth()
        if (!userId) {
            return { success: false, error: 'User not authenticated' }
        }

        if (clients.length === 0) return { success: true, count: 0, skipped: 0 }

        const db = await authenticatedPrisma(userId)

        let addedCount = 0
        let skippedCount = 0

        // Fetch existing clients to check for duplicates (by name or taxId)
        const existingClients = await db.client.findMany({
            where: {
                userId,
                scope: budgetType
            },
            select: {
                name: true,
                taxId: true
            }
        })

        const existingNames = new Set(existingClients.map(c => c.name.trim().toLowerCase()))
        const existingTaxIds = new Set(existingClients.map(c => c.taxId?.trim()).filter(Boolean))

        for (const row of clients) {
            // Map CSV/Excel columns to ClientFormData
            // CSV Columns based on file:
            // "שם לקוח", "מספר עוסק", "כתובת", "עיר", "כתובות מייל", "טלפון", "נייד", "בנק", "סניף", "מספר חשבון", "הערות"

            const name = row['שם לקוח']?.toString().trim()
            if (!name) continue // Name is required

            // Check duplicates
            const taxId = row['מספר עוסק']?.toString().trim() || row['ח.פ']?.toString().trim()

            if (existingNames.has(name.toLowerCase())) {
                skippedCount++
                continue
            }
            if (taxId && existingTaxIds.has(taxId)) {
                skippedCount++
                continue
            }

            // Map Data
            const formData: ClientFormData = {
                name: name,
                taxId: taxId || undefined,
                email: row['כתובות מייל']?.toString().split(',')[0].trim() || undefined, // Take first email
                phone: row['נייד']?.toString().trim() || row['טלפון']?.toString().trim() || undefined,
                address: row['כתובת']?.toString().trim() || undefined,
                city: row['עיר']?.toString().trim() || undefined,

                // Bank Details
                bankName: getBankName(row['בנק']?.toString().trim()) || undefined,
                bankBranch: row['סניף']?.toString().trim() || undefined,
                bankAccount: row['מספר חשבון']?.toString().trim() || undefined,

                notes: row['הערות']?.toString().trim() || undefined,

                // Defaults
                isActive: true,
                subscriptionColor: '#3B82F6'
            }

            // Create Client
            const result = await createClient(formData, budgetType)
            if (result.success) {
                addedCount++
                // Add to sets to prevent duplicates within the file itself
                existingNames.add(name.toLowerCase())
                if (taxId) existingTaxIds.add(taxId)
            } else {
                console.error(`Failed to import client ${name}:`, result.error)
            }
        }

        revalidatePath('/dashboard')
        return { success: true, count: addedCount, skipped: skippedCount }

    } catch (error: any) {
        console.error('Failed to import clients:', error)
        return { success: false, error: 'Failed to import clients: ' + (error.message || 'Unknown error') }
    }
}
