'use server'

import { authenticatedPrisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

export type ExportType = 'clients' | 'incomes' | 'expenses' | 'suppliers' | 'invoices'

export async function getExportData(type: ExportType) {
    try {
        const { userId } = await auth();
        if (!userId) return { success: false, error: 'Unauthorized' };

        const db = await authenticatedPrisma(userId);

        let data;

        switch (type) {
            case 'clients':
                data = await db.client.findMany({
                    orderBy: { name: 'asc' }
                })
                break;
            case 'suppliers':
                data = await db.supplier.findMany({
                    orderBy: { name: 'asc' }
                })
                break;
            case 'incomes':
                data = await db.income.findMany({
                    include: { client: true, invoice: true },
                    orderBy: { date: 'desc' }
                })
                break;
            case 'expenses':
                data = await db.expense.findMany({
                    include: { supplier: true },
                    orderBy: { date: 'desc' }
                })
                break;
            case 'invoices':
                data = await db.invoice.findMany({
                    include: { client: true, lineItems: true },
                    orderBy: { issueDate: 'desc' }
                })
                break;
            default:
                return { success: false, error: 'Invalid export type' }
        }

        return { success: true, data }

    } catch (error) {
        console.error('Export error:', error)
        return { success: false, error: 'Failed to fetch data' }
    }
}
